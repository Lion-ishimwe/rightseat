import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate } from '@/lib/middleware/auth';

interface CreateUserRequest {
  email: string;
  password: string;
  role: User['role'];
  is_active?: boolean;
}

interface UpdateUserRequest {
  id: number;
  email?: string;
  password?: string;
  role?: User['role'];
  is_active?: boolean;
}

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const users = await db.query<User>(
      'SELECT id, email, role, is_active, created_at, updated_at, last_login FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body: CreateUserRequest = await request.json();
    const { email, password, role, is_active = true } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.queryOne<User>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.queryOne<User>(
      'INSERT INTO users (email, password_hash, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, role, is_active, created_at, updated_at',
      [email, passwordHash, role, is_active]
    );

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}