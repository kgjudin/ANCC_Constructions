import {
  EmployeeStatus,
  AttendanceStatus,
  LeaveRequestStatus,
  QualityStatus,
  PaymentStatus,
  ExpenseCategory,
  PermissionKey
} from '@construction/constants';

export interface Company {
  id: string;
  name: string;
  tax_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  company_id: string;
  status: string;
  created_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  created_at: string;
}

export interface Designation {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  user_id: string;
  company_id: string;
  full_name: string;
  phone: string;
  email: string;
  department_id?: string;
  department_name?: string;
  designation_id?: string;
  designation_name?: string;
  joining_date: string;
  status: EmployeeStatus;
  profile_photo_url?: string;
  role_id?: string;
  role_name?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  key: PermissionKey;
  module: string;
  description: string;
}

export interface Role {
  id: string;
  company_id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  total_hours?: number;
  status: AttendanceStatus;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: string;
  company_id: string;
  name: string;
  allocated_days: number;
  year: number;
  status: string;
  created_at: string;
}

export interface EmployeeLeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type_name?: string;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveRequestStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  company_id: string;
  name: string;
  date: string;
  year: number;
  holiday_type: string;
  description?: string;
  status: string;
  created_by?: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  company_id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  unit: string;
  standard_rate: number;
  description?: string;
  status: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  supplier_code: string;
  company_id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  gst_number?: string;
  notes?: string;
  status: string;
  registered_by?: string;
  registered_by_name?: string;
  registered_date: string;
  updated_by?: string;
  updated_at: string;
  metrics?: {
    total_purchases_amount: number;
    total_paid_amount: number;
    total_outstanding_amount: number;
    total_orders_count: number;
  };
}

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  discount: number;
  tax: number;
  line_total: number;
  brand?: string;
  grade?: string;
  quality_status: QualityStatus;
  quality_notes?: string;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  company_id: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_date: string;
  subtotal: number;
  transport_cost: number;
  other_charges: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: PaymentStatus;
  invoice_number?: string;
  invoice_document_url?: string;
  notes?: string;
  created_by: string;
  created_by_name?: string;
  approved_by?: string;
  items?: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_id?: string;
  purchase_number?: string;
  description: string;
  receipt_url?: string;
  created_by: string;
  created_by_name?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  actor_employee_id: string;
  actor_employee_name?: string;
  action: string;
  module: string;
  entity_type: string;
  entity_id?: string;
  change_metadata?: Record<string, any>;
  timestamp: string;
}

export interface ConstructionSite {
  id: string;
  site_code: string;
  company_id?: string;
  name: string;
  location?: string;
  site_manager_id?: string;
  site_manager_name?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  metrics?: {
    total_purchases_amount: number;
    total_expenses_amount: number;
    purchases_count: number;
    expenses_count: number;
  };
}

export type FinancialDocumentStatus = 'Draft' | 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
export type FinancialExpenseType = 'Product Purchase' | 'Labour' | 'Transportation' | 'Equipment' | 'Extra Fund' | 'Maintenance' | 'Other Expense';
export type PaymentMethodType = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Card' | 'Other';

export interface FinancialLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface FinancialDocument {
  id: string;
  invoice_no: string;
  doc_number?: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  vendor_name: string;
  supplier_id?: string;
  supplier_name?: string;
  date: string;
  transaction_date?: string;
  items: FinancialLineItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  total_amount?: number;
  expense_type?: FinancialExpenseType;
  payment_method?: PaymentMethodType;
  description?: string;
  receipt_url?: string;
  pdf_url?: string;
  status: FinancialDocumentStatus;
  admin_remarks?: string;
  created_by: string;
  created_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export type ProductRequestStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Ordered' | 'Partially Received' | 'Received' | 'Completed' | 'Cancelled';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ProductRequest {
  id: string;
  request_code: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  product_id?: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  required_date: string;
  priority: PriorityLevel;
  reason?: string;
  attachment_url?: string;
  requested_by: string;
  requested_by_name?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  status: ProductRequestStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  category_name?: string;
  opening_stock: number;
  received_qty: number;
  transferred_in_qty: number;
  used_qty: number;
  damaged_qty: number;
  unwanted_qty: number;
  transferred_out_qty: number;
  current_balance: number;
  min_stock_level: number;
  unit: string;
  updated_at?: string;
}

export type InventoryTransactionType =
  | 'Opening Stock'
  | 'Purchase'
  | 'Material Received'
  | 'Material Used'
  | 'Damaged'
  | 'Unwanted'
  | 'Transfer In'
  | 'Transfer Out'
  | 'Stock Adjustment'
  | 'Return';

export interface InventoryTransaction {
  id: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  transaction_type: InventoryTransactionType;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface MaterialUsage {
  id: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  product_id: string;
  product_name?: string;
  quantity_used: number;
  unit: string;
  activity: string;
  usage_date: string;
  used_by: string;
  used_by_name?: string;
  notes?: string;
  photo_url?: string;
  created_at: string;
}

export interface DamagedMaterial {
  id: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  damage_date: string;
  reason: string;
  description?: string;
  photo_url?: string;
  reported_by: string;
  reported_by_name?: string;
  status: 'Reported' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface UnwantedMaterial {
  id: string;
  company_id: string;
  site_id: string;
  site_name?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  reason: string;
  date: string;
  description?: string;
  photo_url?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export type MaterialTransferStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Transit' | 'Received' | 'Cancelled';

export interface MaterialTransfer {
  id: string;
  transfer_code: string;
  company_id: string;
  from_site_id: string;
  from_site_name?: string;
  to_site_id: string;
  to_site_name?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  reason: string;
  status: MaterialTransferStatus;
  requested_by: string;
  requested_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  received_by?: string;
  received_by_name?: string;
  transfer_date: string;
  received_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

