import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

interface ChangePasswordRequest {
  email: string;
  newPassword: string;
}

// Mock user data - in real app this would be in database
const mockUsers = [
  {
    id: 1,
    email: 'admin@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6',
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    email: 'hr@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6',
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    email: 'manager@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6',
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    email: 'employee@company.com',
    password_hash: '$2b$10$rDTiFKgS32F8aCCPCEBzJeihsIX5453NQKsCcwNjPgCK2ltzkz3z6',
    password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: ChangePasswordRequest = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user (in real app, this would query database)
    const userIndex = mockUsers.findIndex(u => u.email === email);

    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password (in real app, this would update database)
    mockUsers[userIndex].password_hash = hashedPassword;

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}