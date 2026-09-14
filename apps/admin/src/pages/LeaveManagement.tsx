import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { CalendarDays, CheckCircle, XCircle, Plus, Send, Wallet } from 'lucide-react';
import { LeaveRequest, LeaveType } from '@construction/shared-types';

export const LeaveManagement: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Leave Request Modal
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqEmployeeId, setReqEmployeeId] = useState('');
  const [reqLeaveTypeId, setReqLeaveTypeId] = useState('');
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqError, setReqError] = useState('');
  const [isReqSubmitting, setIsReqSubmitting] = useState(false);

  // Leave Type Modal
  const [isLtModalOpen, setIsLtModalOpen] = useState(false);
  const [ltName, setLtName] = useState('');
  const [ltDays, setLtDays] = useState(12);
  const [isLtSubmitting, setIsLtSubmitting] = useState(false);

  const fetchLeaveData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const [rRes, ltRes, empRes, balRes]: any[] = await Promise.all([
        api.get(`/leave/requests?${params.toString()}`),
        api.get('/leave-types'),
        api.get('/employees?limit=100'),
        api.get('/leave/balances')
      ]);

      setRequests(rRes.data?.items || []);
      setLeaveTypes(ltRes.data || []);
      setEmployees(empRes.data?.items || []);
      setBalances(balRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load leave records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [statusFilter]);

  const handleProcessApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/leave/requests/${id}/approval`, { status });
      fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Failed to process leave approval');
    }
  };

  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');
    setIsReqSubmitting(true);
    try {
      await api.post('/leave/requests', {
        employee_id: reqEmployeeId || undefined,
        leave_type_id: reqLeaveTypeId,
        start_date: reqStartDate,
        end_date: reqEndDate,
        reason: reqReason
      });
      setIsReqModalOpen(false);
      setReqEmployeeId('');
      setReqLeaveTypeId('');
      setReqStartDate('');
      setReqEndDate('');
      setReqReason('');
      fetchLeaveData();
    } catch (err: any) {
      setReqError(err.message || 'Failed to submit leave request');
    } finally {
      setIsReqSubmitting(false);
    }
  };

  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLtSubmitting(true);
    try {
      await api.post('/leave-types', {
        name: ltName,
        allocated_days: Number(ltDays),
        year: new Date().getFullYear()
      });
      setIsLtModalOpen(false);
      setLtName('');
      fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Failed to create leave type');
    } finally {
      setIsLtSubmitting(false);
    }
  };

  // Compute total days between two dates
  const computeDays = () => {
    if (!reqStartDate || !reqEndDate) return 0;
    const start = new Date(reqStartDate);
    const end = new Date(reqEndDate);
    if (end < start) return 0;
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const columns: Column<LeaveRequest>[] = [
    {
      header: 'Employee',
      accessor: (row) => <span className="font-bold text-slate-900">{(row as any).employee_name}</span>
    },
    {
      header: 'Leave Type',
      accessor: (row) => <span className="font-medium text-brand-700">{(row as any).leave_type_name}</span>
    },
    { header: 'Start Date', accessor: 'start_date' },
    { header: 'End Date', accessor: 'end_date' },
    {
      header: 'Days',
      accessor: (row) => <span className="font-bold text-slate-700">{(row as any).total_days}d</span>
    },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={(row as any).status} />
    },
    {
      header: 'Approved By',
      accessor: (row) => (
        <span className="text-xs text-slate-500">{(row as any).approved_by_name || '—'}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (row) =>
        (row as any).status === 'Pending' ? (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleProcessApproval((row as any).id, 'Approved')}
              icon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleProcessApproval((row as any).id, 'Rejected')}
              icon={<XCircle className="w-3.5 h-3.5" />}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">{(row as any).status}</span>
        )
    }
  ];

  if (isLoading) return <LoadingState message="Loading leave records..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Submit, review, and approve employee leave requests. Balances auto-update on approval."
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsLtModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Leave Type
            </Button>
            <Button
              onClick={() => setIsReqModalOpen(true)}
              icon={<Send className="w-4 h-4" />}
            >
              New Leave Request
            </Button>
          </div>
        }
      />

      {/* Leave Type Quota Cards */}
      {leaveTypes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaveTypes.map((lt) => (
            <Card key={lt.id}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{lt.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                  Year {lt.year}
                </span>
              </div>
              <p className="text-2xl font-black text-brand-600 mt-1">{lt.allocated_days} Days</p>
              <p className="text-xs text-slate-400 mt-0.5">Yearly allocation per employee</p>
            </Card>
          ))}
        </div>
      )}

      {/* Leave Balances Overview per Employee */}
      {balances.length > 0 && (
        <Card title="Employee Leave Balances" action={
          <span className="text-xs text-slate-400">{new Date().getFullYear()} Balance Sheet</span>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Leave Type</th>
                  <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Allocated</th>
                  <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Used</th>
                  <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Remaining</th>
                  <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((bal: any) => {
                  const emp = employees.find((e) => e.id === bal.employee_id);
                  const usedPct = bal.allocated_days > 0 ? Math.round((bal.used_days / bal.allocated_days) * 100) : 0;
                  return (
                    <tr key={bal.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{emp?.full_name || 'Employee'}</td>
                      <td className="py-2.5 px-3 text-brand-700 font-medium">{bal.leave_type_name}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">{bal.allocated_days}d</td>
                      <td className="py-2.5 px-3 text-center font-bold text-orange-600">{bal.used_days}d</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-black ${bal.remaining_days > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {bal.remaining_days}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 min-w-[100px]">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${usedPct >= 100 ? 'bg-red-500' : usedPct >= 75 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(usedPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-[10px]">{usedPct}% used</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Status Filter */}
      <div className="flex items-center space-x-2">
        {['', 'Pending', 'Approved', 'Rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
            }`}
          >
            {s === '' ? 'All Requests' : s}
          </button>
        ))}
      </div>

      {/* Leave Requests Table */}
      {error ? (
        <ErrorState message={error} onRetry={fetchLeaveData} />
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          isLoading={false}
          keyExtractor={(row) => (row as any).id}
          emptyTitle="No leave requests submitted"
          emptyDescription="Submit a new leave request using the 'New Leave Request' button above."
        />
      )}

      {/* New Leave Request Modal */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => { setIsReqModalOpen(false); setReqError(''); }}
        title="Submit Leave Request"
        subtitle="Select employee, leave type, and date range. Balance will be deducted on approval."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
          {reqError && (
            <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg">{reqError}</p>
          )}

          {/* Employee Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Employee</label>
            <select
              value={reqEmployeeId}
              onChange={(e) => setReqEmployeeId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              required
            >
              <option value="">— Select Employee —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.employee_code} — {emp.full_name}</option>
              ))}
            </select>
          </div>

          {/* Leave Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Leave Type</label>
            <select
              value={reqLeaveTypeId}
              onChange={(e) => setReqLeaveTypeId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              required
            >
              <option value="">— Select Leave Type —</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name} ({lt.allocated_days} days/yr)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={reqStartDate}
              onChange={(e) => setReqStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={reqEndDate}
              onChange={(e) => setReqEndDate(e.target.value)}
              required
            />
          </div>

          {/* Days Preview */}
          {reqStartDate && reqEndDate && computeDays() > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-brand-50 border border-brand-200 rounded-xl">
              <Wallet className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-bold text-brand-700">
                Total: <span className="text-lg">{computeDays()}</span> working day{computeDays() !== 1 ? 's' : ''} requested
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Reason for Leave</label>
            <textarea
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              placeholder="Briefly describe the reason for leave (min. 5 chars)"
              rows={3}
              required
              minLength={5}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsReqModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isReqSubmitting} icon={<Send className="w-4 h-4" />}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Configure Leave Type Modal */}
      <Modal
        isOpen={isLtModalOpen}
        onClose={() => setIsLtModalOpen(false)}
        title="Create New Leave Type"
        subtitle="This will automatically allocate leave balances for all active employees."
      >
        <form onSubmit={handleCreateLeaveType} className="space-y-4">
          <Input
            label="Leave Type Name"
            placeholder="e.g. Casual Leave / Sick Leave / Annual Leave"
            value={ltName}
            onChange={(e) => setLtName(e.target.value)}
            required
          />
          <Input
            label="Allocated Days Per Year"
            type="number"
            min={1}
            value={ltDays}
            onChange={(e) => setLtDays(Number(e.target.value))}
            required
          />
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsLtModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLtSubmitting}>
              Create & Allocate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
