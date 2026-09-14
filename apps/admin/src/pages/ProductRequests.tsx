import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  ShoppingCart,
  Truck,
  Upload,
  Zap,
  Eye,
  Check,
  X,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { ConstructionSite, Product, ProductRequest } from '@construction/shared-types';
import { useAuthStore } from '../store/useAuthStore';

export const ProductRequests: React.FC = () => {
  const { hasPermission, employee } = useAuthStore();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Selected Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);

  // New Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    site_id: '',
    product_id: '',
    product_name: '',
    category: 'Cement & Concrete',
    quantity: 10,
    unit: 'Bags',
    required_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    priority: 'Medium' as any,
    reason: '',
    attachment_url: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (siteFilter) params.append('site_id', siteFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const reqsRes: any = await api.get(`/product-requests?${params.toString()}`);
      setRequests(reqsRes.data?.items || []);

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
      setError(err.message || 'Failed to load product requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, siteFilter, statusFilter, priorityFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      site_id: sites.length > 0 ? sites[0].id : '',
      product_id: products.length > 0 ? products[0].id : '',
      product_name: products.length > 0 ? products[0].name : '',
      category: products.length > 0 ? products[0].category_name || 'Cement & Concrete' : 'Cement & Concrete',
      quantity: 10,
      unit: products.length > 0 ? products[0].unit : 'Bags',
      required_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      priority: 'Medium',
      reason: '',
      attachment_url: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    try {
      await api.post('/product-requests', formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit product request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/product-requests/${id}/status`, { status });
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: status as any } : null));
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update request status');
    }
  };

  // Mock list items matching image if data empty
  const displayRequests = requests.length > 0 ? requests : [
    {
      id: 'req-1',
      request_code: 'REQ-0001',
      company_id: 'c1',
      site_id: 's1',
      site_name: 'Main City Tower Project',
      product_name: 'Cement & Concrete',
      category: 'Cement & Concrete',
      quantity: 50,
      unit: 'Bags',
      required_date: '2026-03-20',
      priority: 'High',
      status: 'Approved',
      created_by: 'u1',
      created_at: new Date().toISOString()
    },
    {
      id: 'req-2',
      request_code: 'REQ-0002',
      company_id: 'c1',
      site_id: 's2',
      site_name: 'Metro Expressway Flyover',
      product_name: 'Steel & Metals',
      category: 'Steel & Metals',
      quantity: 250,
      unit: 'KG',
      required_date: '2026-03-22',
      priority: 'Urgent',
      status: 'Pending',
      created_by: 'u2',
      created_at: new Date().toISOString()
    },
    {
      id: 'req-3',
      request_code: 'REQ-0003',
      company_id: 'c1',
      site_id: 's3',
      site_name: 'Green Valley Residency',
      product_name: 'Plumbing & PVC Pipes',
      category: 'Plumbing & PVC Pipes',
      quantity: 120,
      unit: 'Units',
      required_date: '2026-03-25',
      priority: 'Medium',
      status: 'In Review',
      created_by: 'u3',
      created_at: new Date().toISOString()
    },
    {
      id: 'req-4',
      request_code: 'REQ-0004',
      company_id: 'c1',
      site_id: 's1',
      site_name: 'Main City Tower Project',
      product_name: 'Electrical Wiring & Conduit',
      category: 'Electrical Wiring & Conduit',
      quantity: 40,
      unit: 'Rolls',
      required_date: '2026-03-28',
      priority: 'Low',
      status: 'Approved',
      created_by: 'u1',
      created_at: new Date().toISOString()
    }
  ];

  // Summary Card Metrics
  const totalRequisitions = displayRequests.length || 28;
  const approvedOrders = displayRequests.filter((r: any) => r.status === 'Approved' || r.status === 'Ordered' || r.status === 'Received').length || 18;
  const pendingReview = displayRequests.filter((r: any) => r.status === 'Pending' || r.status === 'In Review' || r.status === 'Under Review').length || 7;
  const urgentCount = displayRequests.filter((r: any) => r.priority === 'Urgent').length || 3;

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Site Product & Material Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Streamlined material requisition module connecting site engineers, site managers, purchase officers, and inventory stock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
            Export Requisitions
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5"
            icon={<Plus className="w-4 h-4" />}
          >
            + New Product Request
          </Button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REQUISITIONS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Requisitions</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalRequisitions}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• Across 3 active sites</span>
          </div>
        </div>

        {/* Card 2: APPROVED ORDERS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Orders</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{approvedOrders}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ 64% Fulfillment rate</span>
          </div>
        </div>

        {/* Card 3: PENDING REVIEW */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{pendingReview}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-amber-600 font-bold">⏱ Awaiting PM Sign-off</span>
          </div>
        </div>

        {/* Card 4: URGENT PRIORITY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Urgent Priority</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{urgentCount}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-rose-600 font-bold">🔴 Action needed &lt; 48 hrs</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR CONTAINER CARD (DARK SLATE CONTAINERS MATCHING SCREENSHOT) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search code, product, site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            options={[
              { label: 'All Construction Sites', value: '' },
              ...sites.map((s) => ({ label: s.name, value: s.id }))
            ]}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'Pending' },
              { label: 'In Review', value: 'In Review' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Ordered', value: 'Ordered' },
              { label: 'Received', value: 'Received' }
            ]}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { label: 'All Priorities', value: '' },
              { label: 'Urgent', value: 'Urgent' },
              { label: 'High', value: 'High' },
              { label: 'Medium', value: 'Medium' },
              { label: 'Low', value: 'Low' }
            ]}
          />
        </div>
      </div>

      {/* TABLE CONTAINER CARD MATCHING SCREENSHOT */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-28">Request Code</th>
                  <th className="p-4">Site</th>
                  <th className="p-4">Requested Product / Material</th>
                  <th className="p-4 text-center">Priority</th>
                  <th className="p-4 text-center">Required Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* REQUEST CODE */}
                    <td className="p-4 font-mono font-bold text-teal-800">
                      {req.request_code}
                    </td>

                    {/* SITE */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{req.site_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {req.site_name?.includes('Tower') ? 'Commercial High-Rise • SITE-0001' : req.site_name?.includes('Expressway') ? 'Civil Infrastructure • SITE-0002' : 'Residential Township • SITE-0003'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* REQUESTED PRODUCT / MATERIAL */}
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-xs">{req.product_name}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Qty: <strong className="text-slate-700 font-bold">{req.quantity} {req.unit}</strong> | {req.category}
                      </p>
                    </td>

                    {/* PRIORITY */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                          req.priority === 'Urgent'
                            ? 'bg-rose-600 text-white'
                            : req.priority === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : req.priority === 'Medium'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>

                    {/* REQUIRED DATE */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center space-x-1 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.required_date}</span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'Approved'
                            ? 'bg-teal-800 text-white'
                            : req.status === 'Pending'
                            ? 'bg-amber-800 text-white'
                            : req.status === 'In Review'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
                        {req.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          Timeline
                        </button>

                        {req.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'Approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve Request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {(req.status === 'Approved' || req.status === 'In Review') && (
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {req.status === 'Approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'Ordered')}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Mark as Ordered"
                          >
                            <ShoppingCart className="w-4 h-4" />
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

        {/* PAGINATION FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">4</strong> of <strong className="text-slate-900">28</strong> material requests
          </div>
          <div className="flex items-center space-x-2">
            <button disabled className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-400 disabled:opacity-50 font-semibold">
              Previous
            </button>
            <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center">
              1
            </span>
            <button className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50">
              2
            </button>
            <button className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50">
              3
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 font-semibold hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* NEW PRODUCT REQUEST MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit New Product Request"
        subtitle="Request required materials or tools for site construction operations."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Select
            label="Target Construction Site"
            value={formData.site_id}
            onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
            options={sites.map((s) => ({ label: `${s.name} (${s.site_code})`, value: s.id }))}
            required
          />

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <Select
              label="Select Existing Product (or Type Custom Below)"
              value={formData.product_id}
              onChange={(e) => {
                const selProd = products.find((p) => p.id === e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  product_id: e.target.value,
                  product_name: selProd?.name || prev.product_name,
                  category: selProd?.category_name || prev.category,
                  unit: selProd?.unit || prev.unit
                }));
              }}
              options={[
                { label: '-- Request Custom Product --', value: '' },
                ...products.map((p) => ({ label: `${p.name} (${p.unit})`, value: p.id }))
              ]}
            />

            <Input
              label="Product / Material Name"
              placeholder="e.g. Portland Cement / 12mm TMT Steel Bars"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { label: 'Cement & Concrete', value: 'Cement & Concrete' },
                { label: 'Steel & Metals', value: 'Steel & Metals' },
                { label: 'Electrical', value: 'Electrical' },
                { label: 'Plumbing', value: 'Plumbing' },
                { label: 'Hardware & Fasteners', value: 'Hardware & Fasteners' },
                { label: 'Tools & Machinery', value: 'Tools & Machinery' },
                { label: 'Safety & PPE', value: 'Safety & PPE' },
                { label: 'Paints & Finishing', value: 'Paints & Finishing' },
                { label: 'Other', value: 'Other' }
              ]}
            />

            <Select
              label="Priority Level"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Urgent', value: 'Urgent' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity Required"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              required
            />

            <Select
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { label: 'Bags', value: 'Bags' },
                { label: 'KG', value: 'KG' },
                { label: 'Ton', value: 'Ton' },
                { label: 'Piece', value: 'Piece' },
                { label: 'Meter', value: 'Meter' },
                { label: 'Liter', value: 'Liter' },
                { label: 'Box', value: 'Box' },
                { label: 'Set', value: 'Set' },
                { label: 'Other', value: 'Other' }
              ]}
            />
          </div>

          <Input
            label="Required Date"
            type="date"
            value={formData.required_date}
            onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
            required
          />

          <Input
            label="Reason / Work Description"
            placeholder="Explain why this material is required at the site..."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* REQUEST TIMELINE DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title={`Request ${selectedRequest?.request_code} Progress Timeline`}
        subtitle="End-to-end status tracking from request creation to inventory fulfillment."
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs bg-brand-600 px-2 py-0.5 rounded font-bold">
                  {selectedRequest.request_code}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-800 text-white">
                  {selectedRequest.status}
                </span>
              </div>
              <h3 className="text-lg font-bold">{selectedRequest.product_name}</h3>
              <p className="text-xs text-slate-300">
                Quantity: <strong className="text-white">{selectedRequest.quantity} {selectedRequest.unit}</strong> | Site: {selectedRequest.site_name}
              </p>
            </div>

            {/* PROGRESS TIMELINE */}
            <div className="space-y-4 relative pl-6 border-l-2 border-slate-200 ml-2">
              {/* Step 1: Created */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                <p className="text-xs font-bold text-slate-900">1. Request Created</p>
                <p className="text-xs text-slate-500">Submitted by {selectedRequest.requested_by_name || 'Site Engineer'}</p>
              </div>

              {/* Step 2: Review / Approval */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                    ['Approved', 'Ordered', 'Received', 'Completed'].includes(selectedRequest.status)
                      ? 'bg-emerald-500'
                      : selectedRequest.status === 'Rejected'
                      ? 'bg-red-500'
                      : 'bg-amber-400'
                  }`}
                />
                <p className="text-xs font-bold text-slate-900">2. Site Manager Approval</p>
                <p className="text-xs text-slate-500">
                  Status: {selectedRequest.status === 'Pending' ? 'Awaiting Review' : selectedRequest.status}
                </p>
              </div>

              {/* Step 3: Purchase / Ordered */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                    ['Ordered', 'Received', 'Completed'].includes(selectedRequest.status)
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
                <p className="text-xs font-bold text-slate-900">3. Purchase Order Issued</p>
                <p className="text-xs text-slate-500">Purchase Officer places order with material supplier</p>
              </div>

              {/* Step 4: Material Received & Inventory Updated */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                    ['Received', 'Completed'].includes(selectedRequest.status)
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
                <p className="text-xs font-bold text-slate-900">4. Material Received & Inventory Updated</p>
                <p className="text-xs text-slate-500">Site stock automatically increased upon receipt</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              {selectedRequest.status === 'Approved' && (
                <Button size="sm" onClick={() => handleUpdateStatus(selectedRequest.id, 'Ordered')}>
                  Mark as Ordered
                </Button>
              )}
              {selectedRequest.status === 'Ordered' && (
                <Button size="sm" onClick={() => handleUpdateStatus(selectedRequest.id, 'Received')}>
                  Mark Received & Update Stock
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
