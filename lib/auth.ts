import { User, Employee } from './models/types';

export interface AuthUser {
  user: User;
  employee?: Employee;
  token: string;
}

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

let timeoutId: NodeJS.Timeout | null = null;
let warningTimeoutId: NodeJS.Timeout | null = null;

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
  localStorage.setItem('session_start', Date.now().toString());

  // Start session timeout
  startSessionTimeout();
}

export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('employee');
  localStorage.removeItem('session_start');

  // Clear timeouts
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
    warningTimeoutId = null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const token = getAuthToken();
  const sessionStart = localStorage.getItem('session_start');

  if (!token || !sessionStart) return false;

  const elapsed = Date.now() - parseInt(sessionStart);
  if (elapsed >= SESSION_TIMEOUT) {
    clearAuthData();
    return false;
  }

  return true;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function resetSessionTimeout(): void {
  if (typeof window === 'undefined') return;

  const sessionStart = localStorage.getItem('session_start');
  if (sessionStart) {
    localStorage.setItem('session_start', Date.now().toString());
    startSessionTimeout();
  }
}

function startSessionTimeout(): void {
  if (typeof window === 'undefined') return;

  // Clear existing timeouts
  if (timeoutId) clearTimeout(timeoutId);
  if (warningTimeoutId) clearTimeout(warningTimeoutId);

  // Set warning timeout (5 minutes before logout)
  warningTimeoutId = setTimeout(() => {
    // Dispatch custom event for warning modal
    window.dispatchEvent(new CustomEvent('sessionWarning'));
  }, SESSION_TIMEOUT - WARNING_TIME);

  // Set logout timeout
  timeoutId = setTimeout(() => {
    clearAuthData();
    window.dispatchEvent(new CustomEvent('sessionExpired'));
    window.location.href = '/login';
  }, SESSION_TIMEOUT);
}

export function getRemainingTime(): number {
  if (typeof window === 'undefined') return 0;

  const sessionStart = localStorage.getItem('session_start');
  if (!sessionStart) return 0;

  const elapsed = Date.now() - parseInt(sessionStart);
  return Math.max(0, SESSION_TIMEOUT - elapsed);
}