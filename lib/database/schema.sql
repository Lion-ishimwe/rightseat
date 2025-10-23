-- HR Management System Database Schema
-- Created for comprehensive HR operations

-- Users and Authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee', -- admin, hr_manager, manager, employee
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Companies/Clients for multi-tenant support
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Profiles
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    id_number VARCHAR(50),
    rssb_number VARCHAR(50),
    marital_status VARCHAR(30),
    
    -- Address Information
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Rwanda',
    
    -- Job Information
    job_title VARCHAR(255),
    hire_date DATE,
    contract_end_date DATE,
    probation_end_date DATE,
    employment_status VARCHAR(50) DEFAULT 'active', -- active, inactive, terminated, on_leave
    work_location VARCHAR(255),
    reports_to INTEGER REFERENCES employees(id),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_email VARCHAR(255),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_address TEXT,
    
    -- Education
    education_institution VARCHAR(255),
    education_degree VARCHAR(255),
    education_specialization VARCHAR(255),
    education_start_date DATE,
    education_end_date DATE,
    
    -- System fields
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Details
CREATE TABLE employee_bank_details (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    branch_code VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Policies per Company
CREATE TABLE leave_policies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    annual_leave_days INTEGER DEFAULT 25,
    sick_leave_days INTEGER DEFAULT 12,
    personal_leave_days INTEGER DEFAULT 5,
    maternity_leave_days INTEGER DEFAULT 90,
    paternity_leave_days INTEGER DEFAULT 15,
    study_leave_days INTEGER DEFAULT 10,
    carry_forward_limit INTEGER DEFAULT 5,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Leave Balances
CREATE TABLE employee_leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- annual, sick, personal, maternity, paternity, study
    total_entitled INTEGER NOT NULL,
    accrued DECIMAL(5,2) DEFAULT 0,
    used DECIMAL(5,2) DEFAULT 0,
    remaining DECIMAL(5,2) DEFAULT 0,
    carry_forward DECIMAL(5,2) DEFAULT 0,
    year INTEGER NOT NULL,
    last_accrual_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type, year)
);

-- Leave Requests
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by INTEGER REFERENCES employees(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Management
CREATE TABLE document_folders (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_folder_id INTEGER REFERENCES document_folders(id),
    is_system_folder BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES document_folders(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    document_type VARCHAR(50), -- contract, id_copy, certificate, signed_document, etc.
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Goals
CREATE TABLE performance_goals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(30) DEFAULT 'not_started', -- not_started, in_progress, completed
    progress_percentage INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Goal Milestones
CREATE TABLE goal_milestones (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES performance_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal Attachments
CREATE TABLE goal_attachments (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES performance_goals(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Templates
CREATE TABLE onboarding_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Template Items
CREATE TABLE onboarding_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    item_type VARCHAR(30) NOT NULL, -- checklist, file, contact
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Tasks
CREATE TABLE onboarding_tasks (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES onboarding_templates(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    due_date DATE,
    location VARCHAR(255),
    welcome_message TEXT,
    status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed
    assigned_by INTEGER REFERENCES employees(id),
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Task Items
CREATE TABLE onboarding_task_items (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    item_type VARCHAR(30) NOT NULL, -- checklist, file, contact
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    file_path VARCHAR(500), -- for file uploads
    is_signed BOOLEAN DEFAULT false, -- for documents
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Contacts
CREATE TABLE onboarding_contacts (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Comments
CREATE TABLE onboarding_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_by INTEGER REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- E-signatures
CREATE TABLE e_signatures (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL, -- Base64 signature image
    signature_metadata JSONB, -- Additional signature info (position, size, etc.)
    ip_address INET,
    user_agent TEXT,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    employee_id INTEGER REFERENCES employees(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- leave_request, task_due, birthday, system
    entity_type VARCHAR(50),
    entity_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(30) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, setting_key)
);

-- Indexes for better performance
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_documents_employee_id ON documents(employee_id);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_onboarding_tasks_employee_id ON onboarding_tasks(employee_id);
CREATE INDEX idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Default system data
INSERT INTO companies (name, code, address, phone, email) VALUES 
('Default Company', 'DEFAULT', 'Kigali, Rwanda', '+250788123456', 'admin@company.com');

INSERT INTO leave_policies (company_id, policy_name, annual_leave_days, sick_leave_days, personal_leave_days, maternity_leave_days, paternity_leave_days, study_leave_days, is_default) VALUES 
(1, 'Default Policy', 25, 12, 5, 90, 15, 10, true);

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, role) VALUES 
('admin@company.com', '$2b$10$rOzKqTmMQlHdHDfA1T4yQeMuS0qp5Sm0K.5JXQX2b4YHIFuJw3qQG', 'admin');