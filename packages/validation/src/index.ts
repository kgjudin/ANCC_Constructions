import { z } from 'zod';
import {
  EmployeeStatus,
  AttendanceStatus,
  LeaveRequestStatus,
  QualityStatus,
  PaymentStatus,
  ExpenseCategory
} from '@construction/constants';

// Auth Validation Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Employee Validation Schemas
export const CreateEmployeeSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  department_id: z.string().uuid().optional(),
  designation_id: z.string().uuid().optional(),
  role_id: z.string().uuid('Role is required'),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  profile_photo_url: z.string().url().optional()
});

export const UpdateEmployeeSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  department_id: z.string().uuid().optional(),
  designation_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  profile_photo_url: z.string().url().optional()
});

// Role Validation Schemas
export const CreateRoleSchema = z.object({
  name: z.string().min(2, 'Role name is required'),
  description: z.string().min(2, 'Description is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission must be selected')
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  permissions: z.array(z.string()).optional()
});

// Attendance Validation Schemas
export const RecordAttendanceSchema = z.object({
  employee_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional()
});

// Leave Validation Schemas
export const LeaveTypeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  allocated_days: z.number().positive('Allocated days must be greater than 0'),
  year: z.number().int().min(2000).max(2100)
});

export const LeaveRequestSchema = z
  .object({
    leave_type_id: z.string().uuid('Leave type is required'),
    employee_id: z.string().uuid().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
  })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
      message: 'End date must be on or after start date',
      path: ['end_date']
    }
  );

export const LeaveApprovalSchema = z.object({
  status: z.enum([LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED]),
  notes: z.string().optional()
});

// Holiday Validation Schemas
export const HolidaySchema = z.object({
  name: z.string().min(2, 'Holiday name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  year: z.number().int().min(2000).max(2100),
  holiday_type: z.string().default('Public'),
  description: z.string().optional()
});

// Product Validation Schemas
export const ProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  category_id: z.string().uuid().optional(),
  unit: z.string().min(1, 'Unit (e.g., Bag, KG, m³) is required'),
  standard_rate: z.number().nonnegative('Rate cannot be negative'),
  description: z.string().optional()
});

// Supplier Validation Schemas
export const SupplierSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  contact_person: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gst_number: z.string().optional(),
  notes: z.string().optional()
});

// Purchase Item & Header Validation Schemas
export const PurchaseItemSchema = z.object({
  product_id: z.string().uuid('Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unit_rate: z.number().nonnegative('Unit rate must be >= 0'),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  brand: z.string().optional(),
  grade: z.string().optional(),
  quality_status: z.nativeEnum(QualityStatus).default(QualityStatus.APPROVED),
  quality_notes: z.string().optional()
});

export const PurchaseSchema = z.object({
  supplier_id: z.string().uuid('Supplier is required'),
  site_id: z.string().uuid().optional().or(z.literal('')).or(z.null()),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transport_cost: z.number().nonnegative().default(0),
  other_charges: z.number().nonnegative().default(0),
  tax_amount: z.number().nonnegative().default(0),
  discount_amount: z.number().nonnegative().default(0),
  paid_amount: z.number().nonnegative().default(0),
  grand_total: z.number().nonnegative().optional(),
  invoice_number: z.string().optional().or(z.literal('')).or(z.null()),
  invoice_document_url: z.string().optional().or(z.literal('')).or(z.null()),
  notes: z.string().optional().or(z.literal('')).or(z.null()),
  items: z.array(PurchaseItemSchema).optional().default([])
});

export const PaymentUpdateSchema = z.object({
  paid_amount: z.number().nonnegative('Paid amount must be >= 0')
});

export const SiteSchema = z.object({
  name: z.string().min(2, 'Site name is required'),
  location: z.string().optional().or(z.literal('')).or(z.null()),
  site_manager_id: z.string().uuid().optional().or(z.literal('')).or(z.null()),
  status: z.string().default('Active')
});

// Expense Validation Schemas
export const ExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  supplier_id: z.string().uuid().optional().or(z.literal('')).or(z.null()),
  purchase_id: z.string().uuid().optional().or(z.literal('')).or(z.null()),
  description: z.string().min(2, 'Description is required'),
  receipt_url: z.string().url().optional().or(z.literal('')).or(z.null())
});

// Financial Line Item & Document Validation Schemas (Accountant Console)
export const FinancialLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()),
  unit_price: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()),
  amount: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()).optional()
});

export const FinancialDocumentSchema = z.object({
  site_id: z.string().min(1, 'Site is required'),
  vendor_name: z.string().min(1, 'Vendor/Client name is required'),
  invoice_no: z.string().min(1, 'Invoice/Bill number is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(FinancialLineItemSchema).min(1, 'At least one line item is required'),
  subtotal: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()).optional(),
  tax: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()).optional().default(0),
  discount: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()).optional().default(0),
  total: z.preprocess((val) => Number(val) || 0, z.number().nonnegative()).optional(),
  status: z.string().optional().default('Pending'),
  admin_remarks: z.string().optional().nullable().or(z.literal(''))
});

// Product Request Validation Schema
export const ProductRequestSchema = z.object({
  site_id: z.string().uuid('Site is required'),
  product_id: z.string().uuid().optional().or(z.literal('')).or(z.null()),
  product_name: z.string().min(2, 'Product name is required'),
  category: z.string().min(2, 'Category is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  required_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required date must be YYYY-MM-DD'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  reason: z.string().optional().or(z.literal('')).or(z.null()),
  attachment_url: z.string().optional().or(z.literal('')).or(z.null())
});

// Material Usage Validation Schema
export const MaterialUsageSchema = z.object({
  site_id: z.string().uuid('Site is required'),
  product_id: z.string().uuid('Material / Product is required'),
  quantity_used: z.number().positive('Quantity used must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  activity: z.string().min(2, 'Work / Activity description is required'),
  usage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().or(z.literal('')).or(z.null()),
  photo_url: z.string().optional().or(z.literal('')).or(z.null())
});

// Damaged Material Validation Schema
export const DamagedMaterialSchema = z.object({
  site_id: z.string().uuid('Site is required'),
  product_id: z.string().uuid('Material / Product is required'),
  quantity: z.number().positive('Damaged quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  damage_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(2, 'Reason is required'),
  description: z.string().optional().or(z.literal('')).or(z.null()),
  photo_url: z.string().optional().or(z.literal('')).or(z.null())
});

// Material Transfer Validation Schema
export const MaterialTransferSchema = z.object({
  from_site_id: z.string().uuid('From Site is required'),
  to_site_id: z.string().uuid('To Site is required'),
  product_id: z.string().uuid('Material / Product is required'),
  quantity: z.number().positive('Transfer quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  reason: z.string().min(2, 'Transfer reason is required'),
  transfer_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).refine(data => data.from_site_id !== data.to_site_id, {
  message: 'Destination site must be different from source site',
  path: ['to_site_id']
});
