import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database/connection';
import { User, Employee } from '@/lib/models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface AuthenticatedRequest extends NextRequest {
  user: User & { employee?: Employee };
}

export async function verifyToken(token: string): Promise<User & { employee?: Employee } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const user = await db.queryOne<User>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (!user) return null;

    // Get employee data if exists
    const employee = await db.queryOne<Employee>(
      'SELECT * FROM employees WHERE user_id = $1 AND is_active = true',
      [user.id]
    );

    return { ...user, employee: employee || undefined };
  } catch (error) {
    return null;
  }
}

export function createAuthResponse(user: User, employee?: Employee): { token: string; expires_in: number } {
  const payload = { userId: user.id };
  const expiresIn = 24 * 60 * 60; // 24 hours in seconds
  
  const token = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: expiresIn 
  });

  return {
    token,
    expires_in: expiresIn
  };
}

export async function authenticate(request: NextRequest): Promise<{ user: User & { employee?: Employee } } | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);
  
  return user ? { user } : null;
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticate(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Attach user to request
    (request as AuthenticatedRequest).user = auth.user;
    
    return handler(request as AuthenticatedRequest);
  };
}

export function requireRole(roles: string[], handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticate(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!roles.includes(auth.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Attach user to request
    (request as AuthenticatedRequest).user = auth.user;

    return handler(request as AuthenticatedRequest);
  };
}

export function requireHRAccess(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticate(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Employees can only access their own info page
    if (auth.user.role === 'employee') {
      const url = new URL(request.url);
      if (!url.pathname.includes('/hr-outsourcing/my-info')) {
        return NextResponse.json(
          { success: false, message: 'Access denied. Employees can only access their personal information.' },
          { status: 403 }
        );
      }
    }

    // Attach user to request
    (request as AuthenticatedRequest).user = auth.user;

    return handler(request as AuthenticatedRequest);
  };
}

export async function logAuditAction(
  userId: number,
  action: string,
  entityType: string,
  entityId?: number,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, action, entityType, entityId, JSON.stringify(oldValues), JSON.stringify(newValues), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
}