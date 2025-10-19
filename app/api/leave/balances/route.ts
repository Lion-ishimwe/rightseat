import { NextRequest, NextResponse } from 'next/server';
import { EmployeeLeaveBalance } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate } from '@/lib/middleware/auth';

// GET /api/leave/balances - List leave balances
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
    const leaveType = searchParams.get('leave_type');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Build query conditions
    const conditions: string[] = [`elb.year = $${1}`];
    const values: any[] = [parseInt(year)];
    let paramIndex = 2;

    if (employeeId) {
      conditions.push(`elb.employee_id = $${paramIndex++}`);
      values.push(parseInt(employeeId));
    }

    if (leaveType) {
      conditions.push(`elb.leave_type = $${paramIndex++}`);
      values.push(leaveType);
    }

    // Restrict to user's company or own balances if not admin/manager
    if (authResult.user.role === 'employee') {
      conditions.push(`elb.employee_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
    } else if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get leave balances with employee info
    const leaveBalances = await db.query<EmployeeLeaveBalance & { employee_name?: string; department_name?: string }>(
      `SELECT elb.*, e.first_name || ' ' || e.last_name as employee_name, d.name as department_name
       FROM employee_leave_balances elb
       LEFT JOIN employees e ON elb.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereClause}
       ORDER BY e.first_name, e.last_name, elb.leave_type`,
      values
    );

    return NextResponse.json({
      success: true,
      data: leaveBalances,
    });
  } catch (error) {
    console.error('Get leave balances error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}