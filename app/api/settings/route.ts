import { NextRequest, NextResponse } from 'next/server';
import { SystemSetting } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateSystemSettingRequest {
  setting_key: string;
  setting_value: string;
  setting_type?: SystemSetting['setting_type'];
  description?: string;
  is_public?: boolean;
  company_id?: number;
}

interface UpdateSystemSettingRequest {
  setting_value?: string;
  setting_type?: SystemSetting['setting_type'];
  description?: string;
  is_public?: boolean;
}

// GET /api/settings - List system settings
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
    const companyId = searchParams.get('company_id');
    const isPublic = searchParams.get('is_public');
    const settingKey = searchParams.get('setting_key');

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      conditions.push(`ss.company_id = $${paramIndex++}`);
      values.push(parseInt(companyId));
    }

    if (isPublic !== null) {
      conditions.push(`ss.is_public = $${paramIndex++}`);
      values.push(isPublic === 'true');
    }

    if (settingKey) {
      conditions.push(`ss.setting_key = $${paramIndex++}`);
      values.push(settingKey);
    }

    // Restrict to user's company if not admin
    if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`ss.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    // If not admin, only show public settings
    if (authResult.user.role !== 'admin') {
      conditions.push(`ss.is_public = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get system settings with company info
    const settings = await db.query<SystemSetting & { company_name?: string }>(
      `SELECT ss.*, c.name as company_name
       FROM system_settings ss
       LEFT JOIN companies c ON ss.company_id = c.id
       ${whereClause}
       ORDER BY ss.setting_key`,
      values
    );

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create system setting
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body: CreateSystemSettingRequest = await request.json();
    const {
      setting_key,
      setting_value,
      setting_type = 'string',
      description,
      is_public = false,
      company_id
    } = body;

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { success: false, message: 'Setting key and value are required' },
        { status: 400 }
      );
    }

    // Determine company ID
    let finalCompanyId: number;
    if (authResult.user.role === 'admin') {
      finalCompanyId = company_id || 1; // Default company
    } else {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if setting key already exists for the company
    const existingSetting = await db.queryOne<SystemSetting>(
      'SELECT id FROM system_settings WHERE setting_key = $1 AND company_id = $2',
      [setting_key, finalCompanyId]
    );

    if (existingSetting) {
      return NextResponse.json(
        { success: false, message: 'Setting key already exists for this company' },
        { status: 409 }
      );
    }

    // Create system setting
    const newSetting = await db.queryOne<SystemSetting>(
      `INSERT INTO system_settings (company_id, setting_key, setting_value, setting_type, description, is_public)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [finalCompanyId, setting_key, setting_value, setting_type, description, is_public]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'system_setting',
      newSetting?.id,
      undefined,
      newSetting || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newSetting,
      message: 'System setting created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create system setting error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}