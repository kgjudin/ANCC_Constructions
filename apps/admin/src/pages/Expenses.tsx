import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CreatableSelect } from '../components/ui/CreatableSelect';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import { Receipt, Plus, Search } from 'lucide-react';
import { Expense } from '@construction/shared-types';
import { ExpenseCategory } from '@construction/constants';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    category: ExpenseCategory.MATERIAL,
    amount: 1000,
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    description: '',
    receipt_url: ''
  });

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);

      const [eRes, sRes]: any[] = await Promise.all([
        api.get(`/expenses?${params.toString()}`),
        api.get('/suppliers')
      ]);

      setExpenses(eRes.data?.items || []);
      setSuppliers(sRes.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      await api.post('/expenses', formData);
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      setModalError(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Expense>[] = [
    {
      header: 'Category',
      accessor: (row) => <span className="font-bold text-brand-700">{row.category}</span>
    },
    {
      header: 'Amount',
      accessor: (row) => <span className="font-extrabold text-slate-900">₹{Number(row.amount).toLocaleString('en-IN')}</span>
    },
    { header: 'Date', accessor: 'date' },
    { header: 'Supplier Link', accessor: (row) => row.supplier_name || '—' },
    { header: 'Description', accessor: 'description' },
    { header: 'Recorded By', accessor: (row) => row.created_by_name || 'System' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management"
        description="Track site expenses across Categories (Material, Transport, Labour, Fuel, Equipment, Other)."
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Record New Expense
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full sm:w-64">
        <Select
          label="Filter Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { label: 'All Categories', value: '' },
            ...Object.values(ExpenseCategory).map((c) => ({ label: String(c), value: String(c) }))
          ]}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchExpenses} />
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyTitle="No expenses recorded"
          emptyDescription="Record site or operational expenses to monitor financial outflow."
        />
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Expense Entry"
        subtitle="Automatic attribution links the entry to your employee credentials."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <p className="text-xs text-red-600 font-semibold">{modalError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CreatableSelect
              label="Expense Category"
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
              options={[
                ...Object.values(ExpenseCategory).map((c) => ({ label: String(c), value: String(c) }))
              ]}
              required
            />
            <Input
              label="Amount (₹)"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Select
              label="Related Supplier (Optional)"
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              options={[
                { label: 'None', value: '' },
                ...suppliers.map((s) => ({ label: s.company_name, value: s.id }))
              ]}
            />
          </div>

          <Input
            label="Description / Purpose"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Fuel for generator at Site B"
            required
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
