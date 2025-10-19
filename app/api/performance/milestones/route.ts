import { NextRequest, NextResponse } from 'next/server';
import { GoalMilestone } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateMilestoneRequest {
  goal_id: number;
  title: string;
  description?: string;
}

interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  is_completed?: boolean;
  comment?: string;
}

// GET /api/performance/milestones - List milestones for a goal
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
    const goalId = searchParams.get('goal_id');

    if (!goalId) {
      return NextResponse.json(
        { success: false, message: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this goal
    const goal = await db.queryOne(
      `SELECT pg.employee_id, e.company_id, e.department_id
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       WHERE pg.id = $1`,
      [parseInt(goalId)]
    );

    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'Goal not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== goal.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== goal.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get milestones
    const milestones = await db.query<GoalMilestone>(
      'SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY created_at',
      [parseInt(goalId)]
    );

    return NextResponse.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/performance/milestones - Create milestone
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateMilestoneRequest = await request.json();
    const { goal_id, title, description } = body;

    if (!goal_id || !title) {
      return NextResponse.json(
        { success: false, message: 'Goal ID and title are required' },
        { status: 400 }
      );
    }

    // Check if user has access to this goal
    const goal = await db.queryOne(
      `SELECT pg.employee_id, e.company_id, e.department_id
       FROM performance_goals pg
       LEFT JOIN employees e ON pg.employee_id = e.id
       WHERE pg.id = $1`,
      [goal_id]
    );

    if (!goal) {
      return NextResponse.json(
        { success: false, message: 'Goal not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== goal.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role === 'manager' && authResult.user.employee?.department_id !== goal.department_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== goal.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Create milestone
    const newMilestone = await db.queryOne<GoalMilestone>(
      'INSERT INTO goal_milestones (goal_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [goal_id, title, description]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'goal_milestone',
      newMilestone?.id,
      undefined,
      newMilestone || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newMilestone,
      message: 'Milestone created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create milestone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}