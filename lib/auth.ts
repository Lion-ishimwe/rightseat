import { User, Employee } from './models/types';

export interface AuthUser {
  user: User;
  employee?: Employee;
  token: string;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  const userStr = localStorage.getItem('user');
  const employeeStr = localStorage.getItem('employee');

  if (!token || !userStr) return null;

  try {
    const user = JSON.parse(userStr);
    const employee = employeeStr ? JSON.parse(employeeStr) : undefined;

    return {
      user,
      employee,
      token,
    };
  } catch {
    return null;
  }
}

export function setAuthData(authData: AuthUser): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('auth_token', authData.token);
  localStorage.setItem('user', JSON.stringify(authData.user));
  if (authData.employee) {
    localStorage.setItem('employee', JSON.stringify(authData.employee));
  }
}

export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('employee');
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null && getAuthUser() !== null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}