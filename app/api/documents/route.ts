import { NextRequest, NextResponse } from 'next/server';
import { Document, DocumentFolder } from '@/lib/models/types';
import { db } from '@/lib/database/connection';
import { authenticate, logAuditAction } from '@/lib/middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface CreateDocumentRequest {
  folder_id: number;
  name: string;
  document_type?: string;
}

interface CreateFolderRequest {
  name: string;
  parent_folder_id?: number;
}

// GET /api/documents - List documents and folders
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
    const folderId = searchParams.get('folder_id');
    const employeeId = searchParams.get('employee_id');

    // Build query conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (folderId) {
      conditions.push(`d.folder_id = $${paramIndex++}`);
      values.push(parseInt(folderId));
    }

    if (employeeId) {
      conditions.push(`d.employee_id = $${paramIndex++}`);
      values.push(parseInt(employeeId));
    }

    // Restrict to user's documents or company if not admin
    if (authResult.user.role === 'employee') {
      conditions.push(`d.employee_id = $${paramIndex++}`);
      values.push(authResult.user.employee?.id);
    } else if (authResult.user.role !== 'admin' && authResult.user.employee) {
      conditions.push(`e.company_id = $${paramIndex++}`);
      values.push(authResult.user.employee.company_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get folders
    const folders = await db.query<DocumentFolder>(
      `SELECT df.* FROM document_folders df
       LEFT JOIN employees e ON df.employee_id = e.id
       ${whereClause.replace('d.', 'df.').replace('d.', 'df.')}
       ORDER BY df.name`,
      values
    );

    // Get documents
    const documents = await db.query<Document & { folder_name?: string }>(
      `SELECT d.*, df.name as folder_name
       FROM documents d
       LEFT JOIN document_folders df ON d.folder_id = df.id
       LEFT JOIN employees e ON d.employee_id = e.id
       ${whereClause}
       ORDER BY d.created_at DESC`,
      values
    );

    return NextResponse.json({
      success: true,
      data: {
        folders,
        documents,
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload document or create folder
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      return handleFileUpload(request, authResult);
    } else {
      // Handle folder creation
      const body: CreateFolderRequest = await request.json();
      return handleFolderCreation(body, authResult, request);
    }
  } catch (error) {
    console.error('Create document/folder error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFileUpload(request: NextRequest, authResult: any) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folderId = parseInt(formData.get('folder_id') as string);
  const documentType = formData.get('document_type') as string;

  if (!file || !folderId) {
    return NextResponse.json(
      { success: false, message: 'File and folder_id are required' },
      { status: 400 }
    );
  }

  // Verify folder access
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

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads', 'documents');
  await mkdir(uploadsDir, { recursive: true });

  // Generate unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${randomUUID()}.${fileExtension}`;
  const filePath = join(uploadsDir, uniqueFilename);

  // Save file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  // Create document record
  const newDocument = await db.queryOne<Document>(
    `INSERT INTO documents (
      folder_id, employee_id, name, original_name, file_path, file_size, mime_type, document_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      folderId,
      folder.employee_id,
      file.name,
      file.name,
      filePath,
      file.size,
      file.type,
      documentType
    ]
  );

  // Log audit action
  await logAuditAction(
    authResult.user.id,
    'CREATE',
    'document',
    newDocument?.id,
    undefined,
    newDocument || undefined,
    request
  );

  return NextResponse.json({
    success: true,
    data: newDocument,
    message: 'Document uploaded successfully',
  }, { status: 201 });
}

async function handleFolderCreation(body: CreateFolderRequest, authResult: any, request: NextRequest) {
  const { name, parent_folder_id } = body;

  if (!name) {
    return NextResponse.json(
      { success: false, message: 'Folder name is required' },
      { status: 400 }
    );
  }

  // Determine employee ID
  let employeeId: number;
  if (authResult.user.role === 'employee') {
    employeeId = authResult.user.employee.id;
  } else {
    return NextResponse.json(
      { success: false, message: 'Only employees can create folders' },
      { status: 403 }
    );
  }

  // Check if folder name already exists for this employee
  const existingFolder = await db.queryOne<DocumentFolder>(
    'SELECT id FROM document_folders WHERE name = $1 AND employee_id = $2 AND (parent_folder_id = $3 OR (parent_folder_id IS NULL AND $3 IS NULL))',
    [name, employeeId, parent_folder_id]
  );

  if (existingFolder) {
    return NextResponse.json(
      { success: false, message: 'Folder with this name already exists' },
      { status: 409 }
    );
  }

  // Create folder
  const newFolder = await db.queryOne<DocumentFolder>(
    'INSERT INTO document_folders (employee_id, name, parent_folder_id) VALUES ($1, $2, $3) RETURNING *',
    [employeeId, name, parent_folder_id]
  );

  // Log audit action
  await logAuditAction(
    authResult.user.id,
    'CREATE',
    'document_folder',
    newFolder?.id,
    undefined,
    newFolder || undefined,
    request
  );

  return NextResponse.json({
    success: true,
    data: newFolder,
    message: 'Folder created successfully',
  }, { status: 201 });
}