// Database model interfaces

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'hr_manager' | 'manager' | 'employee';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  password_changed_at: Date;
}

export interface Company {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  manager_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Employee {
  id: number;
  user_id: number;
  company_id: number;
  department_id?: number;
  employee_code: string;
  
  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: Date;
  gender?: string;
  nationality?: string;
  id_number?: string;
  rssb_number?: string;
  marital_status?: string;
  
  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  
  // Job Information
  job_title?: string;
  hire_date?: Date;
  contract_end_date?: Date;
  probation_end_date?: Date;
  employment_status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  work_location?: string;
  reports_to?: number;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_relationship?: string;
  emergency_contact_address?: string;
  
  // Education
  education_institution?: string;
  education_degree?: string;
  education_specialization?: string;
  education_start_date?: Date;
  education_end_date?: Date;
  
  // System fields
  profile_picture_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeBankDetails {
  id: number;
  employee_id: number;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  branch_code?: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LeavePolicy {
  id: number;
  company_id: number;
  policy_name: string;
  annual_leave_days: number;
  sick_leave_days: number;
  personal_leave_days: number;
  maternity_leave_days: number;
  paternity_leave_days: number;
  study_leave_days: number;
  carry_forward_limit: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeLeaveBalance {
  id: number;
  employee_id: number;
  leave_type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'study';
  total_entitled: number;
  accrued: number;
  used: number;
  remaining: number;
  carry_forward: number;
  year: number;
  last_accrual_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: string;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentFolder {
  id: number;
  employee_id: number;
  name: string;
  parent_folder_id?: number;
  is_system_folder: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: number;
  folder_id: number;
  employee_id: number;
  name: string;
  original_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  document_type?: string;
  is_signed: boolean;
  signed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PerformanceGoal {
  id: number;
  employee_id: number;
  title: string;
  description?: string;
  due_date?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface GoalMilestone {
  id: number;
  goal_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: Date;
  comment?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GoalAttachment {
  id: number;
  goal_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: number;
  created_at: Date;
}

export interface OnboardingTemplate {
  id: number;
  company_id: number;
  name: string;
  title: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OnboardingTemplateItem {
  id: number;
  template_id: number;
  item_type: 'checklist' | 'file' | 'contact';
  title: string;
  description?: string;
  is_required: boolean;
  order_index: number;
  created_at: Date;
}

export interface OnboardingTask {
  id: number;
  employee_id: number;
  template_id?: number;
  title: string;
  description?: string;
  start_date?: Date;
  due_date?: Date;
  location?: string;
  welcome_message?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_by: number;
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface OnboardingTaskItem {
  id: number;
  task_id: number;
  item_type: 'checklist' | 'file' | 'contact';
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: Date;
  file_path?: string;
  is_signed: boolean;
  signed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OnboardingContact {
  id: number;
  task_id: number;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  created_at: Date;
}

export interface OnboardingComment {
  id: number;
  task_id: number;
  comment_text: string;
  created_by: number;
  created_at: Date;
}

export interface ESignature {
  id: number;
  document_id: number;
  employee_id: number;
  signature_data: string;
  signature_metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  signed_at: Date;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  employee_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Notification {
  id: number;
  recipient_id: number;
  title: string;
  message: string;
  type: 'leave_request' | 'task_due' | 'birthday' | 'system';
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

export interface SystemSetting {
  id: number;
  company_id: number;
  setting_key: string;
  setting_value?: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  id_number?: string;
  rssb_number?: string;
  marital_status?: string;
  job_title?: string;
  hire_date?: string;
  department_id?: number;
  employment_status?: Employee['employment_status'];
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  id: number;
}

export interface CreateLeaveRequestRequest {
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface CreateGoalRequest {
  employee_id: number;
  title: string;
  description?: string;
  due_date?: string;
  milestones?: Array<{ title: string; description?: string }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  employee?: Employee;
  token: string;
  expires_in: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message?: string;
}