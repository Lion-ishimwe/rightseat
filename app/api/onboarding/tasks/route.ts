import { NextRequest, NextResponse } from 'next/server';
import { OnboardingTask } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateOnboardingTaskRequest {
  employee_id: number;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  location?: string;
  welcome_message?: string;
  template_id?: number;
}

// GET /api/onboarding/tasks - List onboarding tasks
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
      conditions.push(`ot.employee_id = $${paramIndex++}`);
      values.push(parseInt(employeeId));
    }

    if (status) {
      conditions.push(`ot.status = $${paramIndex++}`);
      values.push(status);
    }

    // Restrict to user's tasks or company if not admin
    if (authResult.user.role === 'employee') {
      conditions.push(`ot.employee_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
    } else if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM onboarding_tasks ot
       LEFT JOIN employees e ON ot.employee_id = e.id
       ${whereClause}`,
      values
    );

    // Get onboarding tasks with employee info
    const tasks = await db.query<OnboardingTask & { employee_name?: string; department_name?: string; assigned_by_name?: string }>(
      `SELECT ot.*, e.first_name || ' ' || e.last_name as employee_name,
              d.name as department_name,
              a.first_name || ' ' || a.last_name as assigned_by_name
       FROM onboarding_tasks ot
       LEFT JOIN employees e ON ot.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees a ON ot.assigned_by = a.id
       ${whereClause}
       ORDER BY ot.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get onboarding tasks error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding/tasks - Create onboarding task
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateOnboardingTaskRequest = await request.json();
    const {
      employee_id,
      title,
      description,
      start_date,
      due_date,
      location,
      welcome_message,
      template_id
    } = body;

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

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== employee.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Create onboarding task
    const newTask = await db.queryOne<OnboardingTask>(
      `INSERT INTO onboarding_tasks (
        employee_id, template_id, title, description, start_date, due_date,
        location, welcome_message, assigned_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        employee_id, template_id, title, description, start_date, due_date,
        location, welcome_message, authResult.user.employee?.id
      ]
    );

    // If template is provided, copy template items
    if (template_id) {
      const templateItems = await db.query(
        'SELECT item_type, title, description, is_required, order_index FROM onboarding_template_items WHERE template_id = $1 ORDER BY order_index',
        [template_id]
      );

      for (const item of templateItems) {
        await db.query(
          'INSERT INTO onboarding_task_items (task_id, item_type, title, description, is_required) VALUES ($1, $2, $3, $4, $5)',
          [newTask?.id, item.item_type, item.title, item.description, item.is_required]
        );
      }
    }

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'onboarding_task',
      newTask?.id,
      undefined,
      newTask || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Onboarding task created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create onboarding task error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}