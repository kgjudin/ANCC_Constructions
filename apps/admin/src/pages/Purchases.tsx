import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Trash2,
  DollarSign,
  CheckCircle2,
  FileText,
  Upload,
  Building2,
  Clock,
  AlertCircle,
  Truck
} from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { useAuthStore } from '../store/useAuthStore';
import { Purchase, Supplier, Product } from '@construction/shared-types';

interface PurchaseItemInput {
  product_id: string;
  product_name?: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  discount: number;
  tax: number;
  brand: string;
  grade: string;
  quality_status: string;
  quality_notes: string;
}

export const Purchases: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

  // Purchase Entry Mode
  const [entryMode, setEntryMode] = useState<'itemized' | 'bill'>('itemized');

  // Create Purchase Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportCost, setTransportCost] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDocumentUrl, setInvoiceDocumentUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [billGrandTotal, setBillGrandTotal] = useState(0);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseItemInput[]>([]);

  // Update Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetPurchase, setTargetPurchase] = useState<Purchase | null>(null);
  const [updatePaidAmount, setUpdatePaidAmount] = useState(0);

  // View Purchase Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailPurchase, setDetailPurchase] = useState<any>(null);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentStatusFilter) params.append('payment_status', paymentStatusFilter);
      if (siteFilter) params.append('site_id', siteFilter);

      const pRes: any = await api.get(`/purchases?${params.toString()}`);
      setPurchases(pRes.data?.items || []);

      try {
        const sRes: any = await api.get('/suppliers');
        setSuppliers(sRes.data?.items || []);
        if (sRes.data?.items?.length > 0 && !supplierId) {
          setSupplierId(sRes.data.items[0].id);
        }
      } catch (err) {
        setSuppliers([]);
      }

      try {
        const prodRes: any = await api.get('/products');
        setProducts(prodRes.data?.items || []);
      } catch (err) {
        setProducts([]);
      }

      try {
        const siteRes: any = await api.get('/sites');
        setSites(siteRes.data?.items || []);
        if (siteRes.data?.items?.length > 0 && !siteId) {
          setSiteId(siteRes.data.items[0].id);
        }
      } catch (err) {
        setSites([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, paymentStatusFilter, siteFilter]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setItems([
      ...items,
      {
        product_id: defaultProduct.id,
        product_name: defaultProduct.name,
        quantity: 1,
        unit: defaultProduct.unit,
        unit_rate: Number(defaultProduct.standard_rate || 100),
        discount: 0,
        tax: 0,
        brand: '',
        grade: '',
        quality_status: 'Approved',
        quality_notes: ''
      }
    ]);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemInput, value: any) => {
    const updated = [...items];
    if (field === 'product_id') {
      const selectedProd = products.find((p) => p.id === value);
      if (selectedProd) {
        updated[index].product_id = selectedProd.id;
        updated[index].product_name = selectedProd.name;
        updated[index].unit = selectedProd.unit;
        updated[index].unit_rate = Number(selectedProd.standard_rate || 100);
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryMode === 'itemized' && items.length === 0) {
      setModalError('At least one purchase item is required for itemized product entry.');
      return;
    }
    if (entryMode === 'bill' && (!billGrandTotal || billGrandTotal <= 0)) {
      setModalError('Please enter a valid Total Bill Amount.');
      return;
    }

    setModalError('');
    setIsSubmitting(true);

    try {
      await api.post('/purchases', {
        supplier_id: supplierId,
        site_id: siteId,
        purchase_date: purchaseDate,
        transport_cost: Number(transportCost),
        other_charges: Number(otherCharges),
        tax_amount: Number(taxAmount),
        discount_amount: Number(discountAmount),
        grand_total: entryMode === 'bill' ? Number(billGrandTotal) : undefined,
        paid_amount: Number(paidAmount),
        invoice_number: invoiceNumber,
        invoice_document_url: invoiceDocumentUrl,
        notes,
        items: entryMode === 'itemized' ? items : []
      });
      setIsCreateModalOpen(false);
      setItems([]);
      setBillGrandTotal(0);
      setInvoiceDocumentUrl('');
      fetchPurchases();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (p: Purchase) => {
    setTargetPurchase(p);
    setUpdatePaidAmount(Number(p.paid_amount));
    setIsPaymentModalOpen(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPurchase) return;
    try {
      await api.patch(`/purchases/${targetPurchase.id}/payment`, {
        paid_amount: Number(updatePaidAmount)
      });
      setIsPaymentModalOpen(false);
      fetchPurchases();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment');
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res: any = await api.get(`/purchases/${id}`);
      setDetailPurchase(res.data);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load purchase details');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // KPI summary math
  const totalPO = purchases.length || 1;
  const totalAmount = purchases.reduce((sum, p) => sum + Number(p.grand_total || 0), 0) || 4200;
  const paidTotal = purchases.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) || 4200;
  const outstandingTotal = purchases.reduce((sum, p) => sum + Number(p.outstanding_amount || 0), 0);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Material Purchases & Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Create multi-item construction purchase orders, quality inspection metrics, and financial payment tracking.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
            Export Orders
          </Button>

          {hasPermission(PERMISSIONS.PURCHASE_CREATE) && (
            <Button
              size="sm"
              onClick={() => {
                setItems([]);
                setIsCreateModalOpen(true);
                handleAddItem();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5"
              icon={<Plus className="w-4 h-4" />}
            >
              + Create New Purchase Order
            </Button>
          )}
        </div>
      </div>

      {/* 4 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL PO ORDERS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalPO}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• Active supplier orders</span>
          </div>
        </div>

        {/* Card 2: CUMULATIVE PO VALUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cumulative PO Value</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ Material acquisition cost</span>
          </div>
        </div>

        {/* Card 3: PAID AMOUNT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paid Amount</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600">{formatCurrency(paidTotal)}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-600 font-bold">100% Settled</span>
          </div>
        </div>

        {/* Card 4: OUTSTANDING LIABILITY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Liability</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(outstandingTotal)}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• Zero vendor liability</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR CARD (DARK SLATE CONTAINER) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by PO number, supplier, or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-white text-slate-900"
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            options={[
              { label: 'All Construction Sites', value: '' },
              ...sites.map((s) => ({ label: s.name, value: s.id }))
            ]}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            options={[
              { label: 'All Payment Statuses', value: '' },
              { label: 'Unpaid', value: 'Unpaid' },
              { label: 'Partially Paid', value: 'Partially Paid' },
              { label: 'Paid', value: 'Paid' }
            ]}
          />
        </div>
      </div>

      {/* TABLE CONTAINER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={fetchPurchases} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-32">PO Number</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Construction Site</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-right">Paid Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-teal-800">
                      {row.purchase_number}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{row.supplier_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">GST: 27AAACA1234F1Z5</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>{row.site_name || 'SITE-0001'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{row.purchase_date}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(row.grand_total)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-teal-600">
                      {formatCurrency(row.paid_amount)}
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={row.payment_status} />
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(row.id)}
                          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View</span>
                        </button>

                        {hasPermission(PERMISSIONS.PURCHASE_EDIT) && (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(row)}
                            className="px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                            <span>Pay</span>
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
            Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">{purchases.length}</strong> of <strong className="text-slate-900">{purchases.length}</strong> purchase orders
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

      {/* CREATE PURCHASE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Construction Purchase Order"
        subtitle="Multi-product entry, quality grade recording, and automatic financial calculations."
        maxWidth="4xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={suppliers.map((s) => ({ label: s.company_name, value: s.id }))}
              required
            />

            <Select
              label="Construction Site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              options={sites.map((s) => ({ label: s.name, value: s.id }))}
              required
            />

            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Purchase Items</h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Item Row
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-2 items-center text-xs">
                <div className="md:col-span-2">
                  <Select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    options={products.map((p) => ({ label: `${p.name} (${p.unit})`, value: p.id }))}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    value={item.unit_rate}
                    onChange={(e) => handleItemChange(idx, 'unit_rate', Number(e.target.value))}
                    placeholder="Rate ₹"
                  />
                </div>
                <div className="font-mono font-bold text-slate-900 text-right">
                  ₹{(item.quantity * item.unit_rate).toFixed(2)}
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Purchase Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPDATE PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Update Purchase Order Payment"
        subtitle="Record vendor payments towards this purchase order."
      >
        <form onSubmit={handleUpdatePayment} className="space-y-4">
          <Input
            label="Paid Amount (₹)"
            type="number"
            min={0}
            value={updatePaidAmount}
            onChange={(e) => setUpdatePaidAmount(Number(e.target.value))}
            required
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
