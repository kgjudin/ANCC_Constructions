import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import { Sun, Plus, Trash2 } from 'lucide-react';
import { Holiday } from '@construction/shared-types';

export const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    holiday_type: 'Public',
    description: ''
  });

  const fetchHolidays = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res: any = await api.get('/holidays');
      setHolidays(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load company holidays');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      await api.post('/holidays', formData);
      setIsModalOpen(false);
      fetchHolidays();
    } catch (err: any) {
      setModalError(err.message || 'Failed to add holiday. Check for duplicate dates.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      fetchHolidays();
    } catch (err: any) {
      alert(err.message || 'Failed to delete holiday');
    }
  };

  const columns: Column<Holiday>[] = [
    {
      header: 'Holiday Name',
      accessor: (row) => <span className="font-bold text-slate-900">{row.name}</span>
    },
    { header: 'Date', accessor: 'date' },
    { header: 'Year', accessor: 'year' },
    { header: 'Type', accessor: (row) => <span className="font-medium text-brand-600">{row.holiday_type}</span> },
    { header: 'Description', accessor: (row) => row.description || '—' },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} icon={<Trash2 className="w-4 h-4 text-red-500" />}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yearly Company Holidays"
        description="Official company holiday master table recognized by attendance and leave reporting."
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Company Holiday
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={fetchHolidays} />
      ) : (
        <DataTable
          columns={columns}
          data={holidays}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyTitle="No holidays configured"
          emptyDescription="Add company holidays to incorporate into employee attendance logs."
        />
      )}

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Company Holiday"
        subtitle="Ensure dates do not overlap existing holidays."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <p className="text-xs text-red-600 font-semibold">{modalError}</p>}

          <Input
            label="Holiday Name"
            placeholder="e.g. New Year's Day / Republic Day"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => {
                const yr = new Date(e.target.value).getFullYear();
                setFormData({ ...formData, date: e.target.value, year: yr });
              }}
              required
            />
            <Input
              label="Holiday Type"
              value={formData.holiday_type}
              onChange={(e) => setFormData({ ...formData, holiday_type: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description"
            placeholder="Optional notes"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Holiday
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
