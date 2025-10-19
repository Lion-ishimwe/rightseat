import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        firstName: auth.user.employee?.first_name || '',
        lastName: auth.user.employee?.last_name || '',
        role: auth.user.role,
        isActive: auth.user.is_active,
        employee: auth.user.employee ? {
          id: auth.user.employee.id,
          employeeId: auth.user.employee.employee_code,
          department: auth.user.employee.department_id,
          position: auth.user.employee.job_title,
          hireDate: auth.user.employee.hire_date,
          status: auth.user.employee.employment_status
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}