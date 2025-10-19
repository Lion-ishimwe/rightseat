import { NextRequest, NextResponse } from 'next/server';
import { Department } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateDepartmentRequest {
  name: string;
  description?: string;
  manager_id?: number;
  company_id?: number;
}

interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  id: number;
}

// GET /api/departments - List departments
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
    const search = searchParams.get('search');

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      conditions.push(`d.company_id = $${paramIndex++}`);
      values.push(parseInt(companyId));
    }

    if (search) {
      conditions.push(`d.name ILIKE $${paramIndex}`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Restrict to user's company if not admin
    if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`d.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get departments with manager info
    const departments = await db.query<Department & { manager_name?: string; company_name?: string }>(
      `SELECT d.*, u.first_name || ' ' || u.last_name as manager_name, c.name as company_name
       FROM departments d
       LEFT JOIN employees u ON d.manager_id = u.id
       LEFT JOIN companies c ON d.company_id = c.id
       ${whereClause}
       ORDER BY d.name`,
      values
    );

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateDepartmentRequest = await request.json();
    const { name, description, manager_id, company_id } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Department name is required' },
        { status: 400 }
      );
    }

    // Determine company ID
    let finalCompanyId: number;
    if (authResult.user.role === 'admin') {
      finalCompanyId = company_id || 1; // Default company
    } else if (authResult.user.employee) {
      finalCompanyId = authResult.user.employee.company_id;
    } else {
      return NextResponse.json(
        { success: false, message: 'Unable to determine company' },
        { status: 400 }
      );
    }

    // Check if department name already exists in the company
    const existingDepartment = await db.queryOne<Department>(
      'SELECT id FROM departments WHERE name = $1 AND company_id = $2',
      [name, finalCompanyId]
    );

    if (existingDepartment) {
      return NextResponse.json(
        { success: false, message: 'Department with this name already exists in the company' },
        { status: 409 }
      );
    }

    // Verify manager belongs to the same company
    if (manager_id) {
      const manager = await db.queryOne(
        'SELECT id FROM employees WHERE id = $1 AND company_id = $2 AND is_active = true',
        [manager_id, finalCompanyId]
      );

      if (!manager) {
        return NextResponse.json(
          { success: false, message: 'Invalid manager for this company' },
          { status: 400 }
        );
      }
    }

    // Create department
    const newDepartment = await db.queryOne<Department>(
      'INSERT INTO departments (company_id, name, description, manager_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [finalCompanyId, name, description, manager_id]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'department',
      newDepartment?.id,
      undefined,
      newDepartment || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newDepartment,
      message: 'Department created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}