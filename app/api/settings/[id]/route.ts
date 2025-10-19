import { NextRequest, NextResponse } from 'next/server';
import { SystemSetting } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface UpdateSystemSettingRequest {
  setting_value?: string;
  setting_type?: SystemSetting['setting_type'];
  description?: string;
  is_public?: boolean;
}

// GET /api/settings/[id] - Get system setting by ID
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

    const settingId = parseInt(params.id);
    if (isNaN(settingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid setting ID' },
        { status: 400 }
      );
    }

    // Get system setting with company info
    const setting = await db.queryOne<SystemSetting & { company_name?: string }>(
      `SELECT ss.*, c.name as company_name
       FROM system_settings ss
       LEFT JOIN companies c ON ss.company_id = c.id
       WHERE ss.id = $1`,
      [settingId]
    );

    if (!setting) {
      return NextResponse.json(
        { success: false, message: 'System setting not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role !== 'admin' && !setting.is_public) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (authResult.user.role !== 'admin' && authResult.user.employee?.company_id !== setting.company_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error('Get system setting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/[id] - Update system setting
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const settingId = parseInt(params.id);
    if (isNaN(settingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid setting ID' },
        { status: 400 }
      );
    }

    const body: UpdateSystemSettingRequest = await request.json();

    // Get current setting
    const currentSetting = await db.queryOne<SystemSetting>(
      'SELECT * FROM system_settings WHERE id = $1',
      [settingId]
    );

    if (!currentSetting) {
      return NextResponse.json(
        { success: false, message: 'System setting not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const updateFields = ['setting_value', 'setting_type', 'description', 'is_public'];

    updateFields.forEach(field => {
      if (body[field as keyof UpdateSystemSettingRequest] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(body[field as keyof UpdateSystemSettingRequest]);
      }
    });

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      );
    }

    values.push(settingId);

    const updatedSetting = await db.queryOne<SystemSetting>(
      `UPDATE system_settings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'UPDATE',
      'system_setting',
      settingId,
      currentSetting,
      updatedSetting || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: updatedSetting,
      message: 'System setting updated successfully',
    });
  } catch (error) {
    console.error('Update system setting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/[id] - Delete system setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const settingId = parseInt(params.id);
    if (isNaN(settingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid setting ID' },
        { status: 400 }
      );
    }

    // Get setting before deletion
    const setting = await db.queryOne<SystemSetting>(
      'SELECT * FROM system_settings WHERE id = $1',
      [settingId]
    );

    if (!setting) {
      return NextResponse.json(
        { success: false, message: 'System setting not found' },
        { status: 404 }
      );
    }

    // Delete setting
    await db.query('DELETE FROM system_settings WHERE id = $1', [settingId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'system_setting',
      settingId,
      setting,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'System setting deleted successfully',
    });
  } catch (error) {
    console.error('Delete system setting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}