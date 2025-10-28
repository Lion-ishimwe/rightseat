import { User, Employee } from './models/types';

export type UserRole = 'admin' | 'hr_manager' | 'finance_manager' | 'business_manager' | 'talent_manager' | 'comms_manager' | 'staff';

export interface AuthUser {
  user: User;
  employee?: Employee;
  token: string;
  role: UserRole;
  permissions: string[];
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
      role: user.role || 'staff',
      permissions: getRolePermissions(user.role || 'staff'),
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

export function getRolePermissions(role: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    admin: [
      'all_modules_access',
      'create_users',
      'delete_users',
      'manage_all_data',
      'view_all_reports',
      'system_settings'
    ],
    hr_manager: [
      'hr_module_access',
      'create_staff',
      'edit_staff',
      'view_staff',
      'manage_leave',
      'view_reports',
      'hr_settings'
    ],
    finance_manager: [
      'finance_module_access',
      'create_finance_data',
      'edit_finance_data',
      'delete_finance_data',
      'manage_documents',
      'view_finance_reports'
    ],
    business_manager: [
      'business_module_access',
      'create_business_data',
      'edit_business_data',
      'delete_business_data',
      'manage_business_documents',
      'view_business_reports'
    ],
    talent_manager: [
      'talent_module_access',
      'create_talent_data',
      'edit_talent_data',
      'delete_talent_data',
      'manage_talent_documents',
      'view_talent_reports'
    ],
    comms_manager: [
      'comms_module_access',
      'create_events',
      'edit_events',
      'delete_events',
      'manage_media',
      'upload_media',
      'view_calendar',
      'manage_calendar'
    ],
    staff: [
      'staff_portal_access',
      'view_own_info',
      'update_own_info',
      'view_own_documents',
      'request_leave',
      'view_own_reports'
    ]
  };

  return rolePermissions[role] || [];
}

export function hasPermission(permission: string): boolean {
  const authUser = getAuthUser();
  return authUser ? authUser.permissions.includes(permission) : false;
}

export function canAccessModule(module: string): boolean {
  const authUser = getAuthUser();
  if (!authUser) return false;

  if (authUser.role === 'admin') return true;

  const modulePermissions: Record<string, string[]> = {
    hr: ['hr_module_access'],
    finance: ['finance_module_access'],
    business: ['business_module_access'],
    talent: ['talent_module_access'],
    comms: ['comms_module_access'],
    staff: ['staff_portal_access']
  };

  const requiredPermissions = modulePermissions[module] || [];
  return requiredPermissions.some(permission => authUser.permissions.includes(permission));
}

export function initializeDefaultAccounts(): void {
  if (typeof window === 'undefined') return;

  const accountsKey = 'system_accounts';
  const existingAccounts = localStorage.getItem(accountsKey);

  if (!existingAccounts) {
    const defaultAccounts = [
      {
        id: 1,
        email: 'admin@company.com',
        password: 'admin123',
        role: 'admin' as UserRole,
        name: 'System Administrator',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        email: 'hr@company.com',
        password: 'hr123',
        role: 'hr_manager' as UserRole,
        name: 'HR Manager',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        email: 'finance@company.com',
        password: 'finance123',
        role: 'finance_manager' as UserRole,
        name: 'Finance Manager',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        email: 'business@company.com',
        password: 'business123',
        role: 'business_manager' as UserRole,
        name: 'Business Manager',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        email: 'talent@company.com',
        password: 'talent123',
        role: 'talent_manager' as UserRole,
        name: 'Talent Manager',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 6,
        email: 'comms@company.com',
        password: 'comms123',
        role: 'comms_manager' as UserRole,
        name: 'Communications Manager',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem(accountsKey, JSON.stringify(defaultAccounts));
  }

  // Initialize default staff data for staff portal
  initializeDefaultStaffData();
}

function initializeDefaultStaffData(): void {
  if (typeof window === 'undefined') return;

  const staffListKey = 'staff_list';
  const existingStaff = localStorage.getItem(staffListKey);

  if (!existingStaff) {
    const defaultStaff = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@company.com',
        position: 'Software Developer',
        department: 'IT',
        status: 'Active',
        hireDate: '2024-01-15',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        position: 'Marketing Manager',
        department: 'Marketing',
        status: 'Active',
        hireDate: '2024-02-01',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@company.com',
        position: 'Accountant',
        department: 'Finance',
        status: 'Active',
        hireDate: '2024-03-10',
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem(staffListKey, JSON.stringify(defaultStaff));
  }
}

export function authenticateUser(email: string, password: string): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const accountsStr = localStorage.getItem('system_accounts');
  if (!accountsStr) return null;

  try {
    const accounts = JSON.parse(accountsStr);
    const user = accounts.find((acc: any) => acc.email === email && acc.password === password && acc.isActive);

    if (user) {
      const token = btoa(`${user.id}:${Date.now()}`);
      const permissions = getRolePermissions(user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          password_hash: '', // Not needed for client-side
          role: user.role,
          is_active: user.isActive,
          created_at: new Date(user.createdAt),
          updated_at: new Date()
        },
        token,
        role: user.role,
        permissions
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }

  return null;
}

export function changePassword(currentPassword: string, newPassword: string): boolean {
  if (typeof window === 'undefined') return false;

  const authUser = getAuthUser();
  if (!authUser) return false;

  const accountsStr = localStorage.getItem('system_accounts');
  if (!accountsStr) return false;

  try {
    const accounts = JSON.parse(accountsStr);
    const userIndex = accounts.findIndex((acc: any) => acc.id === authUser.user.id);

    if (userIndex !== -1 && accounts[userIndex].password === currentPassword) {
      accounts[userIndex].password = newPassword;
      localStorage.setItem('system_accounts', JSON.stringify(accounts));
      return true;
    }
  } catch (error) {
    console.error('Password change error:', error);
  }

  return false;
}

export function getStaffAccounts(): any[] {
  if (typeof window === 'undefined') return [];

  // Get staff data from HR Outsourcing
  const staffListStr = localStorage.getItem('staff_list');
  if (!staffListStr) return [];

  try {
    const staffList = JSON.parse(staffListStr);
    return staffList.map((staff: any) => ({
      id: staff.id + 1000, // Offset to avoid conflicts with system accounts
      email: staff.email,
      password: `staff${staff.id}`, // Default password pattern
      role: 'staff' as UserRole,
      name: staff.name,
      staffId: staff.id,
      isActive: staff.status === 'Active',
      createdAt: staff.createdAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error loading staff accounts:', error);
    return [];
  }
}

export function authenticateStaff(email: string, password: string): AuthUser | null {
  const staffAccounts = getStaffAccounts();
  const staff = staffAccounts.find(acc => acc.email === email && acc.password === password && acc.isActive);

  if (staff) {
    const token = btoa(`${staff.id}:${Date.now()}`);
    const permissions = getRolePermissions('staff');

    return {
      user: {
        id: staff.id,
        email: staff.email,
        password_hash: '',
        role: 'staff',
        is_active: staff.isActive,
        created_at: new Date(staff.createdAt),
        updated_at: new Date()
      },
      token,
      role: 'staff',
      permissions
    };
  }

  return null;
}