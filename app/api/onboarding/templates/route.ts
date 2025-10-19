import { NextRequest, NextResponse } from 'next/server';
import { OnboardingTemplate } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

interface CreateOnboardingTemplateRequest {
  name: string;
  title: string;
  description?: string;
  company_id?: number;
  is_default?: boolean;
}

// GET /api/onboarding/templates - List onboarding templates
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
    const isActive = searchParams.get('is_active');

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      conditions.push(`ot.company_id = $${paramIndex++}`);
      values.push(parseInt(companyId));
    }

    if (isActive !== null) {
      conditions.push(`ot.is_active = $${paramIndex++}`);
      values.push(isActive === 'true');
    }

    // Restrict to user's company if not admin
    if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`ot.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get templates with company info
    const templates = await db.query<OnboardingTemplate & { company_name?: string }>(
      `SELECT ot.*, c.name as company_name
       FROM onboarding_templates ot
       LEFT JOIN companies c ON ot.company_id = c.id
       ${whereClause}
       ORDER BY ot.name`,
      values
    );

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Get onboarding templates error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding/templates - Create onboarding template
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body: CreateOnboardingTemplateRequest = await request.json();
    const { name, title, description, company_id, is_default } = body;

    if (!name || !title) {
      return NextResponse.json(
        { success: false, message: 'Name and title are required' },
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

    // Check if template name already exists in the company
    const existingTemplate = await db.queryOne<OnboardingTemplate>(
      'SELECT id FROM onboarding_templates WHERE name = $1 AND company_id = $2',
      [name, finalCompanyId]
    );

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, message: 'Template with this name already exists in the company' },
        { status: 409 }
      );
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.query(
        'UPDATE onboarding_templates SET is_default = false WHERE company_id = $1',
        [finalCompanyId]
      );
    }

    // Create template
    const newTemplate = await db.queryOne<OnboardingTemplate>(
      `INSERT INTO onboarding_templates (company_id, name, title, description, is_default)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [finalCompanyId, name, title, description, is_default || false]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'onboarding_template',
      newTemplate?.id,
      undefined,
      newTemplate || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newTemplate,
      message: 'Onboarding template created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create onboarding template error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}