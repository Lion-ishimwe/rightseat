import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/notifications/[id] - Get notification by ID
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

    const notificationId = parseInt(params.id);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Get notification
    const notification = await db.queryOne<Notification>(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only see their own notifications
    if (notification.recipient_id !== authResult.user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Get notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/[id]/mark-read - Mark notification as read
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

    const notificationId = parseInt(params.id);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Get current notification
    const currentNotification = await db.queryOne<Notification>(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );

    if (!currentNotification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (currentNotification.recipient_id !== authResult.user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Mark as read
    const updatedNotification = await db.queryOne<Notification>(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND recipient_id = $2
       RETURNING *`,
      [notificationId, authResult.user.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
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

    const notificationId = parseInt(params.id);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Get notification before deletion
    const notification = await db.queryOne<Notification>(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only delete their own notifications
    if (notification.recipient_id !== authResult.user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete notification
    await db.query('DELETE FROM notifications WHERE id = $1', [notificationId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'notification',
      notificationId,
      notification,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}