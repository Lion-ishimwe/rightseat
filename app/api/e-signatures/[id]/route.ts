import { NextRequest, NextResponse } from 'next/server';
import { ESignature } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';

// GET /api/e-signatures/[id] - Get e-signature by ID
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

    const signatureId = parseInt(params.id);
    if (isNaN(signatureId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid signature ID' },
        { status: 400 }
      );
    }

    // Get signature with document and employee info
    const signature = await db.queryOne<ESignature & {
      document_name?: string;
      employee_name?: string;
    }>(
      `SELECT es.*, d.name as document_name, e.first_name || ' ' || e.last_name as employee_name
       FROM e_signatures es
       LEFT JOIN documents d ON es.document_id = d.id
       LEFT JOIN employees e ON es.employee_id = e.id
       WHERE es.id = $1`,
      [signatureId]
    );

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'E-signature not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user.role === 'employee' && authResult.user.employee?.id !== signature.employee_id) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signature,
    });
  } catch (error) {
    console.error('Get e-signature error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/e-signatures/[id] - Delete e-signature (admin only)
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

    const signatureId = parseInt(params.id);
    if (isNaN(signatureId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid signature ID' },
        { status: 400 }
      );
    }

    // Get signature before deletion
    const signature = await db.queryOne<ESignature>(
      'SELECT * FROM e_signatures WHERE id = $1',
      [signatureId]
    );

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'E-signature not found' },
        { status: 404 }
      );
    }

    // Update document as unsigned
    await db.query(
      'UPDATE documents SET is_signed = false, signed_at = NULL WHERE id = $1',
      [signature.document_id]
    );

    // Delete signature
    await db.query('DELETE FROM e_signatures WHERE id = $1', [signatureId]);

    // Log audit action
    await logAuditAction(
      authResult.user.id,
      'DELETE',
      'e_signature',
      signatureId,
      signature,
      undefined,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'E-signature deleted successfully',
    });
  } catch (error) {
    console.error('Delete e-signature error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}