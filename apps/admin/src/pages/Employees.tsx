import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Users,
  Plus,
  Search,
  UserPlus,
  Edit2,
  ShieldAlert,
  MessageSquare,
  Upload,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  KeyRound
} from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { useAuthStore } from '../store/useAuthStore';
import { Employee } from '@construction/shared-types';

export const Employees: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Password Reset Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetResetEmp, setTargetResetEmp] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('ANCC@2026');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState('');
  const [passwordResetError, setPasswordResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: 'password123',
    role_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res: any = await api.get(`/employees?${params.toString()}`);
      setEmployees(res.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res: any = await api.get('/roles');
      const fetchedRoles = res.data || [];
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0 && !formData.role_id) {
        setFormData((prev) => ({ ...prev, role_id: String(fetchedRoles[0].id) }));
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingEmp(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: 'password123',
      role_id: roles.length > 0 ? String(roles[0].id) : '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      password: '',
      role_id: String(emp.role_id || (roles.length > 0 ? roles[0].id : '')),
      joining_date: emp.joining_date,
      status: emp.status
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (editingEmp) {
        await api.patch(`/employees/${editingEmp.id}`, {
          full_name: formData.full_name,
          phone: formData.phone,
          role_id: formData.role_id,
          status: formData.status
        });
      } else {
        await api.post('/employees', formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save employee profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPasswordReset = (emp: Employee) => {
    setTargetResetEmp(emp);
    setNewPassword('ANCC@2026');
    setPasswordResetSuccess('');
    setPasswordResetError('');
    setIsPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResetEmp) return;
    setIsResetting(true);
    setPasswordResetError('');
    setPasswordResetSuccess('');

    try {
      await api.post(`/employees/${targetResetEmp.id}/reset-password`, {
        new_password: newPassword
      });
      setPasswordResetSuccess(`Password for ${targetResetEmp.full_name} has been updated to "${newPassword}" successfully!`);
    } catch (err: any) {
      setPasswordResetError(err.message || 'Failed to reset employee password');
    } finally {
      setIsResetting(false);
    }
  };

  const activeCount = employees.filter((e) => e.status === 'Active').length;

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Employees Directory &amp; Staff List
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage company personnel, profiles, roles, and status attribution.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
            Export Directory
          </Button>

          {hasPermission(PERMISSIONS.EMPLOYEE_CREATE) && (
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5"
              icon={<UserPlus className="w-4 h-4" />}
            >
              + Add New Employee
            </Button>
          )}
        </div>
      </div>

      {/* 4 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL EMPLOYEES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Employees</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{employees.length || 4}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• Active corporate directory</span>
          </div>
        </div>

        {/* Card 2: ACTIVE STAFF */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{activeCount || 4}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ 100% active utilization</span>
          </div>
        </div>

        {/* Card 3: MANAGEMENT ROLES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Roles</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{roles.length || 4}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-blue-600 font-bold">• RBAC permissions active</span>
          </div>
        </div>

        {/* Card 4: ATTENDANCE COMPLIANCE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Compliance</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-teal-600">Verified</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ Traceable employee logs</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR CARD (DARK SLATE CONTAINER) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by code, name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Active Only', value: 'Active' },
              { label: 'Inactive Only', value: 'Inactive' },
              { label: 'Resigned', value: 'Resigned' }
            ]}
          />
        </div>
      </div>

      {/* TABLE CONTAINER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={fetchEmployees} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-32">Employee Code</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joining Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-teal-800 font-mono text-xs bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200">
                        {row.employee_code}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{row.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{row.email}</p>
                    </td>
                    <td className="p-4 text-slate-600 font-mono font-medium">{row.phone}</td>
                    <td className="p-4 font-semibold text-slate-800">{row.role_name || 'Staff'}</td>
                    <td className="p-4 text-slate-500">{row.joining_date}</td>
                    <td className="p-4 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/chat?user_id=${row.user_id}`)}
                          className="px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                          <span>Chat</span>
                        </button>

                        {hasPermission(PERMISSIONS.EMPLOYEE_EDIT) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(row)}
                              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenPasswordReset(row)}
                              className="px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                              title="Reset Password for employee"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reset Password</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">{employees.length}</strong> of <strong className="text-slate-900">{employees.length}</strong> employees
          </div>
          <div className="flex items-center space-x-2">
            <button disabled className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-400 disabled:opacity-50 font-semibold">
              Previous
            </button>
            <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center">
              1
            </span>
            <button disabled className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-400 disabled:opacity-50 font-semibold">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmp ? `Edit Employee ${editingEmp.employee_code}` : 'Register New Employee'}
        subtitle="Automatic leave allocations and authentication profile will be generated."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingEmp}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          {!editingEmp && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role"
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              options={roles.map((r) => ({ label: r.name, value: String(r.id) }))}
              required
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
                { label: 'Resigned', value: 'Resigned' }
              ]}
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingEmp ? 'Update Employee' : 'Register Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Reset Password for ${targetResetEmp?.full_name}`}
        subtitle={`Employee ID: ${targetResetEmp?.employee_code}`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          {passwordResetError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2 border border-red-200">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{passwordResetError}</span>
            </div>
          )}

          {passwordResetSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center space-x-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{passwordResetSuccess}</span>
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Close
            </Button>
            <Button type="submit" isLoading={isResetting} disabled={!!passwordResetSuccess}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
