import { NextRequest, NextResponse } from 'next/server';
import { OnboardingTask, OnboardingTaskItem } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateOnboardingTaskRequest {
  title?: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  location?: string;
  welcome_message?: string;
  status?: OnboardingTask['status'];
  progress_percentage?: number;
}

// GET /api/onboarding/tasks/[id] - Get onboarding task by ID
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Get task with employee and task items info
    const task = await db.queryOne<OnboardingTask & {
      employee_name?: string;
      department_name?: string;
      assigned_by_name?: string;
    }>(
      `SELECT ot.*, e.first_name || ' ' || e.last_name as employee_name,
              d.name as department_name,
              a.first_name || ' ' || a.last_name as assigned_by_name
       FROM onboarding_tasks ot
       LEFT JOIN employees e ON ot.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees a ON ot.assigned_by = a.id
       WHERE ot.id = $1`,
      [taskId]
    );

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Onboarding task not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [task.employee_id]
    );

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== task.employee_id) {
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

    // Get task items
    const taskItems = await db.query<OnboardingTaskItem>(
      'SELECT * FROM onboarding_task_items WHERE task_id = $1 ORDER BY created_at',
      [taskId]
    );

    // Get task contacts
    const taskContacts = await db.query(
      'SELECT * FROM onboarding_contacts WHERE task_id = $1 ORDER BY created_at',
      [taskId]
    );

    // Get task comments
    const taskComments = await db.query(
      `SELECT oc.*, e.first_name || ' ' || e.last_name as created_by_name
       FROM onboarding_comments oc
       LEFT JOIN employees e ON oc.created_by = e.id
       WHERE oc.task_id = $1 ORDER BY oc.created_at`,
      [taskId]
    );

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        task_items: taskItems,
        contacts: taskContacts,
        comments: taskComments,
      },
    });
  } catch (error) {
    console.error('Get onboarding task error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/onboarding/tasks/[id] - Update onboarding task
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    const body: UpdateOnboardingTaskRequest = await request.json();

    // Get current task
    const currentTask = await db.queryOne<OnboardingTask>(
      'SELECT * FROM onboarding_tasks WHERE id = $1',
      [taskId]
    );

    if (!currentTask) {
      return NextResponse.json(
        { success: false, message: 'Onboarding task not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [currentTask.employee_id]
    );

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== currentTask.employee_id) {
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

    const updateFields = [
      'title', 'description', 'start_date', 'due_date', 'location',
      'welcome_message', 'status', 'progress_percentage'
    ];

    updateFields.forEach(field => {
      if (body[field as keyof UpdateOnboardingTaskRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(body[field as keyof UpdateOnboardingTaskRequest]);
      }
    });

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(taskId);

    const updatedTask = await db.queryOne<OnboardingTask>(
      `UPDATE onboarding_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'onboarding_task',
      taskId,
      currentTask,
      updatedTask || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Onboarding task updated successfully',
    });
  } catch (error) {
    console.error('Update onboarding task error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/onboarding/tasks/[id] - Delete onboarding task
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

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Get task before deletion
    const task = await db.queryOne<OnboardingTask>(
      'SELECT * FROM onboarding_tasks WHERE id = $1',
      [taskId]
    );

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Onboarding task not found' },
        { status: 404 }
      );
    }

    // Get employee info for permission checks
    const employee = await db.queryOne(
      'SELECT company_id, department_id FROM employees WHERE id = $1',
      [task.employee_id]
    );

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== task.employee_id) {
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

    // Delete task items, contacts, and comments first
    await db.query('DELETE FROM onboarding_task_items WHERE task_id = $1', [taskId]);
    await db.query('DELETE FROM onboarding_contacts WHERE task_id = $1', [taskId]);
    await db.query('DELETE FROM onboarding_comments WHERE task_id = $1', [taskId]);

    // Delete task
    await db.query('DELETE FROM onboarding_tasks WHERE id = $1', [taskId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'onboarding_task',
      taskId,
      task,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Onboarding task deleted successfully',
    });
  } catch (error) {
    console.error('Delete onboarding task error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}