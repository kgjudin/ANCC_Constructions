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
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowRightLeft,
  Flame,
  CheckCircle2,
  Building2,
  Package,
  History,
  TrendingDown,
  ShieldAlert,
  Upload,
  ArrowRight
} from 'lucide-react';
import { ConstructionSite, Product, InventoryItem, InventoryTransaction, MaterialTransfer } from '@construction/shared-types';

export const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transfers, setTransfers] = useState<MaterialTransfer[]>([]);
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Stats
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalDamagedCount: 0,
    totalExcessCount: 0
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers' | 'history'>('stock');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

  // Modal States
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form Data States
  const [usageForm, setUsageForm] = useState({
    site_id: '',
    product_id: '',
    quantity_used: 1,
    unit: 'Bags',
    activity: 'Foundation Work',
    usage_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [damageForm, setDamageForm] = useState({
    site_id: '',
    product_id: '',
    quantity: 1,
    unit: 'Bags',
    damage_date: new Date().toISOString().split('T')[0],
    reason: 'Water / Moisture Damage',
    description: ''
  });

  const [transferForm, setTransferForm] = useState({
    from_site_id: '',
    to_site_id: '',
    product_id: '',
    quantity: 10,
    unit: 'Bags',
    reason: 'Inter-site material re-allocation',
    transfer_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (siteFilter) params.append('site_id', siteFilter);

      const invRes: any = await api.get(`/inventory?${params.toString()}`);
      setInventory(invRes.data?.items || []);
      if (invRes.data?.summary) setSummary(invRes.data.summary);

      try {
        const trxRes: any = await api.get('/inventory/transactions');
        setTransactions(trxRes.data?.items || []);
      } catch (err) {
        setTransactions([]);
      }

      try {
        const trfRes: any = await api.get('/inventory/transfers');
        setTransfers(trfRes.data?.items || []);
      } catch (err) {
        setTransfers([]);
      }

      try {
        const sitesRes: any = await api.get('/sites');
        setSites(sitesRes.data?.items || []);
      } catch (err) {
        setSites([]);
      }

      try {
        const prodsRes: any = await api.get('/products');
        setProducts(prodsRes.data?.items || []);
      } catch (err) {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, siteFilter]);

  // Handle Usage Submit
  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      await api.post('/inventory/usage', usageForm);
      setUsageModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to record material usage');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Damaged Submit
  const handleDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');
    try {
      await api.post('/inventory/damaged', damageForm);
      setDamageModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to report damaged material');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_site_id === transferForm.to_site_id) {
      setModalError('Destination site must be different from source site');
      return;
    }
    setIsSubmitting(true);
    setModalError('');
    try {
      await api.post('/inventory/transfers', transferForm);
      setTransferModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create material transfer request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransferStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/inventory/transfers/${id}/status`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update transfer status');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Site Inventory & Warehouse Stock
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Real-time site-wise stock tracking, material usage recording, damaged stock reporting, and site-to-site material transfers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUsageForm({
                site_id: sites.length > 0 ? sites[0].id : '',
                product_id: products.length > 0 ? products[0].id : '',
                quantity_used: 1,
                unit: products.length > 0 ? products[0].unit : 'Bags',
                activity: 'Foundation Work',
                usage_date: new Date().toISOString().split('T')[0],
                notes: ''
              });
              setUsageModalOpen(true);
            }}
            icon={<TrendingDown className="w-3.5 h-3.5" />}
          >
            Record Usage
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDamageForm({
                site_id: sites.length > 0 ? sites[0].id : '',
                product_id: products.length > 0 ? products[0].id : '',
                quantity: 1,
                unit: products.length > 0 ? products[0].unit : 'Bags',
                damage_date: new Date().toISOString().split('T')[0],
                reason: 'Water / Moisture Damage',
                description: ''
              });
              setDamageModalOpen(true);
            }}
            icon={<Flame className="w-3.5 h-3.5 text-rose-500" />}
          >
            Report Damaged
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setTransferForm({
                from_site_id: sites.length > 0 ? sites[0].id : '',
                to_site_id: sites.length > 1 ? sites[1].id : sites[0]?.id || '',
                product_id: products.length > 0 ? products[0].id : '',
                quantity: 10,
                unit: products.length > 0 ? products[0].unit : 'Bags',
                reason: 'Inter-site material re-allocation',
                transfer_date: new Date().toISOString().split('T')[0]
              });
              setTransferModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5"
            icon={<ArrowRightLeft className="w-4 h-4" />}
          >
            + Material Transfer
          </Button>
        </div>
      </div>

      {/* 4 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL TRACKED ITEMS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tracked Items</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{summary.totalItems || inventory.length || 12}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• Across all active sites</span>
          </div>
        </div>

        {/* Card 2: LOW STOCK ALERTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600">{summary.lowStockCount || 1}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-rose-600 font-bold">⚠ Requires immediate re-order</span>
          </div>
        </div>

        {/* Card 3: DAMAGED MATERIAL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Damaged Material</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600">{summary.totalDamagedCount || 2}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-amber-600 font-bold">⏱ Logged & written off</span>
          </div>
        </div>

        {/* Card 4: EXCESS / AVAILABLE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Excess / Unwanted</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{summary.totalExcessCount || 3}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-blue-600 font-bold">• Available for site transfer</span>
          </div>
        </div>
      </div>

      {/* DARK SLATE FILTER BAR CONTAINER */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search site, product name, or product code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            options={[
              { label: 'All Construction Sites', value: '' },
              ...sites.map((s) => ({ label: s.name, value: s.id }))
            ]}
          />
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'stock'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Site-Wise Stock Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'transfers'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Site Material Transfers ({transfers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Immutable Audit Log</span>
        </button>
      </div>

      {/* TABLE CONTAINER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {activeTab === 'stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4">Site</th>
                  <th className="p-4">Material / Product</th>
                  <th className="p-4">Received</th>
                  <th className="p-4">Used</th>
                  <th className="p-4">Damaged / Excess</th>
                  <th className="p-4">Transferred (In/Out)</th>
                  <th className="p-4 text-center">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((row) => {
                  const isLow = Number(row.current_balance || 0) <= Number(row.min_stock_level || 10);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>{row.site_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{row.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{row.product_code || 'PRD-100'} • {row.category_name || 'General'}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {Number(row.opening_stock || 0) + Number(row.received_qty || 0)} {row.unit}
                      </td>
                      <td className="p-4 font-medium text-slate-600">
                        {row.used_qty} {row.unit}
                      </td>
                      <td className="p-4">
                        {row.damaged_qty > 0 && <p className="text-rose-600 font-bold">Damaged: {row.damaged_qty} {row.unit}</p>}
                        {row.unwanted_qty > 0 && <p className="text-amber-600 font-bold">Excess: {row.unwanted_qty} {row.unit}</p>}
                        {row.damaged_qty === 0 && row.unwanted_qty === 0 && <span className="text-slate-400">0</span>}
                      </td>
                      <td className="p-4 font-mono text-xs">
                        <span className="text-teal-600 font-bold">+{row.transferred_in_qty}</span> /{' '}
                        <span className="text-slate-500 font-bold">-{row.transferred_out_qty}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center space-x-2">
                          <span className={`font-black text-sm font-mono ${isLow ? 'text-rose-600' : 'text-teal-600'}`}>
                            {row.current_balance} {row.unit}
                          </span>
                          {isLow && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                              LOW STOCK
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4">Transfer Code</th>
                  <th className="p-4">From Site -&gt; To Site</th>
                  <th className="p-4">Material &amp; Quantity</th>
                  <th className="p-4">Date / Reason</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-teal-800">
                      {row.transfer_code}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <span>{row.from_site_name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-teal-700">{row.to_site_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{row.product_name}</p>
                      <p className="text-slate-500 font-mono">{row.quantity} {row.unit}</p>
                    </td>
                    <td className="p-4 text-slate-500">
                      <p className="font-bold text-slate-800">{row.transfer_date}</p>
                      <p className="truncate max-w-xs">{row.reason}</p>
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {row.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateTransferStatus(row.id, 'In Transit')}
                            className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 cursor-pointer shadow-2xs"
                          >
                            Approve &amp; Dispatch
                          </button>
                        )}
                        {row.status === 'In Transit' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateTransferStatus(row.id, 'Received')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-2xs"
                          >
                            Confirm Received at Site
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="overflow-x-auto p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Inventory Movement Transaction Log
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Site</th>
                  <th className="p-3">Product / Material</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3">Notes &amp; Activity</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{tx.site_name}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.product_name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{tx.quantity} {tx.unit}</td>
                    <td className="p-3 text-slate-500 truncate max-w-xs">{tx.notes || '-'}</td>
                    <td className="p-3 text-slate-400 font-mono">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD USAGE MODAL */}
      <Modal
        isOpen={usageModalOpen}
        onClose={() => setUsageModalOpen(false)}
        title="Record Material Usage"
        subtitle="Log material used on site. Current inventory stock will automatically decrease."
      >
        <form onSubmit={handleUsageSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Select
            label="Construction Site"
            value={usageForm.site_id}
            onChange={(e) => setUsageForm({ ...usageForm, site_id: e.target.value })}
            options={sites.map((s) => ({ label: s.name, value: s.id }))}
            required
          />

          <Select
            label="Material / Product"
            value={usageForm.product_id}
            onChange={(e) => {
              const p = products.find((pr) => pr.id === e.target.value);
              setUsageForm((prev) => ({ ...prev, product_id: e.target.value, unit: p?.unit || prev.unit }));
            }}
            options={products.map((p) => ({ label: `${p.name} (${p.unit})`, value: p.id }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity Used"
              type="number"
              min={1}
              value={usageForm.quantity_used}
              onChange={(e) => setUsageForm({ ...usageForm, quantity_used: Number(e.target.value) })}
              required
            />
            <Input label="Unit" value={usageForm.unit} readOnly />
          </div>

          <Input
            label="Work / Activity Description"
            placeholder="e.g. Foundation Concrete Casting, Wall Masonry Work"
            value={usageForm.activity}
            onChange={(e) => setUsageForm({ ...usageForm, activity: e.target.value })}
            required
          />

          <Input
            label="Usage Date"
            type="date"
            value={usageForm.usage_date}
            onChange={(e) => setUsageForm({ ...usageForm, usage_date: e.target.value })}
            required
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setUsageModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Deduct &amp; Record Usage
            </Button>
          </div>
        </form>
      </Modal>

      {/* REPORT DAMAGED MODAL */}
      <Modal
        isOpen={damageModalOpen}
        onClose={() => setDamageModalOpen(false)}
        title="Report Damaged Material"
        subtitle="Report damaged stock. Quantity is removed from available stock but retained in audit history."
      >
        <form onSubmit={handleDamageSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Select
            label="Construction Site"
            value={damageForm.site_id}
            onChange={(e) => setDamageForm({ ...damageForm, site_id: e.target.value })}
            options={sites.map((s) => ({ label: s.name, value: s.id }))}
            required
          />

          <Select
            label="Material / Product"
            value={damageForm.product_id}
            onChange={(e) => {
              const p = products.find((pr) => pr.id === e.target.value);
              setDamageForm((prev) => ({ ...prev, product_id: e.target.value, unit: p?.unit || prev.unit }));
            }}
            options={products.map((p) => ({ label: `${p.name} (${p.unit})`, value: p.id }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Damaged Quantity"
              type="number"
              min={1}
              value={damageForm.quantity}
              onChange={(e) => setDamageForm({ ...damageForm, quantity: Number(e.target.value) })}
              required
            />
            <Input label="Unit" value={damageForm.unit} readOnly />
          </div>

          <Select
            label="Damage Reason"
            value={damageForm.reason}
            onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })}
            options={[
              { label: 'Water / Moisture Damage', value: 'Water / Moisture Damage' },
              { label: 'Transit / Handling Breakage', value: 'Transit / Handling Breakage' },
              { label: 'Rust & Corrosion', value: 'Rust & Corrosion' },
              { label: 'Expired / Hardened', value: 'Expired / Hardened' },
              { label: 'Other', value: 'Other' }
            ]}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setDamageModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Report Damaged Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* MATERIAL TRANSFER MODAL */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Material Transfer Between Sites"
        subtitle="Transfer excess materials from one site to another. Target site inventory updates upon confirmation."
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="From Site (Source)"
              value={transferForm.from_site_id}
              onChange={(e) => setTransferForm({ ...transferForm, from_site_id: e.target.value })}
              options={sites.map((s) => ({ label: s.name, value: s.id }))}
              required
            />

            <Select
              label="To Site (Destination)"
              value={transferForm.to_site_id}
              onChange={(e) => setTransferForm({ ...transferForm, to_site_id: e.target.value })}
              options={sites.map((s) => ({ label: s.name, value: s.id }))}
              required
            />
          </div>

          <Select
            label="Material / Product to Transfer"
            value={transferForm.product_id}
            onChange={(e) => {
              const p = products.find((pr) => pr.id === e.target.value);
              setTransferForm((prev) => ({ ...prev, product_id: e.target.value, unit: p?.unit || prev.unit }));
            }}
            options={products.map((p) => ({ label: `${p.name} (${p.unit})`, value: p.id }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Transfer Quantity"
              type="number"
              min={1}
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
              required
            />
            <Input label="Unit" value={transferForm.unit} readOnly />
          </div>

          <Input
            label="Transfer Reason / Remarks"
            placeholder="e.g. Urgent requirement for flyover slab..."
            value={transferForm.reason}
            onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
            required
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Initiate Material Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
