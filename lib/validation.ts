import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'hr_manager', 'manager', 'employee']),
  is_active: z.boolean().optional().default(true)
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['admin', 'hr_manager', 'manager', 'employee']).optional(),
  is_active: z.boolean().optional()
});

// Employee validation schemas
export const createEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  nationality: z.string().optional(),
  id_number: z.string().optional(),
  rssb_number: z.string().optional(),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  job_title: z.string().optional(),
  hire_date: z.string().optional(),
  department_id: z.number().int().positive().optional(),
  employment_status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).optional().default('active')
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// Department validation schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  manager_id: z.number().int().positive().optional(),
  company_id: z.number().int().positive().optional()
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// Leave request validation schemas
export const createLeaveRequestSchema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  leave_type: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity', 'study']),
  start_date: z.string().refine((date: string) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format'
  }),
  end_date: z.string().refine((date: string) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format'
  }),
  reason: z.string().optional()
}).refine((data: any) => new Date(data.start_date) <= new Date(data.end_date), {
  message: 'End date must be after or equal to start date',
  path: ['end_date']
});

export const updateLeaveRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  rejection_reason: z.string().optional()
});

// Performance goal validation schemas
export const createGoalSchema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  milestones: z.array(z.object({
    title: z.string().min(1, 'Milestone title is required'),
    description: z.string().optional()
  })).optional()
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, 'Goal title is required').optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  progress_percentage: z.number().int().min(0).max(100).optional()
});

// Milestone validation schemas
export const createMilestoneSchema = z.object({
  goal_id: z.number().int().positive('Goal ID is required'),
  title: z.string().min(1, 'Milestone title is required'),
  description: z.string().optional()
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required').optional(),
  description: z.string().optional(),
  is_completed: z.boolean().optional(),
  comment: z.string().optional()
});

// Onboarding task validation schemas
export const createOnboardingTaskSchema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  location: z.string().optional(),
  welcome_message: z.string().optional(),
  template_id: z.number().int().positive().optional()
});

export const updateOnboardingTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  location: z.string().optional(),
  welcome_message: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  progress_percentage: z.number().int().min(0).max(100).optional()
});

// E-signature validation schemas
export const createESignatureSchema = z.object({
  document_id: z.number().int().positive('Document ID is required'),
  signature_data: z.string().min(1, 'Signature data is required'),
  signature_metadata: z.any().optional()
});

// Notification validation schemas
export const createNotificationSchema = z.object({
  recipient_id: z.number().int().positive('Recipient ID is required'),
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  type: z.enum(['leave_request', 'task_due', 'birthday', 'system']),
  entity_type: z.string().optional(),
  entity_id: z.number().int().positive().optional()
});

// System setting validation schemas
export const createSystemSettingSchema = z.object({
  setting_key: z.string().min(1, 'Setting key is required'),
  setting_value: z.string().min(1, 'Setting value is required'),
  setting_type: z.enum(['string', 'number', 'boolean', 'json']).optional().default('string'),
  description: z.string().optional(),
  is_public: z.boolean().optional().default(false),
  company_id: z.number().int().positive().optional()
});

export const updateSystemSettingSchema = z.object({
  setting_value: z.string().min(1, 'Setting value is required').optional(),
  setting_type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional()
});

// Generic validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: Record<string, string[]>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err: any) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    throw error;
  }
}