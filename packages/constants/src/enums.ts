export enum EmployeeStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  RESIGNED = 'Resigned'
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  HALF_DAY = 'Half Day',
  LEAVE = 'Leave',
  HOLIDAY = 'Holiday'
}

export enum LeaveRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled'
}

export enum QualityStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum PaymentStatus {
  UNPAID = 'Unpaid',
  PARTIALLY_PAID = 'Partially Paid',
  PAID = 'Paid'
}

export enum ExpenseCategory {
  MATERIAL = 'Material',
  TRANSPORT = 'Transport',
  LABOUR = 'Labour',
  EQUIPMENT = 'Equipment',
  FUEL = 'Fuel',
  OTHER = 'Other'
}

export enum SystemRoles {
  SUPER_ADMIN = 'Super Admin',
  HR_MANAGER = 'HR Manager',
  PURCHASE_EXECUTIVE = 'Purchase Executive',
  EMPLOYEE = 'Employee'
}

export const AUDIT_MODULES = {
  AUTH: 'AUTH',
  EMPLOYEE: 'EMPLOYEE',
  ROLE: 'ROLE',
  ATTENDANCE: 'ATTENDANCE',
  LEAVE: 'LEAVE',
  HOLIDAY: 'HOLIDAY',
  PRODUCT: 'PRODUCT',
  SUPPLIER: 'SUPPLIER',
  PURCHASE: 'PURCHASE',
  EXPENSE: 'EXPENSE',
  REPORT: 'REPORT'
} as const;
