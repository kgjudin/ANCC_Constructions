-- Seed Initial Data for Construction Management System

-- 1. Default Company
INSERT INTO companies (id, name, tax_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'ShajiBro Construction Pvt Ltd', 'GST123456789')
ON CONFLICT DO NOTHING;

-- 2. Permissions Master Seed
INSERT INTO permissions (key, module, description) VALUES
('employee.view', 'Employee', 'View employee records'),
('employee.create', 'Employee', 'Create new employee profiles'),
('employee.edit', 'Employee', 'Edit existing employee details'),
('employee.delete', 'Employee', 'Deactivate or delete employees'),
('attendance.view', 'Attendance', 'View attendance logs'),
('attendance.edit', 'Attendance', 'Modify or adjust attendance logs'),
('leave.view', 'Leave', 'View leave requests and balances'),
('leave.request', 'Leave', 'Apply for leave'),
('leave.approve', 'Leave', 'Approve pending leave requests'),
('leave.reject', 'Leave', 'Reject leave requests'),
('holiday.view', 'Holiday', 'View yearly company holidays'),
('holiday.create', 'Holiday', 'Add new company holidays'),
('holiday.edit', 'Holiday', 'Modify company holidays'),
('holiday.delete', 'Holiday', 'Remove company holidays'),
('supplier.view', 'Supplier', 'View supplier details and history'),
('supplier.create', 'Supplier', 'Register new suppliers'),
('supplier.edit', 'Supplier', 'Update supplier records'),
('supplier.delete', 'Supplier', 'Delete or disable suppliers'),
('product.view', 'Product', 'View product master catalog'),
('product.create', 'Product', 'Add new products/materials'),
('product.edit', 'Product', 'Update product/material details'),
('product.delete', 'Product', 'Remove products/materials'),
('purchase.view', 'Purchase', 'View purchase records and history'),
('purchase.create', 'Purchase', 'Create new material purchase orders'),
('purchase.edit', 'Purchase', 'Edit purchase details and payments'),
('purchase.delete', 'Purchase', 'Cancel or remove purchase records'),
('purchase.approve', 'Purchase', 'Approve purchase orders'),
('expense.view', 'Expense', 'View company expenses'),
('expense.create', 'Expense', 'Record new expenses'),
('expense.edit', 'Expense', 'Update expense entries'),
('expense.delete', 'Expense', 'Remove expense entries'),
('report.view', 'Report', 'View administrative reports'),
('report.export', 'Report', 'Export reports in PDF/CSV format'),
('audit_log.view', 'Audit', 'View system activity audit logs')
ON CONFLICT (key) DO NOTHING;

-- 3. System Roles
INSERT INTO roles (id, company_id, name, description, is_system) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Super Admin', 'Full system access across all modules', TRUE),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'HR Manager', 'Manage employees, attendance, leave, and holidays', TRUE),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Purchase Executive', 'Manage suppliers, products, purchases, and expenses', TRUE),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Employee', 'Standard employee self-service access', TRUE)
ON CONFLICT DO NOTHING;

-- Map ALL permissions to Super Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- Map HR permissions to HR Manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000002', id FROM permissions WHERE module IN ('Employee', 'Attendance', 'Leave', 'Holiday')
ON CONFLICT DO NOTHING;

-- Map Purchase permissions to Purchase Executive role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000003', id FROM permissions WHERE module IN ('Supplier', 'Product', 'Purchase', 'Expense')
ON CONFLICT DO NOTHING;

-- Map Employee self-service permissions to Employee role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000004', id FROM permissions WHERE key IN ('attendance.view', 'leave.view', 'leave.request')
ON CONFLICT DO NOTHING;

-- 4. Departments & Designations
INSERT INTO departments (id, company_id, name, code) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Management', 'MGMT'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Human Resources', 'HR'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Procurement & Purchase', 'PUR'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Site Operations', 'OPS')
ON CONFLICT DO NOTHING;

INSERT INTO designations (id, company_id, name, code) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Managing Director', 'MD'),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'HR Lead', 'HRL'),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Purchase Officer', 'PO'),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Site Engineer', 'SE')
ON CONFLICT DO NOTHING;

-- 5. Seed Default User Accounts & Employee Profiles
-- Account 1: Super Admin (admin@construction.com / password123)
INSERT INTO users (id, email, company_id, status) VALUES
('40000000-0000-0000-0000-000000000001', 'admin@construction.com', '00000000-0000-0000-0000-000000000001', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

INSERT INTO employees (id, employee_code, user_id, company_id, full_name, phone, email, department_id, designation_id, joining_date, status) VALUES
('50000000-0000-0000-0000-000000000001', 'EMP-0001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'System Administrator', '+919876543210', 'admin@construction.com', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-01-01', 'Active')
ON CONFLICT DO NOTHING;

-- Account 2: HR Manager (hr@construction.com / password123)
INSERT INTO users (id, email, company_id, status) VALUES
('40000000-0000-0000-0000-000000000002', 'hr@construction.com', '00000000-0000-0000-0000-000000000001', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO employees (id, employee_code, user_id, company_id, full_name, phone, email, department_id, designation_id, joining_date, status) VALUES
('50000000-0000-0000-0000-000000000002', 'EMP-0002', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Anil Sharma (HR)', '+919876543211', 'hr@construction.com', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2026-01-15', 'Active')
ON CONFLICT DO NOTHING;

-- Account 3: Purchase Executive (purchase@construction.com / password123)
INSERT INTO users (id, email, company_id, status) VALUES
('40000000-0000-0000-0000-000000000003', 'purchase@construction.com', '00000000-0000-0000-0000-000000000001', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO employees (id, employee_code, user_id, company_id, full_name, phone, email, department_id, designation_id, joining_date, status) VALUES
('50000000-0000-0000-0000-000000000003', 'EMP-0003', '40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Rahul Kumar (Purchase)', '+919876543212', 'purchase@construction.com', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2026-02-01', 'Active')
ON CONFLICT DO NOTHING;

-- Account 4: Site Employee (employee@construction.com / password123)
INSERT INTO users (id, email, company_id, status) VALUES
('40000000-0000-0000-0000-000000000004', 'employee@construction.com', '00000000-0000-0000-0000-000000000001', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

INSERT INTO employees (id, employee_code, user_id, company_id, full_name, phone, email, department_id, designation_id, joining_date, status) VALUES
('50000000-0000-0000-0000-000000000004', 'EMP-0004', '40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Vikram Singh (Engineer)', '+919876543213', 'employee@construction.com', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '2026-02-15', 'Active')
ON CONFLICT DO NOTHING;

-- 6. Seed Leave Types & Balances for Employees
INSERT INTO leave_types (id, company_id, name, allocated_days, year) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Casual Leave', 12, 2026),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sick Leave', 10, 2026),
('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Earned Leave', 15, 2026)
ON CONFLICT DO NOTHING;

INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, allocated_days, used_days, remaining_days)
SELECT e.id, lt.id, 2026, lt.allocated_days, 0, lt.allocated_days
FROM employees e CROSS JOIN leave_types lt
ON CONFLICT DO NOTHING;

-- 7. Product Categories & Products
INSERT INTO product_categories (id, company_id, name) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Cement & Concrete'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Steel & Metals'),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Aggregates & Sand'),
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Bricks & Blocks')
ON CONFLICT DO NOTHING;

INSERT INTO products (id, product_code, company_id, name, category_id, unit, standard_rate, description) VALUES
('80000000-0000-0000-0000-000000000001', 'PRD-0001', '00000000-0000-0000-0000-000000000001', 'OPC 53 Grade Cement', '70000000-0000-0000-0000-000000000001', 'Bags', 420.00, 'High strength Portland cement'),
('80000000-0000-0000-0000-000000000002', 'PRD-0002', '00000000-0000-0000-0000-000000000001', 'TMT Rebar 12mm', '70000000-0000-0000-0000-000000000002', 'KG', 68.50, 'Fe 550D grade steel rebar'),
('80000000-0000-0000-0000-000000000003', 'PRD-0003', '00000000-0000-0000-0000-000000000001', 'M-Sand (Manufactured Sand)', '70000000-0000-0000-0000-000000000003', 'm³', 2100.00, 'Washed granite manufactured sand'),
('80000000-0000-0000-0000-000000000004', 'PRD-0004', '00000000-0000-0000-0000-000000000001', 'Red Clay Bricks', '70000000-0000-0000-0000-000000000004', 'Units', 12.50, 'First class kiln burnt red bricks')
ON CONFLICT DO NOTHING;

-- 8. Seed Suppliers
INSERT INTO suppliers (id, supplier_code, company_id, company_name, contact_person, phone, email, gst_number, registered_by) VALUES
('90000000-0000-0000-0000-000000000001', 'SUP-00001', '00000000-0000-0000-0000-000000000001', 'ABC Building Materials Pvt Ltd', 'Ramesh Shah', '+919876500001', 'abc@materials.com', '29ABCDE1234F1Z5', '50000000-0000-0000-0000-000000000003'),
('90000000-0000-0000-0000-000000000002', 'SUP-00002', '00000000-0000-0000-0000-000000000001', 'Apex Steel & Structures', 'Suresh Patel', '+919876500002', 'sales@apexsteel.com', '29APEXS5678G2Z1', '50000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
