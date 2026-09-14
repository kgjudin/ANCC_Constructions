export const PERMISSIONS = {
  EMPLOYEE_VIEW: 'employee.view',
  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_EDIT: 'employee.edit',
  EMPLOYEE_DELETE: 'employee.delete',

  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_EDIT: 'attendance.edit',

  LEAVE_VIEW: 'leave.view',
  LEAVE_REQUEST: 'leave.request',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_REJECT: 'leave.reject',

  HOLIDAY_VIEW: 'holiday.view',
  HOLIDAY_CREATE: 'holiday.create',
  HOLIDAY_EDIT: 'holiday.edit',
  HOLIDAY_DELETE: 'holiday.delete',

  SUPPLIER_VIEW: 'supplier.view',
  SUPPLIER_CREATE: 'supplier.create',
  SUPPLIER_EDIT: 'supplier.edit',
  SUPPLIER_DELETE: 'supplier.delete',

  PRODUCT_VIEW: 'product.view',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_EDIT: 'product.edit',
  PRODUCT_DELETE: 'product.delete',

  PURCHASE_VIEW: 'purchase.view',
  PURCHASE_CREATE: 'purchase.create',
  PURCHASE_EDIT: 'purchase.edit',
  PURCHASE_DELETE: 'purchase.delete',
  PURCHASE_APPROVE: 'purchase.approve',

  EXPENSE_VIEW: 'expense.view',
  EXPENSE_CREATE: 'expense.create',
  EXPENSE_EDIT: 'expense.edit',
  EXPENSE_DELETE: 'expense.delete',

  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',

  AUDIT_LOG_VIEW: 'audit_log.view',

  CHAT_VIEW: 'chat.view',

  SITE_VIEW: 'site.view',
  SITE_CREATE: 'site.create',
  SITE_EDIT: 'site.edit',
  SITE_DELETE: 'site.delete',

  FINANCE_VIEW: 'finance.view',
  FINANCE_CREATE: 'finance.create',
  FINANCE_APPROVE: 'finance.approve',
  FINANCE_DELETE: 'finance.delete',

  PRODUCT_REQUEST_VIEW: 'product_request.view',
  PRODUCT_REQUEST_CREATE: 'product_request.create',
  PRODUCT_REQUEST_APPROVE: 'product_request.approve',
  PRODUCT_REQUEST_FULFILL: 'product_request.fulfill',

  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  INVENTORY_USAGE: 'inventory.usage',
  INVENTORY_DAMAGE: 'inventory.damage',
  INVENTORY_TRANSFER: 'inventory.transfer'
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);
