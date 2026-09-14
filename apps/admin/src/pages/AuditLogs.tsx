import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { History, Search, Eye, ShieldCheck, Activity } from 'lucide-react';
import { AuditLog } from '@construction/shared-types';
import { AUDIT_MODULES } from '@construction/constants';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  // JSON Metadata Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (moduleFilter) params.append('module', moduleFilter);

      const res: any = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [moduleFilter]);

  const handleViewMetadata = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: (row) => <span className="font-mono text-xs text-slate-500">{new Date(row.timestamp).toLocaleString()}</span>
    },
    {
      header: 'Actor Employee',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.actor_employee_name || 'System'}</span>
        </div>
      )
    },
    {
      header: 'Action',
      accessor: (row) => <span className="font-extrabold text-brand-700">{row.action}</span>
    },
    {
      header: 'Module',
      accessor: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-xs">
          {row.module}
        </span>
      )
    },
    { header: 'Entity Type', accessor: 'entity_type' },
    {
      header: 'Details',
      accessor: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewMetadata(row)} icon={<Eye className="w-4 h-4" />}>
          View Payload
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traceable Audit Activity Logs"
        description="Immutable record of system operations attributed to authenticated employee credentials."
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full sm:w-64">
        <Select
          label="Filter by Module"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          options={[
            { label: 'All Modules', value: '' },
            ...Object.values(AUDIT_MODULES).map((m) => ({ label: m, value: m }))
          ]}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchAuditLogs} />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyTitle="No audit logs recorded"
          emptyDescription="Audit records are automatically recorded as employee actions occur."
        />
      )}

      {/* JSON Change Metadata View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Audit Event — ${selectedLog?.action}`}
        subtitle={`Actor: ${selectedLog?.actor_employee_name} | Module: ${selectedLog?.module}`}
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto font-mono text-xs shadow-inner">
              <pre>{JSON.stringify(selectedLog.change_metadata || {}, null, 2)}</pre>
            </div>
            <p className="text-[11px] text-slate-400">
              * Secure Audit Policy: Passwords, tokens, and secrets are strictly excluded from audit payloads.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
