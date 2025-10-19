import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Employee, User, CreateEmployeeRequest, UpdateEmployeeRequest } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/employees - List employees with optional filtering
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
    const departmentId = searchParams.get('department_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = ['e.is_active = true'];
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(parseInt(companyId));
    }

    if (departmentId) {
      conditions.push(`e.department_id = $${paramIndex++}`);
      values.push(parseInt(departmentId));
    }

    if (status) {
      conditions.push(`e.employment_status = $${paramIndex++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Restrict to user's company if not admin
    if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM employees e ${whereClause}`,
      values
    );

    // Get employees with department info
    const employees = await db.query<Employee & { department_name?: string }>(
      `SELECT e.*, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereClause}
       ORDER BY e.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateEmployeeRequest = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      nationality,
      id_number,
      rssb_number,
      marital_status,
      job_title,
      hire_date,
      department_id,
      employment_status = 'active'
    } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmployee = await db.queryOne<Employee>(
      'SELECT id FROM employees WHERE email = $1 AND is_active = true',
      [email]
    );

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: 'Employee with this email already exists' },
        { status: 409 }
      );
    }

    // Get company ID from authenticated user
    let companyId: number;
    if (authResult.user.role === 'admin') {
      // Admin can specify company or use default
      companyId = 1; // Default company
    } else if (authResult.user.employee) {
      companyId = authResult.user.employee.company_id;
    } else {
      return NextResponse.json(
        { success: false, message: 'Unable to determine company' },
        { status: 400 }
      );
    }

    // Generate employee code
    const employeeCode = await generateEmployeeCode(companyId);

    // Create employee
    const newEmployee = await db.queryOne<Employee>(
      `INSERT INTO employees (
        company_id, employee_code, first_name, last_name, email, phone,
        date_of_birth, gender, nationality, id_number, rssb_number,
        marital_status, job_title, hire_date, department_id, employment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        companyId, employeeCode, first_name, last_name, email, phone,
        date_of_birth, gender, nationality, id_number, rssb_number,
        marital_status, job_title, hire_date, department_id, employment_status
      ]
    );

    // Create user account for the employee with 'employee' role
    const defaultPassword = 'password123'; // Default password for new employees
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await db.queryOne<User>(
      'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, passwordHash, 'employee', true]
    );

    // Update employee with user_id
    if (newUser && newEmployee) {
      await db.query(
        'UPDATE employees SET user_id = $1 WHERE id = $2',
        [newUser.id, newEmployee.id]
      );
    }

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'employee',
      newEmployee?.id,
      undefined,
      newEmployee || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newEmployee,
      message: 'Employee created successfully with user account',
    }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate employee code
async function generateEmployeeCode(companyId: number): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = 'EMP';

  // Get the next sequence number
  const result = await db.queryOne<{ next_val: number }>(
    "SELECT nextval('employee_code_seq') as next_val"
  );

  if (!result) {
    // Fallback if sequence doesn't exist
    const count = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM employees WHERE company_id = $1',
      [companyId]
    );
    return `${prefix}${year}${String((count?.count || 0) + 1).padStart(4, '0')}`;
  }

  return `${prefix}${year}${String(result.next_val).padStart(4, '0')}`;
}