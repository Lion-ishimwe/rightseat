import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateNotificationRequest {
  recipient_id: number;
  title: string;
  message: string;
  type: Notification['type'];
  entity_type?: string;
  entity_id?: number;
}

// GET /api/notifications - List notifications
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
    const isRead = searchParams.get('is_read');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = [`n.recipient_id = $${1}`];
    const values: any[] = [authResult.user.id];
    let paramIndex = 2;

    if (isRead !== null) {
      conditions.push(`n.is_read = $${paramIndex++}`);
      values.push(isRead === 'true');
    }

    if (type) {
      conditions.push(`n.type = $${paramIndex++}`);
      values.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications n ${whereClause}`,
      values
    );

    // Get notifications
    const notifications = await db.query<Notification>(
      `SELECT * FROM notifications n
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification (admin/system only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || (authResult.user.role !== 'admin' && authResult.user.role !== 'hr_manager')) {
      return NextResponse.json(
        { success: false, message: 'Admin or HR Manager access required' },
        { status: 403 }
      );
    }

    const body: CreateNotificationRequest = await request.json();
    const { recipient_id, title, message, type, entity_type, entity_id } = body;

    if (!recipient_id || !title || !message || !type) {
      return NextResponse.json(
        { success: false, message: 'Recipient ID, title, message, and type are required' },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipient = await db.queryOne(
      'SELECT id FROM users WHERE id = $1 AND is_active = true',
      [recipient_id]
    );

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Create notification
    const newNotification = await db.queryOne<Notification>(
      `INSERT INTO notifications (recipient_id, title, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [recipient_id, title, message, type, entity_type, entity_id]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'notification',
      newNotification?.id,
      undefined,
      newNotification || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newNotification,
      message: 'Notification created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/mark-read - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_ids } = body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { success: false, message: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // Update notifications as read (only user's own notifications)
    const updatedCount = await db.queryOne<{ count: number }>(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = ANY($1) AND recipient_id = $2 AND is_read = false`,
      [notification_ids, authResult.user.id]
    );

    return NextResponse.json({
      success: true,
      data: { updated_count: updatedCount?.count || 0 },
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}