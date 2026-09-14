import { Employee, Role, Permission } from './models.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    company_id: string;
  };
  employee: Employee;
  role: Role;
  permissions: Permission[];
}
