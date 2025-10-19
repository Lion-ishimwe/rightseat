import { NextRequest, NextResponse } from 'next/server';
import { Department } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  manager_id?: number;
}

// GET /api/departments/[id] - Get department by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const departmentId = parseInt(resolvedParams.id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // Get department with manager and company info
    const department = await db.queryOne<Department & { manager_name?: string; company_name?: string }>(
      `SELECT d.*, u.first_name || ' ' || u.last_name as manager_name, c.name as company_name
       FROM departments d
       LEFT JOIN employees u ON d.manager_id = u.id
       LEFT JOIN companies c ON d.company_id = c.id
       WHERE d.id = $1`,
      [departmentId]
    );

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this department's data
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== department.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Get department error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const departmentId = parseInt(resolvedParams.id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body: UpdateDepartmentRequest = await request.json();
    const { name, description, manager_id } = body;

    // Get current department data
    const currentDepartment = await db.queryOne<Department>(
      'SELECT * FROM departments WHERE id = $1',
      [departmentId]
    );

    if (!currentDepartment) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== currentDepartment.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if name is already taken by another department in the same company
    if (name && name !== currentDepartment.name) {
      const existingDepartment = await db.queryOne<Department>(
        'SELECT id FROM departments WHERE name = $1 AND company_id = $2 AND id != $3',
        [name, currentDepartment.company_id, departmentId]
      );

      if (existingDepartment) {
        return NextResponse.json(
          { success: false, message: 'Department with this name already exists in the company' },
          { status: 409 }
        );
      }
    }

    // Verify manager belongs to the same company
    if (manager_id !== undefined) {
      if (manager_id) {
        const manager = await db.queryOne(
          'SELECT id FROM employees WHERE id = $1 AND company_id = $2 AND is_active = true',
          [manager_id, currentDepartment.company_id]
        );

        if (!manager) {
          return NextResponse.json(
            { success: false, message: 'Invalid manager for this company' },
            { status: 400 }
          );
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (manager_id !== undefined) {
      updates.push(`manager_id = $${paramIndex++}`);
      values.push(manager_id);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(departmentId);

    const updatedDepartment = await db.queryOne<Department>(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'department',
      departmentId,
      currentDepartment,
      updatedDepartment || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully',
    });
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const departmentId = parseInt(resolvedParams.id);
    if (isNaN(departmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // Get department data before deletion
    const departmentToDelete = await db.queryOne<Department>(
      'SELECT * FROM departments WHERE id = $1',
      [departmentId]
    );

    if (!departmentToDelete) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== departmentToDelete.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if department has employees
    const employeeCount = await db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM employees WHERE department_id = $1 AND is_active = true',
      [departmentId]
    );

    if (employeeCount && employeeCount.count > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete department with active employees. Please reassign employees first.' },
        { status: 400 }
      );
    }

    // Delete department
    await db.query('DELETE FROM departments WHERE id = $1', [departmentId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'department',
      departmentId,
      departmentToDelete,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}