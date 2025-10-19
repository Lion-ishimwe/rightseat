import { NextRequest, NextResponse } from 'next/server';
import { ESignature } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/e-signatures - List e-signatures
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
    const documentId = searchParams.get('document_id');
    const employeeId = searchParams.get('employee_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (documentId) {
      conditions.push(`es.document_id = $${paramIndex++}`);
      values.push(parseInt(documentId));
    }

    if (employeeId) {
      conditions.push(`es.employee_id = $${paramIndex++}`);
      values.push(parseInt(employeeId));
    }

    // Restrict to user's documents or company if not admin
    if (authResult.user.role === 'employee') {
      conditions.push(`es.employee_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
    } else if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM e_signatures es
       LEFT JOIN employees e ON es.employee_id = e.id
       ${whereClause}`,
      values
    );

    // Get e-signatures with document and employee info
    const signatures = await db.query<ESignature & {
      document_name?: string;
      employee_name?: string;
    }>(
      `SELECT es.*, d.name as document_name, e.first_name || ' ' || e.last_name as employee_name
       FROM e_signatures es
       LEFT JOIN documents d ON es.document_id = d.id
       LEFT JOIN employees e ON es.employee_id = e.id
       ${whereClause}
       ORDER BY es.signed_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: signatures,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get e-signatures error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/e-signatures - Create e-signature
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { document_id, signature_data, signature_metadata } = body;

    if (!document_id || !signature_data) {
      return NextResponse.json(
        { success: false, message: 'Document ID and signature data are required' },
        { status: 400 }
      );
    }

    // Get document info
    const document = await db.queryOne(
      'SELECT id, employee_id FROM documents WHERE id = $1',
      [document_id]
    );

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions - only the document owner can sign
    if (authResult.user.employee?.id !== document.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if already signed
    const existingSignature = await db.queryOne<ESignature>(
      'SELECT id FROM e_signatures WHERE document_id = $1 AND employee_id = $2',
      [document_id, authResult.user.employee?.id]
    );

    if (existingSignature) {
      return NextResponse.json(
        { success: false, message: 'Document already signed' },
        { status: 409 }
      );
    }

    // Get request info for audit
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create e-signature
    const newSignature = await db.queryOne<ESignature>(
      `INSERT INTO e_signatures (document_id, employee_id, signature_data, signature_metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        document_id,
        authResult.user.employee?.id,
        signature_data,
        JSON.stringify(signature_metadata),
        ipAddress,
        userAgent
      ]
    );

    // Update document as signed
    await db.query(
      'UPDATE documents SET is_signed = true, signed_at = NOW() WHERE id = $1',
      [document_id]
    );

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'CREATE',
      'e_signature',
      newSignature?.id,
      undefined,
      newSignature || undefined,
      request
    );

    return NextResponse.json({
      success: true,
      data: newSignature,
      message: 'Document signed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create e-signature error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}