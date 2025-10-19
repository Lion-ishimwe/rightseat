import { NextRequest, NextResponse } from 'next/server';
import { LeaveRequest, CreateLeaveRequestRequest } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/leave/requests - List leave requests
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leave_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      conditions.push(`lr.employee_id = $${paramIndex++}`);
      values.push(parseInt(employeeId));
    }

    if (status) {
      conditions.push(`lr.status = $${paramIndex++}`);
      values.push(status);
    }

    if (leaveType) {
      conditions.push(`lr.leave_type = $${paramIndex++}`);
      values.push(leaveType);
    }

    // Restrict to user's company or own requests if not admin/manager
    if (authResult.user.role === 'employee') {
      conditions.push(`lr.employee_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
    } else if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM leave_requests lr
       LEFT JOIN employees e ON lr.employee_id = e.id
       ${whereClause}`,
      values
    );

    // Get leave requests with employee info
    const leaveRequests = await db.query<LeaveRequest & { employee_name?: string; department_name?: string }>(
      `SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, d.name as department_name
       FROM leave_requests lr
       LEFT JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereClause}
       ORDER BY lr.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: leaveRequests,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leave/requests - Create leave request
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateLeaveRequestRequest = await request.json();
    const { employee_id, leave_type, start_date, end_date, reason } = body;

    if (!employee_id || !leave_type || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, message: 'Employee ID, leave type, start date, and end date are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Calculate total days (excluding weekends if needed)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get employee info
    const employee = await db.queryOne(
      'SELECT id, company_id, department_id FROM employees WHERE id = $1 AND is_active = true',
      [employee_id]
    );

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions - employees can only create their own requests, managers can create for their department
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== employee.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await db.queryOne(
      'SELECT remaining FROM employee_leave_balances WHERE employee_id = $1 AND leave_type = $2 AND year = $3',
      [employee_id, leave_type, currentYear]
    );

    if (leaveBalance && leaveBalance.remaining < totalDays) {
      return NextResponse.json(
        { success: false, message: 'Insufficient leave balance' },
        { status: 400 }
      );
    }

    // Check for overlapping leave requests
    const overlappingRequest = await db.queryOne(
      `SELECT id FROM leave_requests
       WHERE employee_id = $1 AND status IN ('pending', 'approved')
       AND ((start_date <= $2 AND end_date >= $2) OR (start_date <= $3 AND end_date >= $3) OR (start_date >= $2 AND end_date <= $3))`,
      [employee_id, start_date, end_date]
    );

    if (overlappingRequest) {
      return NextResponse.json(
        { success: false, message: 'Leave request overlaps with existing approved or pending request' },
        { status: 409 }
      );
    }

    // Create leave request
    const newLeaveRequest = await db.queryOne<LeaveRequest>(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_id, leave_type, start_date, end_date, totalDays, reason]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'leave_request',
      newLeaveRequest?.id,
      undefined,
      newLeaveRequest || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newLeaveRequest,
      message: 'Leave request created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create leave request error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}