import { NextRequest, NextResponse } from 'next/server';
import { PerformanceGoal, CreateGoalRequest } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/performance/goals - List performance goals
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      conditions.push(`pg.employee_id = $${paramIndex++}`);
      values.push(parseInt(employeeId));
    }

    if (status) {
      conditions.push(`pg.status = $${paramIndex++}`);
      values.push(status);
    }

    // Restrict to user's goals or company if not admin
    if (authResult.user.role === 'employee') {
      conditions.push(`pg.employee_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
    } else if (authResult.user.role === 'manager') {
      // Managers can see goals for employees in their department
      conditions.push(`e.department_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.department_id);
    } else if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       ${whereClause}`,
      values
    );

    // Get goals with employee info
    const goals = await db.query<PerformanceGoal & { employee_name?: string; department_name?: string; created_by_name?: string }>(
      `SELECT pg.*, e.first_name || ' ' || e.last_name as employee_name,
              d.name as department_name,
              c.first_name || ' ' || c.last_name as created_by_name
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees c ON pg.created_by = c.id
       ${whereClause}
       ORDER BY pg.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: goals,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get performance goals error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/performance/goals - Create performance goal
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateGoalRequest = await request.json();
    const { employee_id, title, description, due_date, milestones } = body;

    if (!employee_id || !title) {
      return NextResponse.json(
        { success: false, message: 'Employee ID and title are required' },
        { status: 400 }
      );
    }

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

    // Check permissions
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

    // Create goal
    const newGoal = await db.queryOne<PerformanceGoal>(
      `INSERT INTO performance_goals (employee_id, title, description, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [employee_id, title, description, due_date, authResult.user.employee?.id]
    );

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      for (const milestone of milestones) {
        await db.query(
          'INSERT INTO goal_milestones (goal_id, title, description) VALUES ($1, $2, $3)',
          [newGoal?.id, milestone.title, milestone.description]
        );
      }
    }

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'performance_goal',
      newGoal?.id,
      undefined,
      newGoal || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newGoal,
      message: 'Performance goal created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create performance goal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}