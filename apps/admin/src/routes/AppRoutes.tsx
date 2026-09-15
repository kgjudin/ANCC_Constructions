import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Employees } from '../pages/Employees';
import { RolesPermissions } from '../pages/RolesPermissions';
import { AttendancePage } from '../pages/Attendance';
import { LeaveManagement } from '../pages/LeaveManagement';
import { Holidays } from '../pages/Holidays';
import { Products } from '../pages/Products';
import { Suppliers } from '../pages/Suppliers';
import { Purchases } from '../pages/Purchases';
import { Expenses } from '../pages/Expenses';
import { Reports } from '../pages/Reports';
import { AuditLogs } from '../pages/AuditLogs';
import { Chat } from '../pages/Chat';
import { Sites } from '../pages/Sites';
import { AccountantFinance } from '../pages/AccountantFinance';
import { ProductRequests } from '../pages/ProductRequests';
import { InventoryManagement } from '../pages/InventoryManagement';
import { LoadingState } from '../components/ui/LoadingState';
import { AccessDeniedState } from '../components/ui/AccessDeniedState';
import { PERMISSIONS } from '@construction/constants';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuthStore();

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><LoadingState message="Verifying session..." /></div>;
  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PermissionGuard: React.FC<{
  permission: string;
  moduleName: string;
  children: React.ReactNode;
}> = ({ permission, moduleName, children }) => {
  const { hasPermission, isLoading } = useAuthStore();

  if (isLoading) return <LoadingState message="Checking permissions..." />;

  if (!hasPermission(permission)) {
    return <AccessDeniedState moduleName={moduleName} requiredPermission={permission} />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<PermissionGuard permission={PERMISSIONS.CHAT_VIEW} moduleName="Team Chat"><Chat /></PermissionGuard>} />
        <Route path="employees" element={<PermissionGuard permission={PERMISSIONS.EMPLOYEE_VIEW} moduleName="Employees Directory"><Employees /></PermissionGuard>} />
        <Route path="roles" element={<PermissionGuard permission={PERMISSIONS.ROLE_VIEW} moduleName="Roles & Permissions"><RolesPermissions /></PermissionGuard>} />
        <Route path="attendance" element={<PermissionGuard permission={PERMISSIONS.ATTENDANCE_VIEW} moduleName="Attendance"><AttendancePage /></PermissionGuard>} />
        <Route path="leave" element={<PermissionGuard permission={PERMISSIONS.LEAVE_VIEW} moduleName="Leave Management"><LeaveManagement /></PermissionGuard>} />
        <Route path="holidays" element={<PermissionGuard permission={PERMISSIONS.HOLIDAY_VIEW} moduleName="Holidays Calendar"><Holidays /></PermissionGuard>} />
        <Route path="products" element={<PermissionGuard permission={PERMISSIONS.PRODUCT_VIEW} moduleName="Products & Materials"><Products /></PermissionGuard>} />
        <Route path="suppliers" element={<PermissionGuard permission={PERMISSIONS.SUPPLIER_VIEW} moduleName="Suppliers Master"><Suppliers /></PermissionGuard>} />
        <Route path="purchases" element={<PermissionGuard permission={PERMISSIONS.PURCHASE_VIEW} moduleName="Material Purchases"><Purchases /></PermissionGuard>} />
        <Route path="sites" element={<PermissionGuard permission={PERMISSIONS.SITE_VIEW} moduleName="Construction Sites"><Sites /></PermissionGuard>} />
        <Route path="sites/:id" element={<PermissionGuard permission={PERMISSIONS.SITE_VIEW} moduleName="Construction Site Details"><Sites /></PermissionGuard>} />
        <Route path="finance" element={<PermissionGuard permission={PERMISSIONS.FINANCE_VIEW} moduleName="Accountant Console & Finance"><AccountantFinance /></PermissionGuard>} />
        <Route path="product-requests" element={<PermissionGuard permission={PERMISSIONS.PRODUCT_REQUEST_VIEW} moduleName="Site Product Requests"><ProductRequests /></PermissionGuard>} />
        <Route path="inventory" element={<PermissionGuard permission={PERMISSIONS.INVENTORY_VIEW} moduleName="Inventory & Warehouse Stock"><InventoryManagement /></PermissionGuard>} />
        <Route path="expenses" element={<PermissionGuard permission={PERMISSIONS.EXPENSE_VIEW} moduleName="Site Expenses & Operational Costs"><Expenses /></PermissionGuard>} />
        <Route path="reports" element={<PermissionGuard permission={PERMISSIONS.REPORT_VIEW} moduleName="Reports & Analytics"><Reports /></PermissionGuard>} />
        <Route path="audit-logs" element={<PermissionGuard permission={PERMISSIONS.AUDIT_LOG_VIEW} moduleName="Audit Logs"><AuditLogs /></PermissionGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
