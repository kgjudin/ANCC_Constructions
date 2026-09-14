import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Plus, CheckCircle2, Lock, Edit2 } from 'lucide-react';
import { Role } from '@construction/shared-types';

export const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermKeys, setSelectedPermKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [rRes, pRes]: any[] = await Promise.all([api.get('/roles'), api.get('/permissions')]);
      const fetchedRoles = rRes.data || [];
      setRoles(fetchedRoles);
      setPermissions(pRes.data || []);
      
      if (fetchedRoles.length > 0) {
        setSelectedRole((prev) => {
          if (!prev) return fetchedRoles[0];
          const updated = fetchedRoles.find((r: Role) => r.id === prev.id);
          return updated || fetchedRoles[0];
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load roles and permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPermKeys([]);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: Role) => {
    setEditingRole(r);
    setRoleName(r.name);
    setRoleDesc(r.description || '');
    const currentKeys = (r.permissions || []).map((p: any) => (typeof p === 'string' ? p : p.key));
    setSelectedPermKeys(currentKeys);
    setModalError('');
    setIsModalOpen(true);
  };

  const togglePermissionKey = (key: string) => {
    setSelectedPermKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAllModulePermissions = (modulePerms: any[]) => {
    const keys = modulePerms.map((p) => p.key);
    const allSelected = keys.every((k) => selectedPermKeys.includes(k));

    if (allSelected) {
      setSelectedPermKeys((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedPermKeys((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, {
          name: roleName,
          description: roleDesc,
          permissions: selectedPermKeys
        });
      } else {
        await api.post('/roles', {
          name: roleName,
          description: roleDesc,
          permissions: selectedPermKeys
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save role permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by Module
  const groupedPermissions = permissions.reduce<Record<string, any[]>>((acc, perm) => {
    const mod = perm.module || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  if (isLoading) return <LoadingState message="Loading role matrices..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Security Permissions"
        description="Configure granular permission keys for modules across the platform."
        action={
          <Button onClick={handleOpenCreateModal} icon={<Plus className="w-4 h-4" />}>
            Create Custom Role
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Selection Sidebar */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Configured Roles</h3>
          {roles.map((r) => {
            const isSelected = selectedRole?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base">{r.name}</span>
                  {r.is_system ? (
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-brand-700 text-brand-100' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      System Role
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Custom Role
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 ${isSelected ? 'text-brand-100' : 'text-slate-500'}`}>
                  {r.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Permission Matrix Display & Edit Header */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card
              title={`Permissions for "${selectedRole.name}"`}
              subtitle={selectedRole.description}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEditModal(selectedRole)}
                  icon={<Edit2 className="w-4 h-4" />}
                >
                  Edit Role & Permissions
                </Button>
              }
            >
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                  <div key={moduleName} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-700">{moduleName} Module</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modulePerms.map((perm: any) => {
                        const isGranted = (selectedRole.permissions || []).some(
                          (p: any) => (typeof p === 'string' ? p : p.key) === perm.key
                        );

                        return (
                          <div
                            key={perm.key}
                            className={`p-3 rounded-lg border flex items-center space-x-3 text-xs font-medium ${
                              isGranted
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isGranted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{perm.description}</p>
                              <code className="text-[10px] text-slate-400 font-mono">{perm.key}</code>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Create / Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role'}
        subtitle="Configure role details and check/uncheck granular permissions per module."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-5">
          {modalError && <p className="text-xs text-red-600 font-semibold">{modalError}</p>}

          <Input
            label="Role Name"
            placeholder="e.g. Site Supervisor / Purchase Executive"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="Role responsibilities description"
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
            required
          />

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Assign Permissions</h4>
              <span className="text-xs text-brand-600 font-semibold">{selectedPermKeys.length} Selected</span>
            </div>
            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2 border rounded-xl p-3 bg-slate-50">
              {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                const keys = modulePerms.map((p: any) => p.key);
                const allSelected = keys.every((k: string) => selectedPermKeys.includes(k));

                return (
                  <div key={moduleName} className="space-y-2 border-b border-slate-200/80 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider">{moduleName} Module</span>
                      <button
                        type="button"
                        onClick={() => toggleAllModulePermissions(modulePerms)}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 underline"
                      >
                        {allSelected ? 'Unselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modulePerms.map((perm: any) => {
                        const isChecked = selectedPermKeys.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className={`flex items-center space-x-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermissionKey(perm.key)}
                              className="rounded text-brand-600 focus:ring-brand-500"
                            />
                            <span>{perm.description}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
