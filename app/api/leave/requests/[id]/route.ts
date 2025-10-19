import { NextRequest, NextResponse } from 'next/server';
import { LeaveRequest } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateLeaveRequestStatus {
  status: 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string;
}

// GET /api/leave/requests/[id] - Get leave request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave request ID' },
        { status: 400 }
      );
    }

    // Get leave request with employee and approver info
    const leaveRequest = await db.queryOne<LeaveRequest & {
      employee_name?: string;
      department_name?: string;
      approver_name?: string;
    }>(
      `SELECT lr.*,
              e.first_name || ' ' || e.last_name as employee_name,
              d.name as department_name,
              a.first_name || ' ' || a.last_name as approver_name
       FROM leave_requests lr
       LEFT JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees a ON lr.approved_by = a.id
       WHERE lr.id = $1`,
      [requestId]
    );

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [leaveRequest.employee_id]
    );

    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== leaveRequest.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== employee?.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== employee?.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/leave/requests/[id] - Update leave request (approve/reject/cancel)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave request ID' },
        { status: 400 }
      );
    }

    const body: UpdateLeaveRequestStatus = await request.json();
    const { status, rejection_reason } = body;

    if (!status || !['approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Valid status is required (approved, rejected, cancelled)' },
        { status: 400 }
      );
    }

    // Get current leave request
    const currentRequest = await db.queryOne<LeaveRequest>(
      'SELECT * FROM leave_requests WHERE id = $1',
      [requestId]
    );

    if (!currentRequest) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [currentRequest.employee_id]
    );

    // Check permissions
    if (status === 'cancelled') {
      // Only the employee who created the request can cancel it
      if (authResult.user.employee?.id !== currentRequest.employee_id) {
        return NextResponse.json(
          { success: false, message: 'Only the request creator can cancel the request' },
          { status: 403 }
        );
      }
    } else {
      // Only managers and admins can approve/reject
      if (authResult.user.role === 'employee') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }

      if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== employee?.department_id) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }

      if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== employee?.company_id) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Update leave request
    const updateFields = ['status = $1'];
    const values: any[] = [status];
    let paramIndex = 2;

    if (status === 'approved' || status === 'rejected') {
      updateFields.push(`approved_by = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
      updateFields.push(`approved_at = NOW()`);
    }

    if (status === 'rejected' && rejection_reason) {
      updateFields.push(`rejection_reason = $${paramIndex++}`);
      values.push(rejection_reason);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(requestId);

    const updatedRequest = await db.queryOne<LeaveRequest>(
      `UPDATE leave_requests SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // If approved, update leave balance
    if (status === 'approved') {
      const currentYear = new Date().getFullYear();
      await db.query(
        `UPDATE employee_leave_balances
         SET used = used + $1, remaining = remaining - $1, updated_at = NOW()
         WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
        [currentRequest.total_days, currentRequest.employee_id, currentRequest.leave_type, currentYear]
      );
    }

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'leave_request',
      requestId,
      currentRequest,
      updatedRequest || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/leave/requests/[id] - Delete leave request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const requestId = parseInt(params.id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave request ID' },
        { status: 400 }
      );
    }

    // Get leave request before deletion
    const leaveRequest = await db.queryOne<LeaveRequest>(
      'SELECT * FROM leave_requests WHERE id = $1',
      [requestId]
    );

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found' },
        { status: 404 }
      );
    }

    // If approved, restore leave balance
    if (leaveRequest.status === 'approved') {
      const currentYear = new Date().getFullYear();
      await db.query(
        `UPDATE employee_leave_balances
         SET used = used - $1, remaining = remaining + $1, updated_at = NOW()
         WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
        [leaveRequest.total_days, leaveRequest.employee_id, leaveRequest.leave_type, currentYear]
      );
    }

    // Delete leave request
    await db.query('DELETE FROM leave_requests WHERE id = $1', [requestId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'leave_request',
      requestId,
      leaveRequest,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    console.error('Delete leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}