import { NextRequest, NextResponse } from 'next/server';
import { GoalMilestone } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  is_completed?: boolean;
  comment?: string;
}

// GET /api/performance/milestones/[id] - Get milestone by ID
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

    const milestoneId = parseInt(params.id);
    if (isNaN(milestoneId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid milestone ID' },
        { status: 400 }
      );
    }

    // Get milestone with goal info
    const milestone = await db.queryOne<GoalMilestone & { goal_title?: string; employee_name?: string }>(
      `SELECT gm.*, pg.title as goal_title, e.first_name || ' ' || e.last_name as employee_name
       FROM goal_milestones gm
       LEFT JOIN performance_goals pg ON gm.goal_id = pg.id
       LEFT JOIN employees e ON pg.employee_id = e.id
       WHERE gm.id = $1`,
      [milestoneId]
    );

    if (!milestone) {
      return NextResponse.json(
        { success: false, message: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Check permissions via goal
    const goal = await db.queryOne(
      `SELECT pg.employee_id, e.company_id, e.department_id
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       WHERE pg.id = $1`,
      [milestone.goal_id]
    );

    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal?.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== goal?.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== goal?.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    console.error('Get milestone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/performance/milestones/[id] - Update milestone
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

    const milestoneId = parseInt(params.id);
    if (isNaN(milestoneId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid milestone ID' },
        { status: 400 }
      );
    }

    const body: UpdateMilestoneRequest = await request.json();

    // Get current milestone
    const currentMilestone = await db.queryOne<GoalMilestone>(
      'SELECT * FROM goal_milestones WHERE id = $1',
      [milestoneId]
    );

    if (!currentMilestone) {
      return NextResponse.json(
        { success: false, message: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Check permissions via goal
    const goal = await db.queryOne(
      `SELECT pg.employee_id, e.company_id, e.department_id
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       WHERE pg.id = $1`,
      [currentMilestone.goal_id]
    );

    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal?.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== goal?.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== goal?.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title);
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }

    if (body.is_completed !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      values.push(body.is_completed);

      if (body.is_completed && !currentMilestone.completed_at) {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (body.comment !== undefined) {
      updates.push(`comment = $${paramIndex++}`);
      values.push(body.comment);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(milestoneId);

    const updatedMilestone = await db.queryOne<GoalMilestone>(
      `UPDATE goal_milestones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'goal_milestone',
      milestoneId,
      currentMilestone,
      updatedMilestone || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedMilestone,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/performance/milestones/[id] - Delete milestone
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

    const milestoneId = parseInt(params.id);
    if (isNaN(milestoneId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid milestone ID' },
        { status: 400 }
      );
    }

    // Get milestone before deletion
    const milestone = await db.queryOne<GoalMilestone>(
      'SELECT * FROM goal_milestones WHERE id = $1',
      [milestoneId]
    );

    if (!milestone) {
      return NextResponse.json(
        { success: false, message: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Check permissions via goal
    const goal = await db.queryOne(
      `SELECT pg.employee_id, e.company_id, e.department_id
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       WHERE pg.id = $1`,
      [milestone.goal_id]
    );

    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal?.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== goal?.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== goal?.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete milestone
    await db.query('DELETE FROM goal_milestones WHERE id = $1', [milestoneId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'goal_milestone',
      milestoneId,
      milestone,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}