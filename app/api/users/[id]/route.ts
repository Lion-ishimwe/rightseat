import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: User['role'];
  is_active?: boolean;
}

// GET /api/users/[id] - Get user by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await db.queryOne<User>(
      'SELECT id, email, role, is_active, created_at, updated_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body: UpdateUserRequest = await request.json();
    const { email, password, role, is_active } = body;

    // Get current user data for audit logging
    const currentUser = await db.queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== currentUser.email) {
      const existingUser = await db.queryOne<User>(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser) {
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

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(userId);

    const updatedUser = await db.queryOne<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, is_active, created_at, updated_at, last_login`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'user',
      userId,
      currentUser,
      updatedUser || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent deleting self
    if (authResult.user.id === userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user data before deletion for audit logging
    const userToDelete = await db.queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    await db.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'user',
      userId,
      userToDelete,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}