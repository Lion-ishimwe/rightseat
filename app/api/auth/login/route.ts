import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User, Employee, LoginRequest, LoginResponse } from '@/lib/models/types';
import { createAuthResponse } from '@/lib/middleware/auth';

// Temporary mock data for login page until database is ready
const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6', // admin123
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: new Date(),
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
  {
    id: 2,
    email: 'hr@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6', // admin123
    role: 'hr_manager',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: new Date(),
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
  {
    id: 3,
    email: 'manager@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6', // admin123
    role: 'manager',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: new Date(),
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
  {
    id: 4,
    email: 'employee@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6', // admin123
    role: 'employee',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: new Date(),
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
];

const mockEmployees: Employee[] = [
  {
    id: 1,
    user_id: 1,
    company_id: 1,
    employee_code: 'EMP001',
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@company.com',
    employment_status: 'active',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    user_id: 2,
    company_id: 1,
    employee_code: 'EMP002',
    first_name: 'HR',
    last_name: 'Manager',
    email: 'hr@company.com',
    employment_status: 'active',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    user_id: 3,
    company_id: 1,
    employee_code: 'EMP003',
    first_name: 'Department',
    last_name: 'Manager',
    email: 'manager@company.com',
    employment_status: 'active',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    user_id: 4,
    company_id: 1,
    employee_code: 'EMP004',
    first_name: 'John',
    last_name: 'Employee',
    email: 'employee@company.com',
    employment_status: 'active',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email (using mock data for now)
    const user = mockUsers.find(u => u.email === email && u.is_active);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get employee data if exists (using mock data for now)
    const employee = mockEmployees.find(e => e.user_id === user.id && e.is_active);

    // Create auth response
    const authResponse = createAuthResponse(user, employee || undefined);

    const response: LoginResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        password_changed_at: user.password_changed_at,
      },
      employee: employee || undefined,
      token: authResponse.token,
      expires_in: authResponse.expires_in,
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}