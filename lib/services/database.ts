import { db } from '@/lib/database/connection';
import {
  User, Employee, Department, LeaveRequest, LeavePolicy, EmployeeLeaveBalance,
  Document, DocumentFolder, PerformanceGoal, GoalMilestone, OnboardingTask,
  OnboardingTemplate, ESignature, Notification, SystemSetting, Company
} from '@/lib/models/types';

// User Services
export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    return db.queryOne<User>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
  }

  static async findById(id: number): Promise<User | null> {
    return db.queryOne<User>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
  }

  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await db.queryOne<User>(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userData.email, userData.password_hash, userData.role, userData.is_active]
    );
    return result!;
  }

  static async update(id: number, updates: Partial<User>): Promise<User | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    return db.queryOne<User>(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
  }

  static async delete(id: number): Promise<void> {
    await db.query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
  }

  static async getAllUsers(): Promise<User[]> {
    return db.query<User>('SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC');
  }
}

// Employee Services
export class EmployeeService {
  static async findById(id: number): Promise<Employee | null> {
    return db.queryOne<Employee>('SELECT * FROM employees WHERE id = $1 AND is_active = true', [id]);
  }

  static async findByUserId(userId: number): Promise<Employee | null> {
    return db.queryOne<Employee>('SELECT * FROM employees WHERE user_id = $1 AND is_active = true', [userId]);
  }

  static async create(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const fields = Object.keys(employeeData);
    const values = Object.values(employeeData);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    const result = await db.queryOne<Employee>(
      `INSERT INTO employees (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result!;
  }

  static async update(id: number, updates: Partial<Employee>): Promise<Employee | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    return db.queryOne<Employee>(
      `UPDATE employees SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} AND is_active = true RETURNING *`,
      [...values, id]
    );
  }

  static async delete(id: number): Promise<void> {
    await db.query('UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
  }

  static async getEmployees(filters: {
    company_id?: number;
    department_id?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ employees: Employee[]; total: number }> {
    const { company_id, department_id, status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['e.is_active = true'];
    const values: any[] = [];

    if (company_id) {
      conditions.push(`e.company_id = $${values.length + 1}`);
      values.push(company_id);
    }

    if (department_id) {
      conditions.push(`e.department_id = $${values.length + 1}`);
      values.push(department_id);
    }

    if (status) {
      conditions.push(`e.employment_status = $${values.length + 1}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(e.first_name ILIKE $${values.length + 1} OR e.last_name ILIKE $${values.length + 1} OR e.email ILIKE $${values.length + 1})`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM employees e ${whereClause}`,
      values
    );

    const employees = await db.query<Employee>(
      `SELECT e.* FROM employees e ${whereClause} ORDER BY e.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return { employees, total: countResult?.count || 0 };
  }
}

// Department Services
export class DepartmentService {
  static async findById(id: number): Promise<Department | null> {
    return db.queryOne<Department>('SELECT * FROM departments WHERE id = $1', [id]);
  }

  static async create(departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const result = await db.queryOne<Department>(
      `INSERT INTO departments (company_id, name, description, manager_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [departmentData.company_id, departmentData.name, departmentData.description, departmentData.manager_id]
    );
    return result!;
  }

  static async update(id: number, updates: Partial<Department>): Promise<Department | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    return db.queryOne<Department>(
      `UPDATE departments SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
  }

  static async delete(id: number): Promise<void> {
    await db.query('DELETE FROM departments WHERE id = $1', [id]);
  }

  static async getDepartments(filters: { company_id?: number; search?: string }): Promise<Department[]> {
    const { company_id, search } = filters;

    const conditions: string[] = [];
    const values: any[] = [];

    if (company_id) {
      conditions.push(`company_id = $${values.length + 1}`);
      values.push(company_id);
    }

    if (search) {
      conditions.push(`name ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return db.query<Department>(`SELECT * FROM departments ${whereClause} ORDER BY name`, values);
  }
}

// Leave Services
export class LeaveService {
  static async createLeaveRequest(requestData: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>): Promise<LeaveRequest> {
    const result = await db.queryOne<LeaveRequest>(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [requestData.employee_id, requestData.leave_type, requestData.start_date, requestData.end_date, requestData.total_days, requestData.reason]
    );
    return result!;
  }

  static async updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    return db.queryOne<LeaveRequest>(
      `UPDATE leave_requests SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
  }

  static async getLeaveRequests(filters: {
    employee_id?: number;
    status?: string;
    leave_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ requests: LeaveRequest[]; total: number }> {
    const { employee_id, status, leave_type, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];

    if (employee_id) {
      conditions.push(`employee_id = $${values.length + 1}`);
      values.push(employee_id);
    }

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    if (leave_type) {
      conditions.push(`leave_type = $${values.length + 1}`);
      values.push(leave_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM leave_requests ${whereClause}`,
      values
    );

    const requests = await db.query<LeaveRequest>(
      `SELECT * FROM leave_requests ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return { requests, total: countResult?.count || 0 };
  }

  static async getLeaveBalances(employeeId: number, year: number): Promise<EmployeeLeaveBalance[]> {
    return db.query<EmployeeLeaveBalance>(
      'SELECT * FROM employee_leave_balances WHERE employee_id = $1 AND year = $2',
      [employeeId, year]
    );
  }

  static async updateLeaveBalance(employeeId: number, leaveType: string, year: number, updates: Partial<EmployeeLeaveBalance>): Promise<void> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    await db.query(
      `UPDATE employee_leave_balances SET ${setClause}, updated_at = NOW()
       WHERE employee_id = $${fields.length + 1} AND leave_type = $${fields.length + 2} AND year = $${fields.length + 3}`,
      [...values, employeeId, leaveType, year]
    );
  }
}

// Document Services
export class DocumentService {
  static async createDocument(documentData: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const result = await db.queryOne<Document>(
      `INSERT INTO documents (folder_id, employee_id, name, original_name, file_path, file_size, mime_type, document_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [documentData.folder_id, documentData.employee_id, documentData.name, documentData.original_name,
       documentData.file_path, documentData.file_size, documentData.mime_type, documentData.document_type]
    );
    return result!;
  }

  static async createFolder(folderData: Omit<DocumentFolder, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentFolder> {
    const result = await db.queryOne<DocumentFolder>(
      `INSERT INTO document_folders (employee_id, name, parent_folder_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [folderData.employee_id, folderData.name, folderData.parent_folder_id]
    );
    return result!;
  }

  static async getDocuments(filters: { folder_id?: number; employee_id?: number }): Promise<Document[]> {
    const { folder_id, employee_id } = filters;

    const conditions: string[] = [];
    const values: any[] = [];

    if (folder_id) {
      conditions.push(`folder_id = $${values.length + 1}`);
      values.push(folder_id);
    }

    if (employee_id) {
      conditions.push(`employee_id = $${values.length + 1}`);
      values.push(employee_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return db.query<Document>(`SELECT * FROM documents ${whereClause} ORDER BY created_at DESC`, values);
  }

  static async getFolders(filters: { employee_id?: number; parent_folder_id?: number }): Promise<DocumentFolder[]> {
    const { employee_id, parent_folder_id } = filters;

    const conditions: string[] = [];
    const values: any[] = [];

    if (employee_id) {
      conditions.push(`employee_id = $${values.length + 1}`);
      values.push(employee_id);
    }

    if (parent_folder_id !== undefined) {
      conditions.push(`parent_folder_id ${parent_folder_id === null ? 'IS' : '='} $${values.length + 1}`);
      values.push(parent_folder_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return db.query<DocumentFolder>(`SELECT * FROM document_folders ${whereClause} ORDER BY name`, values);
  }
}

// Performance Services
export class PerformanceService {
  static async createGoal(goalData: Omit<PerformanceGoal, 'id' | 'created_at' | 'updated_at'>): Promise<PerformanceGoal> {
    const result = await db.queryOne<PerformanceGoal>(
      `INSERT INTO performance_goals (employee_id, title, description, due_date, status, progress_percentage, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [goalData.employee_id, goalData.title, goalData.description, goalData.due_date,
       goalData.status, goalData.progress_percentage, goalData.created_by]
    );
    return result!;
  }

  static async getGoals(filters: { employee_id?: number; status?: string; page?: number; limit?: number }): Promise<{ goals: PerformanceGoal[]; total: number }> {
    const { employee_id, status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];

    if (employee_id) {
      conditions.push(`employee_id = $${values.length + 1}`);
      values.push(employee_id);
    }

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM performance_goals ${whereClause}`,
      values
    );

    const goals = await db.query<PerformanceGoal>(
      `SELECT * FROM performance_goals ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return { goals, total: countResult?.count || 0 };
  }
}

// Notification Services
export class NotificationService {
  static async createNotification(notificationData: Omit<Notification, 'id' | 'is_read' | 'read_at' | 'created_at'>): Promise<Notification> {
    const result = await db.queryOne<Notification>(
      `INSERT INTO notifications (recipient_id, title, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [notificationData.recipient_id, notificationData.title, notificationData.message,
       notificationData.type, notificationData.entity_type, notificationData.entity_id]
    );
    return result!;
  }

  static async getNotifications(userId: number, filters: { is_read?: boolean; type?: string; page?: number; limit?: number }): Promise<{ notifications: Notification[]; total: number }> {
    const { is_read, type, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions: string[] = [`recipient_id = $${1}`];
    const values: any[] = [userId];

    if (is_read !== undefined) {
      conditions.push(`is_read = $${values.length + 1}`);
      values.push(is_read);
    }

    if (type) {
      conditions.push(`type = $${values.length + 1}`);
      values.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications ${whereClause}`,
      values
    );

    const notifications = await db.query<Notification>(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return { notifications, total: countResult?.count || 0 };
  }

  static async markAsRead(notificationId: number, userId: number): Promise<void> {
    await db.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2',
      [notificationId, userId]
    );
  }
}

// System Settings Services
export class SystemSettingService {
  static async getSetting(key: string, companyId?: number): Promise<SystemSetting | null> {
    return db.queryOne<SystemSetting>(
      'SELECT * FROM system_settings WHERE setting_key = $1 AND (company_id = $2 OR company_id IS NULL)',
      [key, companyId]
    );
  }

  static async getSettings(filters: { company_id?: number; is_public?: boolean }): Promise<SystemSetting[]> {
    const { company_id, is_public } = filters;

    const conditions: string[] = [];
    const values: any[] = [];

    if (company_id) {
      conditions.push(`company_id = $${values.length + 1}`);
      values.push(company_id);
    }

    if (is_public !== undefined) {
      conditions.push(`is_public = $${values.length + 1}`);
      values.push(is_public);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return db.query<SystemSetting>(`SELECT * FROM system_settings ${whereClause} ORDER BY setting_key`, values);
  }

  static async createSetting(settingData: Omit<SystemSetting, 'id' | 'created_at' | 'updated_at'>): Promise<SystemSetting> {
    const result = await db.queryOne<SystemSetting>(
      `INSERT INTO system_settings (company_id, setting_key, setting_value, setting_type, description, is_public)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [settingData.company_id, settingData.setting_key, settingData.setting_value,
       settingData.setting_type, settingData.description, settingData.is_public]
    );
    return result!;
  }

  static async updateSetting(id: number, updates: Partial<SystemSetting>): Promise<SystemSetting | null> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    return db.queryOne<SystemSetting>(
      `UPDATE system_settings SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
  }
}