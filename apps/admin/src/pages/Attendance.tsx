import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import { CalendarCheck, Plus, Clock } from 'lucide-react';
import { Attendance } from '@construction/shared-types';

export const AttendancePage: React.FC = () => {
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEmp, setFilterEmp] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '18:00',
    status: 'Present',
    notes: ''
  });

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterEmp) params.append('employee_id', filterEmp);

      const res: any = await api.get(`/attendance?${params.toString()}`);
      setLogs(res.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res: any = await api.get('/employees');
      const items = res.data?.items || [];
      setEmployees(items);
      if (items.length > 0) setFormData((prev) => ({ ...prev, employee_id: items[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, [filterDate, filterEmp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      await api.post('/attendance', formData);
      setIsModalOpen(false);
      fetchAttendance();
    } catch (err: any) {
      setModalError(err.message || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Attendance>[] = [
    {
      header: 'Employee',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.employee_name}</p>
        </div>
      )
    },
    { header: 'Date', accessor: 'date' },
    { header: 'Check In', accessor: (row) => row.check_in || '—' },
    { header: 'Check Out', accessor: (row) => row.check_out || '—' },
    { header: 'Total Hours', accessor: (row) => (row.total_hours ? `${row.total_hours} hrs` : '—') },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />
    },
    { header: 'Notes', accessor: (row) => row.notes || '—' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        description="Daily attendance check-ins, check-outs, total working hours, and status corrections."
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Record / Adjust Attendance
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-60">
          <Input
            label="Filter Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            label="Filter Employee"
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
            options={[
              { label: 'All Employees', value: '' },
              ...employees.map((e) => ({ label: `${e.full_name} (${e.employee_code})`, value: e.id }))
            ]}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchAttendance} />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyTitle="No attendance records found"
          emptyDescription="No attendance logged for the selected date or employee filter."
        />
      )}

      {/* Record / Adjust Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record / Correct Attendance"
        subtitle="Modifications generate a traceable audit log."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <p className="text-xs text-red-600 font-semibold">{modalError}</p>}

          <Select
            label="Target Employee"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            options={employees.map((e) => ({ label: `${e.full_name} (${e.employee_code})`, value: e.id }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: 'Present', value: 'Present' },
                { label: 'Absent', value: 'Absent' },
                { label: 'Half Day', value: 'Half Day' },
                { label: 'Leave', value: 'Leave' },
                { label: 'Holiday', value: 'Holiday' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Check-In Time"
              type="time"
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
            />
            <Input
              label="Check-Out Time"
              type="time"
              value={formData.check_out}
              onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
            />
          </div>

          <Input
            label="Notes / Reason for Correction"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. On-site inspection client meeting"
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Attendance Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
