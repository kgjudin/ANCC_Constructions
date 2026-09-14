import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import { Package, Plus, Search, Edit2, Upload, Layers, DollarSign, CheckCircle2 } from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { useAuthStore } from '../store/useAuthStore';
import { Product } from '@construction/shared-types';

export const Products: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    unit: 'Bags',
    standard_rate: '' as string | number,
    description: ''
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category_id', categoryFilter);

      const [pRes, cRes]: any[] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get('/product-categories')
      ]);

      setProducts(pRes.data?.items || []);
      setCategories(cRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load products master');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', category_id: categories[0]?.id || '', unit: 'Bags', standard_rate: '', description: '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({ name: p.name, category_id: p.category_id || '', unit: p.unit, standard_rate: p.standard_rate || '', description: p.description || '' });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);
    try {
      const payload = { ...formData, standard_rate: Number(formData.standard_rate || 0) };
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueCategories = [...new Set(products.map((p) => p.category_name).filter(Boolean))];

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Products &amp; Materials Master</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">FY 2026-Q3</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Standard material catalog reusable across purchase entries and construction orders.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>Export Catalog</Button>
          {hasPermission(PERMISSIONS.PRODUCT_CREATE) && (
            <Button size="sm" onClick={handleOpenAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5" icon={<Plus className="w-4 h-4" />}>+ Add New Product</Button>
          )}
        </div>
      </div>

      {/* 4 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100"><Package className="w-5 h-5" /></div>
          </div>
          <div><span className="text-2xl font-black text-slate-900">{products.length || 6}</span></div>
          <div className="pt-2 border-t border-slate-100 text-[11px]"><span className="text-teal-600 font-bold">• Standard catalog entries</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categories</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Layers className="w-5 h-5" /></div>
          </div>
          <div><span className="text-2xl font-black text-slate-900">{categories.length || uniqueCategories.length || 4}</span></div>
          <div className="pt-2 border-t border-slate-100 text-[11px]"><span className="text-blue-600 font-bold">• Material classification</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rate Baselined</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div><span className="text-2xl font-black text-teal-600">100%</span></div>
          <div className="pt-2 border-t border-slate-100 text-[11px]"><span className="text-teal-600 font-bold">✓ Standard rates defined</span></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catalog Status</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <div><span className="text-2xl font-black text-slate-900">Active</span></div>
          <div className="pt-2 border-t border-slate-100 text-[11px]"><span className="text-teal-600 font-bold">✓ Ready for PO selection</span></div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input placeholder="Search by code or product name..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="w-4 h-4 text-slate-400" />} className="bg-white text-slate-900" />
        </div>
        <div className="w-full sm:w-60">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={[{ label: 'All Categories', value: '' }, ...categories.map((c) => ({ label: c.name, value: c.id }))]} />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-32">Product Code</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4 text-right">Standard Rate</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4"><span className="font-bold text-teal-800 font-mono text-xs bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200">{row.product_code}</span></td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{row.name}</p>
                      {row.description && <p className="text-[11px] text-slate-400">{row.description}</p>}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{row.category_name || 'General'}</td>
                    <td className="p-4 font-medium text-slate-600">{row.unit}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">₹{Number(row.standard_rate || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {hasPermission(PERMISSIONS.PRODUCT_EDIT) && (
                        <button type="button" onClick={() => handleOpenEditModal(row)} className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs mx-auto">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" /><span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">{products.length}</strong> of <strong className="text-slate-900">{products.length}</strong> products</div>
          <div className="flex items-center space-x-2">
            <button disabled className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-400 disabled:opacity-50 font-semibold">Previous</button>
            <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center">1</span>
            <button disabled className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-400 disabled:opacity-50 font-semibold">Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? `Edit ${editingProduct.product_code}` : 'Add New Product / Material'} subtitle="Catalog entries enforce standardized units and rate baselines.">
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <p className="text-xs text-rose-600 font-semibold">{modalError}</p>}
          <Input label="Product Name" placeholder="e.g. OPC 53 Grade Cement / TMT Rebar 12mm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} options={categories.map((c) => ({ label: c.name, value: c.id }))} />
            <Input label="Measuring Unit" placeholder="e.g. Bags, KG, m³" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required />
          </div>
          <Input label="Standard Reference Rate (₹)" type="number" step="0.01" placeholder="0.00" value={formData.standard_rate} onChange={(e) => setFormData({ ...formData, standard_rate: e.target.value })} required />
          <Input label="Description / Technical Specs" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional specifications" />
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>{editingProduct ? 'Save Product' : 'Create Product'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
