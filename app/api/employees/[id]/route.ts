import { NextRequest, NextResponse } from 'next/server';
import { Employee, UpdateEmployeeRequest } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/employees/[id] - Get employee by ID
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

    const employeeId = parseInt(params.id);
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // Get employee with department and company info
    const employee = await db.queryOne<Employee & { department_name?: string; company_name?: string }>(
      `SELECT e.*, d.name as department_name, c.name as company_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN companies c ON e.company_id = c.id
       WHERE e.id = $1 AND e.is_active = true`,
      [employeeId]
    );

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this employee's data
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== employee.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Update employee
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

    const employeeId = parseInt(params.id);
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const body: UpdateEmployeeRequest = await request.json();

    // Get current employee data
    const currentEmployee = await db.queryOne<Employee>(
      'SELECT * FROM employees WHERE id = $1 AND is_active = true',
      [employeeId]
    );

    if (!currentEmployee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== currentEmployee.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if email is already taken by another employee
    if (body.email && body.email !== currentEmployee.email) {
      const existingEmployee = await db.queryOne<Employee>(
        'SELECT id FROM employees WHERE email = $1 AND is_active = true AND id != $2',
        [body.email, employeeId]
      );

      if (existingEmployee) {
        return NextResponse.json(
          { success: false, message: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateFields = [
      'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
      'nationality', 'id_number', 'rssb_number', 'marital_status',
      'address_line1', 'address_line2', 'city', 'province', 'postal_code', 'country',
      'job_title', 'hire_date', 'contract_end_date', 'probation_end_date',
      'employment_status', 'work_location', 'reports_to',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_email',
      'emergency_contact_relationship', 'emergency_contact_address',
      'education_institution', 'education_degree', 'education_specialization',
      'education_start_date', 'education_end_date', 'profile_picture_url',
      'department_id'
    ];

    updateFields.forEach(field => {
      if (body[field as keyof UpdateEmployeeRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(body[field as keyof UpdateEmployeeRequest]);
      }
    });

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(employeeId);

    const updatedEmployee = await db.queryOne<Employee>(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'employee',
      employeeId,
      currentEmployee,
      updatedEmployee || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Delete employee (soft delete)
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

    const employeeId = parseInt(params.id);
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // Get employee data before deletion
    const employeeToDelete = await db.queryOne<Employee>(
      'SELECT * FROM employees WHERE id = $1 AND is_active = true',
      [employeeId]
    );

    if (!employeeToDelete) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== employeeToDelete.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (authResult.user.employee?.id === employeeId) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    await db.query(
      'UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1',
      [employeeId]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'employee',
      employeeId,
      employeeToDelete,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}