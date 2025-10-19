import { NextRequest, NextResponse } from 'next/server';
import { PerformanceGoal, GoalMilestone } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateGoalRequest {
  title?: string;
  description?: string;
  due_date?: string;
  status?: PerformanceGoal['status'];
  progress_percentage?: number;
}

interface CreateMilestoneRequest {
  title: string;
  description?: string;
}

// GET /api/performance/goals/[id] - Get performance goal by ID
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

    const goalId = parseInt(params.id);
    if (isNaN(goalId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    // Get goal with employee and milestone info
    const goal = await db.queryOne<PerformanceGoal & {
      employee_name?: string;
      department_name?: string;
      created_by_name?: string;
    }>(
      `SELECT pg.*, e.first_name || ' ' || e.last_name as employee_name,
              d.name as department_name,
              c.first_name || ' ' || c.last_name as created_by_name
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees c ON pg.created_by = c.id
       WHERE pg.id = $1`,
      [goalId]
    );

    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'Performance goal not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [goal.employee_id]
    );

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal.employee_id) {
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

    // Get milestones
    const milestones = await db.query<GoalMilestone>(
      'SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY created_at',
      [goalId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...goal,
        milestones,
      },
    });
  } catch (error) {
    console.error('Get performance goal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/performance/goals/[id] - Update performance goal
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

    const goalId = parseInt(params.id);
    if (isNaN(goalId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const body: UpdateGoalRequest = await request.json();

    // Get current goal
    const currentGoal = await db.queryOne<PerformanceGoal>(
      'SELECT * FROM performance_goals WHERE id = $1',
      [goalId]
    );

    if (!currentGoal) {
      return NextResponse.json(
        { success: false, message: 'Performance goal not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [currentGoal.employee_id]
    );

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== currentGoal.employee_id) {
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

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateFields = ['title', 'description', 'due_date', 'status', 'progress_percentage'];

    updateFields.forEach(field => {
      if (body[field as keyof UpdateGoalRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(body[field as keyof UpdateGoalRequest]);
      }
    });

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(goalId);

    const updatedGoal = await db.queryOne<PerformanceGoal>(
      `UPDATE performance_goals SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'performance_goal',
      goalId,
      currentGoal,
      updatedGoal || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedGoal,
      message: 'Performance goal updated successfully',
    });
  } catch (error) {
    console.error('Update performance goal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/performance/goals/[id] - Delete performance goal
export async function DELETE(
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

    const goalId = parseInt(params.id);
    if (isNaN(goalId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    // Get goal before deletion
    const goal = await db.queryOne<PerformanceGoal>(
      'SELECT * FROM performance_goals WHERE id = $1',
      [goalId]
    );

    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'Performance goal not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [goal.employee_id]
    );

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal.employee_id) {
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

    // Delete goal milestones first
    await db.query('DELETE FROM goal_milestones WHERE goal_id = $1', [goalId]);

    // Delete goal attachments
    await db.query('DELETE FROM goal_attachments WHERE goal_id = $1', [goalId]);

    // Delete goal
    await db.query('DELETE FROM performance_goals WHERE id = $1', [goalId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'performance_goal',
      goalId,
      goal,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Performance goal deleted successfully',
    });
  } catch (error) {
    console.error('Delete performance goal error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}