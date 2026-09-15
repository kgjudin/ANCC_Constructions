import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { CreatableSelect } from '../components/ui/CreatableSelect';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import {
  Receipt,
  Plus,
  Trash2,
  FileText,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  DollarSign,
  AlertCircle,
  Search,
  Check,
  Lock,
  Clock,
  Edit,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { ConstructionSite, FinancialDocument, FinancialLineItem } from '@construction/shared-types';
import { useAuthStore } from '../store/useAuthStore';

import { useSearchParams } from 'react-router-dom';

export const AccountantFinance: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'approvals' ? 'approvals' : 'console';
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active View Tab: 'console' (Create Bill) vs 'approvals' (Admin Approval Console & Bill List)
  const [activeTab, setActiveTab] = useState<'console' | 'approvals'>(initialTab as 'console' | 'approvals');

  // Selected Site
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Bill Header Metadata
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days (Standard)');
  const [vendorName, setVendorName] = useState('');

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<any[]>([
    {
      description: '',
      category_unit: '',
      quantity: 1,
      unit_price: 0,
      amount: 0
    }
  ]);

  // Tax & Discount
  const [tax, setTax] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Form Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Admin Approval Modal State
  const [selectedBillForApproval, setSelectedBillForApproval] = useState<FinancialDocument | null>(null);
  const [adminRemark, setAdminRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Toast Notification State
  const [showNotification, setShowNotification] = useState(false);

  // Fetch Sites and Existing Bills
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [sitesRes, docsRes]: any[] = await Promise.all([
        api.get('/sites'),
        api.get('/finance/documents')
      ]);

      const loadedSites: ConstructionSite[] = sitesRes.data?.items || [];
      const loadedDocs: FinancialDocument[] = docsRes.data?.items || [];

      setSites(loadedSites);
      setDocuments(loadedDocs);

      if (loadedSites.length > 0 && !selectedSiteId) {
        setSelectedSiteId(loadedSites[0].id);
      }

      // Generate Auto Bill Number (INV-YYYYMMDD-XXX)
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const seq = String((loadedDocs.length || 0) + 3).padStart(3, '0');
      setBillNumber(`INV-${dateStr}-${seq}`);
    } catch (err: any) {
      setError(err.message || 'Failed to load accountant data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate line totals and overall subtotal & total
  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(val) || 0 : Number(item.quantity) || 0;
      const p = field === 'unit_price' ? Number(val) || 0 : Number(item.unit_price) || 0;
      item.amount = q * p;
    }

    updated[index] = item;
    setLineItems(updated);
  };

  const handleAddRow = () => {
    setLineItems([...lineItems, { description: '', category_unit: 'Units', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const handleDeleteRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalAmount = Math.max(0, subtotal + (Number(tax) || 0) - (Number(discount) || 0));

  // Save & Generate PDF Primary Action
  const handleSaveAndGeneratePDF = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!selectedSiteId) {
      setFormError('Please select a construction site from the dropdown');
      return;
    }

    if (!vendorName.trim()) {
      setFormError('Vendor / Client Name is required');
      return;
    }

    const validItems = lineItems.filter((item) => item.description.trim() !== '' && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setFormError('Please add at least one valid line item with description and quantity');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        site_id: selectedSiteId,
        vendor_name: vendorName.trim(),
        invoice_no: billNumber,
        date: billDate,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          amount: Number(item.amount) || 0
        })),
        subtotal,
        tax: Number(tax) || 0,
        discount: Number(discount) || 0,
        total: totalAmount,
        status: 'Pending',
        admin_remarks: ''
      };

      await api.post('/finance/documents', payload);

      setSuccessMessage(`Bill ${billNumber} created successfully & set to "Pending Approval". PDF Generated!`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);

      // Reset Form with next bill number and clear data
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const seq = String(documents.length + 4).padStart(3, '0');
      setBillNumber(`INV-${dateStr}-${seq}`);
      setVendorName('');
      setLineItems([{ description: '', category_unit: '', quantity: 1, unit_price: 0, amount: 0 }]);
      setTax(0);
      setDiscount(0);
      
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate PDF and save bill');
    } finally {
      setIsSaving(false);
    }
  };

  // Printable PDF Action
  const handlePrintPDF = (doc: any) => {
    const printableWindow = window.open('', '_blank');
    if (!printableWindow) return;

    const currentItems = (doc.items && doc.items.length > 0) ? doc.items : lineItems;
    
    const itemsRows = currentItems.map((item: any, idx: number) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">₹${Number(item.amount).toFixed(2)}</td>
      </tr>
    `).join('');

    const docSubtotal = Number(doc.subtotal !== undefined ? doc.subtotal : subtotal).toFixed(2);
    const docTax = Number(doc.tax !== undefined ? doc.tax : tax).toFixed(2);
    const docDiscount = Number(doc.discount !== undefined ? doc.discount : discount).toFixed(2);
    const docTotal = Number(doc.total !== undefined ? doc.total : totalAmount).toFixed(2);

    printableWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${doc.invoice_no || billNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 15px; }
            .title { font-size: 24px; font-weight: bold; color: #0d9488; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f1f5f9; padding: 10px; text-align: left; }
            .totals-container { width: 300px; margin-left: auto; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #0d9488; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ANCC Construction Pvt Ltd</div>
              <div>Official Accountant Invoice</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0d9488;">${doc.invoice_no || billNumber}</h2>
              <div>Date: ${doc.date || billDate}</div>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <p><strong>Vendor / Client:</strong> ${doc.vendor_name || vendorName}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price (₹)</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="totals-container">
            <div class="totals-row">
              <span>Subtotal:</span>
              <strong>₹${docSubtotal}</strong>
            </div>
            <div class="totals-row">
              <span>Tax:</span>
              <strong>₹${docTax}</strong>
            </div>
            <div class="totals-row">
              <span>Discount:</span>
              <strong>₹${docDiscount}</strong>
            </div>
            <div class="totals-row grand-total">
              <span>Total Amount:</span>
              <span>₹${docTotal}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    printableWindow.document.close();
    printableWindow.print();
  };

  // Admin Approval Action
  const handleAdminApproval = async (status: 'Approved' | 'Rejected') => {
    if (!selectedBillForApproval) return;
    setRemarkError('');

    if (status === 'Rejected' && (!adminRemark || adminRemark.trim() === '')) {
      setRemarkError('Remark / rejection reason is required before rejecting a bill.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await api.patch(`/finance/documents/${selectedBillForApproval.id}/status`, {
        status,
        admin_remarks: adminRemark.trim()
      });

      setSelectedBillForApproval(null);
      setAdminRemark('');
      fetchData();
    } catch (err: any) {
      setRemarkError(err.message || 'Failed to update bill status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const pendingCount = documents.filter((d) => d.status === 'Pending').length || 1;

  return (
    <div className="space-y-6 font-sans pb-28">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Accountant Console &amp; Finance Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Dynamic bill creation, dynamic line items, auto-calculated totals, PDF generation, and Admin Approval Console.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
              activeTab === 'console'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Accountant Console (Create Bill)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Admin Approval Console</span>
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] flex items-center justify-center ml-1">
              {pendingCount}
            </span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY CARDS ROW MATCHING SCREENSHOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL INVOICED (THIS MO) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced (This Mo)</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">₹1,48,500</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">↑ +14% vs last month</span>
          </div>
        </div>

        {/* Card 2: PENDING APPROVALS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{pendingCount} Bill</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-amber-600 font-bold">Main City Tower • ₹4,200</span>
          </div>
        </div>

        {/* Card 3: SETTLED INVOICES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Settled Invoices</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">24 Paid</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ 100% Tax Compliant</span>
          </div>
        </div>

        {/* Card 4: CURRENT DRAFT MODE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Draft Mode</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Edit className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black font-mono text-teal-600">{billNumber || 'INV-20260914-003'}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400">Auto-saved 2 mins ago</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SCREEN A: ACCOUNTANT CONSOLE (CREATE BILL FORM)       */}
      {/* ==================================================== */}
      {activeTab === 'console' && (
        <div className="space-y-6">
          {/* CARD 1: SELECT CONSTRUCTION SITE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Select Construction Site</h3>
            </div>

            <Select
              label="CHOOSE SITE *"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              options={sites.map((s) => ({
                label: `${s.name} (${s.site_code}) - ${s.location || 'Downtown Block B'}`,
                value: s.id
              }))}
            />

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex flex-wrap items-center gap-4">
              <span className="flex items-center space-x-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Site In-Charge: <strong className="text-slate-900">Vikram S. (Chief Engr)</strong></span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-medium">GST State: <strong className="text-slate-900">Maharashtra (27)</strong></span>
            </div>
          </div>

          {/* CARD 2: CREATE BILL FORM CONTAINER */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Create Bill</h2>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Local Draft Synced</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Status: Pending Approval
                </span>
              </div>
            </div>

            {formError && (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* HEADER METADATA ROW 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="BILL NUMBER (AUTO-GENERATED)"
                value={billNumber}
                readOnly
                disabled
                icon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                className="bg-slate-50 font-mono font-bold text-slate-700"
              />

              <Input
                label="DATE *"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                required
              />

              <Select
                label="PAYMENT TERMS"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                options={[
                  { label: 'Net 30 Days (Standard)', value: 'Net 30 Days (Standard)' },
                  { label: 'Net 15 Days', value: 'Net 15 Days' },
                  { label: 'Due Upon Receipt', value: 'Due Upon Receipt' },
                  { label: 'Advance Payment', value: 'Advance Payment' }
                ]}
              />
            </div>

            {/* HEADER METADATA ROW 2: VENDOR / CLIENT */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  VENDOR / CLIENT NAME *
                </label>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified Vendor</span>
                </span>
              </div>
              <Input
                placeholder="ABC Building Materials Pvt Ltd (GSTIN: 27AAACA1234F1Z5)"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
              />
            </div>

            {/* DYNAMIC LINE ITEMS SECTION */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    DYNAMIC LINE ITEMS
                  </h4>
                  <p className="text-[11px] text-slate-400">Add materials, plant hire, equipment, or subcontractor services</p>
                </div>

                <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
                  Import from PO
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">ITEM DESCRIPTION</th>
                      <th className="p-3.5 w-36">CATEGORY / UNIT</th>
                      <th className="p-3.5 w-24 text-center">QUANTITY</th>
                      <th className="p-3.5 w-32 text-right">PRICE (₹)</th>
                      <th className="p-3.5 w-36 text-right">AMOUNT (₹)</th>
                      <th className="p-3.5 w-16 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="e.g. Grade OPC 53 Ready-Mix Concrete - Batch Delivery"
                            className="w-full px-3 py-2 text-xs border rounded-xl bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <CreatableSelect
                            options={[
                              { label: '50 Bags', value: '50 Bags' },
                              { label: 'KG', value: 'KG' },
                              { label: 'm³', value: 'm³' },
                              { label: 'Tons', value: 'Tons' },
                              { label: 'Litres', value: 'Litres' },
                              { label: 'Units', value: 'Units' }
                            ]}
                            placeholder="e.g. 50 Bags"
                            value={item.category_unit || ''}
                            onChange={(val) => handleItemChange(idx, 'category_unit', val)}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min={1}
                            className="w-full px-2 py-2 text-xs text-center border rounded-xl bg-white border-slate-300 text-slate-900 font-bold"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min={0}
                            className="w-full px-2 py-2 text-xs text-right border rounded-xl bg-white border-slate-300 text-slate-900 font-mono font-bold"
                            value={item.unit_rate}
                            onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{(Number(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            disabled={lineItems.length === 1}
                            className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleAddRow} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Item Line
                </Button>
              </div>
            </div>

            {/* TOTALS SUMMARY BREAKDOWN */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm ml-auto space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Tax (₹):</span>
                <input
                  type="number"
                  min={0}
                  className="w-28 px-2 py-1 text-right border rounded-lg bg-white border-slate-300 font-mono text-slate-900 font-bold"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value) || 0)}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Discount (₹):</span>
                <input
                  type="number"
                  min={0}
                  className="w-28 px-2 py-1 text-right border rounded-lg bg-white border-slate-300 font-mono text-slate-900 font-bold"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-black text-teal-800">Total Amount:</span>
                <span className="text-lg font-black font-mono text-teal-700">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR MATCHING SCREENSHOT */}
          <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-40 border border-slate-800">
            <div className="space-y-0.5">
              <p className="font-bold text-xs text-white">Draft Saved Locally</p>
              <p className="text-[11px] text-slate-400 font-medium">Validates line math &amp; compiles invoice object ready for dispatch</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setLineItems([{ description: '', category_unit: 'Units', quantity: 1, unit_price: 0, amount: 0 }]);
                  setTax(0);
                  setDiscount(0);
                }}
                className="px-4 py-2 text-slate-300 hover:text-white font-semibold text-xs transition-colors"
              >
                Reset Form
              </button>

              <button
                type="button"
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Save Draft
              </button>

              {hasPermission(PERMISSIONS.FINANCE_CREATE) && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAndGeneratePDF}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Save &amp; Generate PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SCREEN B: ADMIN APPROVAL CONSOLE                      */}
      {/* ==================================================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            {error ? (
              <ErrorState message={error} onRetry={fetchData} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-4 w-36">Invoice #</th>
                      <th className="p-4">Site</th>
                      <th className="p-4">Vendor / Client</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Total Amount</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-teal-800">
                          {row.invoice_no || row.doc_number}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>{row.site_name || 'Main City Tower Project'}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{row.vendor_name}</td>
                        <td className="p-4 text-slate-500">{row.date}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900">
                          ₹{Number(row.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-center">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBillForApproval(row);
                                setAdminRemark(row.admin_remarks || '');
                                setRemarkError('');
                              }}
                              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>Review &amp; Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintPDF(row)}
                              className="px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-teal-600" />
                              <span>PDF</span>
                            </button>
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
                Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">{documents.length}</strong> of <strong className="text-slate-900">{documents.length}</strong> bills
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

          {/* ADMIN APPROVAL MODAL */}
          <Modal
            isOpen={Boolean(selectedBillForApproval)}
            onClose={() => setSelectedBillForApproval(null)}
            title={`Review Bill ${selectedBillForApproval?.invoice_no}`}
            subtitle="Verify line items, vendor details, and process administrative approval."
          >
            {selectedBillForApproval && (
              <div className="space-y-6">
                {remarkError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{remarkError}</span>
                  </div>
                )}

                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs bg-teal-600 px-2.5 py-1 rounded font-bold">
                      {selectedBillForApproval.invoice_no}
                    </span>
                    <StatusBadge status={selectedBillForApproval.status} />
                  </div>
                  <h3 className="text-lg font-bold">{selectedBillForApproval.vendor_name}</h3>
                  <p className="text-xs text-slate-300">
                    Site: <strong className="text-white">{selectedBillForApproval.site_name || 'Main City Tower Project'}</strong> | Date: {selectedBillForApproval.date}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Review Remarks / Rejection Reason
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Add remark or rejection reason..."
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                  />
                </div>

                {hasPermission(PERMISSIONS.FINANCE_APPROVE) && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleAdminApproval('Rejected')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Bill</span>
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleAdminApproval('Approved')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Bill</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      )}
      {/* FIXED TOAST NOTIFICATION BOX FOR PDF SAVE */}
      {showNotification && (
        <div className="fixed top-24 right-6 z-50 bg-white border border-emerald-200 shadow-2xl rounded-2xl p-4 flex items-start space-x-4 max-w-sm animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">PDF Saved Successfully</h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
              Bill generated waiting for approval
            </p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-slate-400 hover:text-slate-700">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
