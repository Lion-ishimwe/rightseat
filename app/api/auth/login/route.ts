import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User, Employee, LoginRequest, LoginResponse } from '@/lib/models/types';
import { createAuthResponse } from '@/lib/middleware/auth';

// Mock data for testing without database
const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6', // admin123
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: undefined,
  },
  {
    id: 2,
    email: 'hr@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6', // admin123
    role: 'hr_manager',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login: undefined,
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

    // Find user by email (mock implementation)
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

    // Get employee data if exists (mock implementation)
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