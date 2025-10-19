import { NextRequest, NextResponse } from 'next/server';
import { LeavePolicy } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateLeavePolicyRequest {
  policy_name: string;
  annual_leave_days?: number;
  sick_leave_days?: number;
  personal_leave_days?: number;
  maternity_leave_days?: number;
  paternity_leave_days?: number;
  study_leave_days?: number;
  carry_forward_limit?: number;
  company_id?: number;
  is_default?: boolean;
}

interface UpdateLeavePolicyRequest extends Partial<CreateLeavePolicyRequest> {
  id: number;
}

// GET /api/leave/policies - List leave policies
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
    const companyId = searchParams.get('company_id');
    const isDefault = searchParams.get('is_default');

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      conditions.push(`lp.company_id = $${paramIndex++}`);
      values.push(parseInt(companyId));
    }

    if (isDefault !== null) {
      conditions.push(`lp.is_default = $${paramIndex++}`);
      values.push(isDefault === 'true');
    }

    // Restrict to user's company if not admin
    if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`lp.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get leave policies with company info
    const leavePolicies = await db.query<LeavePolicy & { company_name?: string }>(
      `SELECT lp.*, c.name as company_name
       FROM leave_policies lp
       LEFT JOIN companies c ON lp.company_id = c.id
       ${whereClause}
       ORDER BY lp.policy_name`,
      values
    );

    return NextResponse.json({
      success: true,
      data: leavePolicies,
    });
  } catch (error) {
    console.error('Get leave policies error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leave/policies - Create leave policy
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body: CreateLeavePolicyRequest = await request.json();
    const {
      policy_name,
      annual_leave_days = 25,
      sick_leave_days = 12,
      personal_leave_days = 5,
      maternity_leave_days = 90,
      paternity_leave_days = 15,
      study_leave_days = 10,
      carry_forward_limit = 5,
      company_id
    } = body;

    if (!policy_name) {
      return NextResponse.json(
        { success: false, message: 'Policy name is required' },
        { status: 400 }
      );
    }

    // Determine company ID
    let finalCompanyId: number;
    if (authResult.user.role === 'admin') {
      finalCompanyId = company_id || 1; // Default company
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if policy name already exists in the company
    const existingPolicy = await db.queryOne<LeavePolicy>(
      'SELECT id FROM leave_policies WHERE policy_name = $1 AND company_id = $2',
      [policy_name, finalCompanyId]
    );

    if (existingPolicy) {
      return NextResponse.json(
        { success: false, message: 'Policy with this name already exists in the company' },
        { status: 409 }
      );
    }

    // If this is set as default, unset other defaults
    const isDefault = body.is_default || false;
    if (isDefault) {
      await db.query(
        'UPDATE leave_policies SET is_default = false WHERE company_id = $1',
        [finalCompanyId]
      );
    }

    // Create leave policy
    const newPolicy = await db.queryOne<LeavePolicy>(
      `INSERT INTO leave_policies (
        company_id, policy_name, annual_leave_days, sick_leave_days, personal_leave_days,
        maternity_leave_days, paternity_leave_days, study_leave_days, carry_forward_limit, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        finalCompanyId, policy_name, annual_leave_days, sick_leave_days, personal_leave_days,
        maternity_leave_days, paternity_leave_days, study_leave_days, carry_forward_limit, isDefault
      ]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'leave_policy',
      newPolicy?.id,
      undefined,
      newPolicy || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newPolicy,
      message: 'Leave policy created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create leave policy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}