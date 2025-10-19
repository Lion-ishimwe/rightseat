import { NextRequest, NextResponse } from 'next/server';
import { Document, DocumentFolder } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

interface UpdateDocumentRequest {
  name?: string;
  document_type?: string;
}

interface UpdateFolderRequest {
  name?: string;
}

// GET /api/documents/[id] - Get document or folder by ID
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

    const itemId = parseInt(params.id);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'document' or 'folder'

    if (type === 'folder') {
      // Get folder
      const folder = await db.queryOne<DocumentFolder>(
        'SELECT * FROM document_folders WHERE id = $1',
        [itemId]
      );

      if (!folder) {
        return NextResponse.json(
          { success: false, message: 'Folder not found' },
          { status: 404 }
        );
      }

      // Check permissions
      if (authResult.user.role === 'employee' && folder.employee_id !== authResult.user.employee?.id) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: folder,
        type: 'folder',
      });
    } else {
      // Get document
      const document = await db.queryOne<Document & { folder_name?: string }>(
        `SELECT d.*, df.name as folder_name
         FROM documents d
         LEFT JOIN document_folders df ON d.folder_id = df.id
         WHERE d.id = $1`,
        [itemId]
      );

      if (!document) {
        return NextResponse.json(
          { success: false, message: 'Document not found' },
          { status: 404 }
        );
      }

      // Check permissions
      if (authResult.user.role === 'employee' && document.employee_id !== authResult.user.employee?.id) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }

      // If download=true, return file content
      if (searchParams.get('download') === 'true') {
        try {
          const fileContent = await readFile(document.file_path);
          return new NextResponse(fileContent as any, {
            headers: {
              'Content-Type': document.mime_type || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${document.original_name}"`,
            },
          });
        } catch (error) {
          return NextResponse.json(
            { success: false, message: 'File not found' },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: document,
        type: 'document',
      });
    }
  } catch (error) {
    console.error('Get document/folder error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update document or folder
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

    const itemId = parseInt(params.id);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'document' or 'folder'

    if (type === 'folder') {
      const body: UpdateFolderRequest = await request.json();
      return updateFolder(itemId, body, authResult, request);
    } else {
      const body: UpdateDocumentRequest = await request.json();
      return updateDocument(itemId, body, authResult, request);
    }
  } catch (error) {
    console.error('Update document/folder error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateDocument(documentId: number, body: UpdateDocumentRequest, authResult: any, request: NextRequest) {
  // Get current document
  const currentDocument = await db.queryOne<Document>(
    'SELECT * FROM documents WHERE id = $1',
    [documentId]
  );

  if (!currentDocument) {
    return NextResponse.json(
      { success: false, message: 'Document not found' },
      { status: 404 }
    );
  }

  // Check permissions
  if (authResult.user.role === 'employee' && currentDocument.employee_id !== authResult.user.employee?.id) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    );
  }

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (body.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(body.name);
  }

  if (body.document_type !== undefined) {
    updates.push(`document_type = $${paramIndex++}`);
    values.push(body.document_type);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { success: false, message: 'No valid fields to update' },
      { status: 400 }
    );
  }

  updates.push(`updated_at = NOW()`);
  values.push(documentId);

  const updatedDocument = await db.queryOne<Document>(
    `UPDATE documents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  // Log audit action
  await logAuditAction(
    authResult.user.id,
    'UPDATE',
    'document',
    documentId,
    currentDocument,
    updatedDocument || undefined,
    request
  );

  return NextResponse.json({
    success: true,
    data: updatedDocument,
    message: 'Document updated successfully',
  });
}

async function updateFolder(folderId: number, body: UpdateFolderRequest, authResult: any, request: NextRequest) {
  // Get current folder
  const currentFolder = await db.queryOne<DocumentFolder>(
    'SELECT * FROM document_folders WHERE id = $1',
    [folderId]
  );

  if (!currentFolder) {
    return NextResponse.json(
      { success: false, message: 'Folder not found' },
      { status: 404 }
    );
  }

  // Check permissions
  if (authResult.user.role === 'employee' && currentFolder.employee_id !== authResult.user.employee?.id) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    );
  }

  // Check if folder name already exists
  if (body.name && body.name !== currentFolder.name) {
    const existingFolder = await db.queryOne<DocumentFolder>(
      'SELECT id FROM document_folders WHERE name = $1 AND employee_id = $2 AND id != $3',
      [body.name, currentFolder.employee_id, folderId]
    );

    if (existingFolder) {
      return NextResponse.json(
        { success: false, message: 'Folder with this name already exists' },
        { status: 409 }
      );
    }
  }

  // Update folder
  const updatedFolder = await db.queryOne<DocumentFolder>(
    'UPDATE document_folders SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [body.name, folderId]
  );

  // Log audit action
  await logAuditAction(
    authResult.user.id,
    'UPDATE',
    'document_folder',
    folderId,
    currentFolder,
    updatedFolder || undefined,
    request
  );

  return NextResponse.json({
    success: true,
    data: updatedFolder,
    message: 'Folder updated successfully',
  });
}

// DELETE /api/documents/[id] - Delete document or folder
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

    const itemId = parseInt(params.id);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'document' or 'folder'

    if (type === 'folder') {
      return deleteFolder(itemId, authResult, request);
    } else {
      return deleteDocument(itemId, authResult, request);
    }
  } catch (error) {
    console.error('Delete document/folder error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteDocument(documentId: number, authResult: any, request: NextRequest) {
  // Get document before deletion
  const document = await db.queryOne<Document>(
    'SELECT * FROM documents WHERE id = $1',
    [documentId]
  );

  if (!document) {
    return NextResponse.json(
      { success: false, message: 'Document not found' },
      { status: 404 }
    );
  }

  // Check permissions
  if (authResult.user.role === 'employee' && document.employee_id !== authResult.user.employee?.id) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    );
  }

  // Delete physical file
  try {
    await unlink(document.file_path);
  } catch (error) {
    console.warn('Failed to delete physical file:', error);
  }

  // Delete document record
  await db.query('DELETE FROM documents WHERE id = $1', [documentId]);

  // Log audit action
  await logAuditAction(
    authResult.user.id,
    'DELETE',
    'document',
    documentId,
    document,
    undefined,
    request
  );

  return NextResponse.json({
    success: true,
    message: 'Document deleted successfully',
  });
}

async function deleteFolder(folderId: number, authResult: any, request: NextRequest) {
  // Get folder before deletion
  const folder = await db.queryOne<DocumentFolder>(
    'SELECT * FROM document_folders WHERE id = $1',
    [folderId]
  );

  if (!folder) {
    return NextResponse.json(
      { success: false, message: 'Folder not found' },
      { status: 404 }
    );
  }

  // Check permissions
  if (authResult.user.role === 'employee' && folder.employee_id !== authResult.user.employee?.id) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    );
  }

  // Check if folder has contents
  const documentCount = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM documents WHERE folder_id = $1',
    [folderId]
  );

  const subfolderCount = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM document_folders WHERE parent_folder_id = $1',
    [folderId]
  );

  if ((documentCount && documentCount.count > 0) || (subfolderCount && subfolderCount.count > 0)) {
    return NextResponse.json(
      { success: false, message: 'Cannot delete folder with contents. Please delete contents first.' },
      { status: 400 }
    );
  }

  // Delete folder
  await db.query('DELETE FROM document_folders WHERE id = $1', [folderId]);

  // Log audit action
  await logAuditAction(
    authResult.user.id,
    'DELETE',
    'document_folder',
    folderId,
    folder,
    undefined,
    request
  );

  return NextResponse.json({
    success: true,
    message: 'Folder deleted successfully',
  });
}