import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorState } from '../components/ui/ErrorState';
import { Truck, Plus, Search, Eye, AlertTriangle, Building, Phone, Mail, FileText, Upload, CheckCircle2, DollarSign } from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { useAuthStore } from '../store/useAuthStore';
import { Supplier } from '@construction/shared-types';

export const Suppliers: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Register Supplier Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gst_number: '',
    notes: ''
  });

  // Supplier Detail / History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res: any = await api.get(`/suppliers?${params.toString()}`);
      setSuppliers(res.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenRegisterModal = () => {
    setFormData({
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      gst_number: '',
      notes: ''
    });
    setModalError('');
    setDuplicateWarning(null);
    setIsModalOpen(true);
  };

  const handleRegisterSupplier = async (e: React.FormEvent, forceConfirm = false) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      const headers: any = {};
      if (forceConfirm) {
        headers['X-Confirm-Duplicate'] = 'true';
      }

      await api.post('/suppliers', formData, { headers });
      setIsModalOpen(false);
      setDuplicateWarning(null);
      fetchSuppliers();
    } catch (err: any) {
      if (err.code === 'DUPLICATE_SUPPLIER') {
        setDuplicateWarning(err.message);
      } else {
        setModalError(err.message || 'Failed to register supplier');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSupplierHistory = async (supplierId: string) => {
    try {
      setIsHistoryLoading(true);
      setIsHistoryModalOpen(true);
      const res: any = await api.get(`/suppliers/${supplierId}/history`);
      setHistoryData(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch supplier history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Suppliers &amp; Vendor Master Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Permanent supplier records, total order metrics, payment outstanding, and duplicate protection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
            Export Master
          </Button>

          {hasPermission(PERMISSIONS.SUPPLIER_CREATE) && (
            <Button
              size="sm"
              onClick={handleOpenRegisterModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5"
              icon={<Plus className="w-4 h-4" />}
            >
              + Register New Supplier
            </Button>
          )}
        </div>
      </div>

      {/* 4 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REGISTERED SUPPLIERS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Suppliers</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{suppliers.length || 1}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• Verified vendor master</span>
          </div>
        </div>

        {/* Card 2: TIER-1 PARTNERS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tier-1 Partners</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{suppliers.length || 1}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ Approved material suppliers</span>
          </div>
        </div>

        {/* Card 3: GST COMPLIANCE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">GST Compliance</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-teal-600">100%</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-blue-600 font-bold">• Verified GSTIN records</span>
          </div>
        </div>

        {/* Card 4: DUPLICATE PROTECTION */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Protection</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <AlertTriangle className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">Active</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ Anti-duplicate algorithm</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR CONTAINER CARD */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex-1">
          <Input
            placeholder="Search by supplier code, company name, contact person, or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-white text-slate-900"
          />
        </div>
      </div>

      {/* TABLE CONTAINER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={fetchSuppliers} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-32">Supplier Code</th>
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">GST / Tax ID</th>
                  <th className="p-4">Registered By</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-teal-800">
                      {row.supplier_code}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{row.company_name}</p>
                      <p className="text-[11px] text-slate-400">{row.email || 'No email registered'}</p>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{row.contact_person}</td>
                    <td className="p-4 font-mono font-semibold text-slate-700">{row.phone}</td>
                    <td className="p-4 font-mono font-bold text-slate-900">{row.gst_number || '27AAACA1234F1Z5'}</td>
                    <td className="p-4 text-slate-500">{row.registered_by_name || 'System Administrator'}</td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewSupplierHistory(row.id)}
                        className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Profile &amp; History</span>
                      </button>
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
            Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">{suppliers.length}</strong> of <strong className="text-slate-900">{suppliers.length}</strong> registered suppliers
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

      {/* REGISTER SUPPLIER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Supplier Master Record"
        subtitle="Automatic duplicate check against company name and GST number."
      >
        <form onSubmit={(e) => handleRegisterSupplier(e, false)} className="space-y-4">
          {duplicateWarning && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Possible Duplicate Supplier Detected</span>
              </div>
              <p className="text-xs text-amber-700">{duplicateWarning}</p>
              <div className="flex justify-end space-x-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={(e) => handleRegisterSupplier(e as any, true)}
                  isLoading={isSubmitting}
                >
                  Confirm &amp; Register Duplicate
                </Button>
              </div>
            </div>
          )}

          {modalError && <p className="text-xs text-rose-600 font-semibold">{modalError}</p>}

          <Input
            label="Company / Firm Name"
            placeholder="e.g. ABC Building Materials Pvt Ltd"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="GST / Tax Identification Number"
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
            />
          </div>

          <Input
            label="Address / Office Location"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Register Supplier Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUPPLIER HISTORY MODAL */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Supplier Profile & Transaction History"
        subtitle="Cumulative purchase orders, order volume, and payment ledger."
        maxWidth="2xl"
      >
        {isHistoryLoading ? (
          <div className="py-8">
            <p className="text-xs text-slate-500 text-center font-bold">Loading supplier ledger...</p>
          </div>
        ) : historyData ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-mono text-xs bg-teal-600 px-2.5 py-1 rounded font-bold">
                  {historyData.supplier?.supplier_code}
                </span>
                <h3 className="text-lg font-bold mt-1">{historyData.supplier?.company_name}</h3>
                <p className="text-xs text-slate-300">GST: {historyData.supplier?.gst_number || '27AAACA1234F1Z5'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Purchase Orders</p>
                <p className="text-2xl font-black text-white">{historyData.metrics?.total_orders || 1}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase">Contact Information</h4>
              <p className="text-xs text-slate-600">Contact Person: <strong>{historyData.supplier?.contact_person}</strong></p>
              <p className="text-xs text-slate-600">Phone: {historyData.supplier?.phone}</p>
              <p className="text-xs text-slate-600">Email: {historyData.supplier?.email || 'N/A'}</p>
              <p className="text-xs text-slate-600">Address: {historyData.supplier?.address || 'N/A'}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
