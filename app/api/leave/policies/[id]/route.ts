import { NextRequest, NextResponse } from 'next/server';
import { LeavePolicy } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateLeavePolicyRequest {
  policy_name?: string;
  annual_leave_days?: number;
  sick_leave_days?: number;
  personal_leave_days?: number;
  maternity_leave_days?: number;
  paternity_leave_days?: number;
  study_leave_days?: number;
  carry_forward_limit?: number;
  is_default?: boolean;
}

// GET /api/leave/policies/[id] - Get leave policy by ID
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

    const policyId = parseInt(params.id);
    if (isNaN(policyId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave policy ID' },
        { status: 400 }
      );
    }

    // Get leave policy with company info
    const leavePolicy = await db.queryOne<LeavePolicy & { company_name?: string }>(
      `SELECT lp.*, c.name as company_name
       FROM leave_policies lp
       LEFT JOIN companies c ON lp.company_id = c.id
       WHERE lp.id = $1`,
      [policyId]
    );

    if (!leavePolicy) {
      return NextResponse.json(
        { success: false, message: 'Leave policy not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this policy's data
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== leavePolicy.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leavePolicy,
    });
  } catch (error) {
    console.error('Get leave policy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/leave/policies/[id] - Update leave policy
export async function PUT(
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

    const policyId = parseInt(params.id);
    if (isNaN(policyId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave policy ID' },
        { status: 400 }
      );
    }

    const body: UpdateLeavePolicyRequest = await request.json();

    // Get current leave policy
    const currentPolicy = await db.queryOne<LeavePolicy>(
      'SELECT * FROM leave_policies WHERE id = $1',
      [policyId]
    );

    if (!currentPolicy) {
      return NextResponse.json(
        { success: false, message: 'Leave policy not found' },
        { status: 404 }
      );
    }

    // Check if policy name is already taken by another policy in the same company
    if (body.policy_name && body.policy_name !== currentPolicy.policy_name) {
      const existingPolicy = await db.queryOne<LeavePolicy>(
        'SELECT id FROM leave_policies WHERE policy_name = $1 AND company_id = $2 AND id != $3',
        [body.policy_name, currentPolicy.company_id, policyId]
      );

      if (existingPolicy) {
        return NextResponse.json(
          { success: false, message: 'Policy with this name already exists in the company' },
          { status: 409 }
        );
      }
    }

    // If this is set as default, unset other defaults
    if (body.is_default) {
      await db.query(
        'UPDATE leave_policies SET is_default = false WHERE company_id = $1 AND id != $2',
        [currentPolicy.company_id, policyId]
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateFields = [
      'policy_name', 'annual_leave_days', 'sick_leave_days', 'personal_leave_days',
      'maternity_leave_days', 'paternity_leave_days', 'study_leave_days', 'carry_forward_limit', 'is_default'
    ];

    updateFields.forEach(field => {
      if (body[field as keyof UpdateLeavePolicyRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(body[field as keyof UpdateLeavePolicyRequest]);
      }
    });

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(policyId);

    const updatedPolicy = await db.queryOne<LeavePolicy>(
      `UPDATE leave_policies SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'leave_policy',
      policyId,
      currentPolicy,
      updatedPolicy || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
      message: 'Leave policy updated successfully',
    });
  } catch (error) {
    console.error('Update leave policy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/leave/policies/[id] - Delete leave policy
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

    const policyId = parseInt(params.id);
    if (isNaN(policyId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave policy ID' },
        { status: 400 }
      );
    }

    // Get leave policy before deletion
    const leavePolicy = await db.queryOne<LeavePolicy>(
      'SELECT * FROM leave_policies WHERE id = $1',
      [policyId]
    );

    if (!leavePolicy) {
      return NextResponse.json(
        { success: false, message: 'Leave policy not found' },
        { status: 404 }
      );
    }

    // Check if policy is in use
    const usageCount = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM employees WHERE company_id = $1',
      [leavePolicy.company_id]
    );

    if (usageCount && usageCount.count > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete policy that is assigned to employees' },
        { status: 400 }
      );
    }

    // Delete leave policy
    await db.query('DELETE FROM leave_policies WHERE id = $1', [policyId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'leave_policy',
      policyId,
      leavePolicy,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Leave policy deleted successfully',
    });
  } catch (error) {
    console.error('Delete leave policy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}