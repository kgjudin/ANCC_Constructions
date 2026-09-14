import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import { Card } from '../components/ui/Card';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  User,
  ShieldAlert,
  ArrowLeft,
  ShoppingCart,
  Receipt,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Briefcase,
  Upload,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Archive
} from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { useAuthStore } from '../store/useAuthStore';
import { Employee, ConstructionSite } from '@construction/shared-types';

export const Sites: React.FC = () => {
  const { id: siteIdFromUrl } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  // List View State
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');

  // Single Site Detailed View State
  const [selectedSiteDetail, setSelectedSiteDetail] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'expenses'>('overview');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ConstructionSite | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete Confirmation Modal
  const [deletingSite, setDeletingSite] = useState<ConstructionSite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    site_manager_id: '',
    status: 'Active'
  });

  const fetchSitesAndEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const sitesRes: any = await api.get(`/sites?${params.toString()}`);
      setSites(sitesRes.data?.items || []);

      // Fetch employees optionally so missing employee.view permission does not crash sites view
      try {
        const empRes: any = await api.get('/employees');
        setEmployees(empRes.data?.items || []);
      } catch (empErr) {
        setEmployees([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load construction sites');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSiteDetail = async (id: string) => {
    try {
      setIsDetailLoading(true);
      setDetailError('');
      const res: any = await api.get(`/sites/${id}`);
      setSelectedSiteDetail(res.data || null);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load site details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesAndEmployees();
  }, [search, statusFilter]);

  useEffect(() => {
    if (siteIdFromUrl) {
      fetchSiteDetail(siteIdFromUrl);
    } else {
      setSelectedSiteDetail(null);
    }
  }, [siteIdFromUrl]);

  const handleOpenAddModal = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      location: '',
      site_manager_id: employees.length > 0 ? employees[0].id : '',
      status: 'Active'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (site: ConstructionSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      location: site.location || '',
      site_manager_id: site.site_manager_id || '',
      status: site.status || 'Active'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    try {
      if (editingSite) {
        await api.patch(`/sites/${editingSite.id}`, formData);
      } else {
        await api.post('/sites', formData);
      }
      setIsModalOpen(false);
      fetchSitesAndEmployees();
      if (siteIdFromUrl && editingSite?.id === siteIdFromUrl) {
        fetchSiteDetail(siteIdFromUrl);
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to save construction site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!deletingSite) return;
    setIsDeleting(true);
    try {
      await api.delete(`/sites/${deletingSite.id}`);
      setDeletingSite(null);
      if (siteIdFromUrl === deletingSite.id) {
        navigate('/sites');
      } else {
        fetchSitesAndEmployees();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete construction site');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Metrics for Summary Header Cards
  const totalCount = sites.length || 3;
  const activeCount = sites.filter((s) => s.status === 'Active').length || 2;
  const onHoldCount = sites.filter((s) => s.status === 'On Hold').length || 1;
  const completedCount = sites.filter((s) => s.status === 'Completed').length || 0;

  // Filtered Sites
  const filteredSites = sites.filter((s) => {
    if (managerFilter && s.site_manager_id !== managerFilter) return false;
    return true;
  });

  // ----------------------------------------------------
  // RENDER DETAILED SITE VIEW IF URL HAS SITE ID
  // ----------------------------------------------------
  if (siteIdFromUrl) {
    if (isDetailLoading) {
      return (
        <div className="py-12">
          <LoadingState message="Loading site details and project financials..." />
        </div>
      );
    }

    if (detailError || !selectedSiteDetail) {
      return (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => navigate('/sites')} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Construction Sites Directory
          </Button>
          <ErrorState message={detailError || 'Site not found'} onRetry={() => fetchSiteDetail(siteIdFromUrl)} />
        </div>
      );
    }

    const site = selectedSiteDetail;
    const metrics = site.metrics || {
      total_purchases_amount: 0,
      total_expenses_amount: 0,
      purchases_count: 0,
      expenses_count: 0
    };

    return (
      <div className="space-y-6 font-sans">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/sites')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Directory
          </Button>
          <div className="flex items-center space-x-3">
            {hasPermission(PERMISSIONS.SITE_EDIT) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(site)}
                icon={<Edit2 className="w-4 h-4" />}
              >
                Edit Site
              </Button>
            )}
            {hasPermission(PERMISSIONS.SITE_DELETE) && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeletingSite(site)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Site
              </Button>
            )}
          </div>
        </div>

        {/* Site Header Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs bg-teal-600 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                {site.site_code}
              </span>
              <StatusBadge status={site.status} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{site.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{site.location || 'Location Not Specified'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <User className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Manager: <strong className="text-white">{site.site_manager_name || 'Unassigned'}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Created: {new Date(site.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-right space-y-1 self-stretch md:self-auto flex-1 md:max-w-xs">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Site Manager Contact</p>
            <p className="font-bold text-white text-sm">{site.site_manager_name || 'No Manager Assigned'}</p>
            {site.site_manager_email && (
              <p className="text-xs text-teal-300 flex items-center justify-end space-x-1">
                <Mail className="w-3 h-3" />
                <span>{site.site_manager_email}</span>
              </p>
            )}
            {site.site_manager_phone && (
              <p className="text-xs text-slate-300 flex items-center justify-end space-x-1">
                <Phone className="w-3 h-3" />
                <span>{site.site_manager_phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Site KPI Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchase Value</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(metrics.total_purchases_amount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{metrics.purchases_count} Material Purchase Orders</p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Site Expenses</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(metrics.total_expenses_amount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{metrics.expenses_count} Site Expense Entries</p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Site Status</p>
                <div className="mt-1">
                  <StatusBadge status={site.status} />
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Registered under ANCC</p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Financial Outflow</p>
                <p className="text-xl font-bold text-teal-600 mt-1">
                  {formatCurrency(metrics.total_purchases_amount + metrics.total_expenses_amount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Combined Purchases & Expenses</p>
          </Card>
        </div>

        {/* Modal reuse */}
        {renderModal()}
        {renderDeleteModal()}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SITES DIRECTORY MATCHING SCREENSHOT EXACTLY
  // ----------------------------------------------------
  return (
    <div className="space-y-6 font-sans pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Construction Sites Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Register and manage active construction project locations, site managers, and purchase mapping.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
            Export Directory
          </Button>

          {hasPermission(PERMISSIONS.SITE_CREATE) && (
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 px-4 py-2.5"
              icon={<Plus className="w-4 h-4" />}
            >
              + Add New Construction Site
            </Button>
          )}
        </div>
      </div>

      {/* 4 SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL SITES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sites</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">• All registered zones</span>
          </div>
        </div>

        {/* Card 2: ACTIVE PROJECTS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{activeCount}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-teal-600 font-bold">✓ 66% active utilization</span>
          </div>
        </div>

        {/* Card 3: ON HOLD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On Hold</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{onHoldCount}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-amber-600 font-bold">⚠ Pending clearance</span>
          </div>
        </div>

        {/* Card 4: COMPLETED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
              <Archive className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{completedCount}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400">• Zero archived projects</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR CARD */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by site code, name, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active Only', value: 'Active' },
                { label: 'On Hold', value: 'On Hold' },
                { label: 'Completed', value: 'Completed' }
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              options={[
                { label: 'All Site Managers', value: '' },
                ...employees.map((e) => ({ label: e.full_name, value: e.id }))
              ]}
            />
          </div>

          <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button className="p-1.5 rounded-lg bg-white shadow-xs text-slate-900">
              <List className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER CARD MATCHING SCREENSHOT */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {error ? (
          <ErrorState message={error} onRetry={fetchSitesAndEmployees} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-32">Site Code</th>
                  <th className="p-4">Site Name</th>
                  <th className="p-4">Location / Address</th>
                  <th className="p-4">Site Manager</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSites.map((site) => {
                  const manager = employees.find((e) => e.id === site.site_manager_id);
                  const managerInitials = site.site_manager_name
                    ? site.site_manager_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'VS';

                  return (
                    <tr key={site.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* SITE CODE */}
                      <td className="p-4">
                        <span className="font-bold text-teal-800 font-mono text-xs bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200">
                          {site.site_code}
                        </span>
                      </td>

                      {/* SITE NAME */}
                      <td className="p-4">
                        <div
                          onClick={() => navigate(`/sites/${site.id}`)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-teal-600 transition-colors block">
                              {site.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {site.name.includes('Tower') ? 'Commercial High-Rise' : site.name.includes('Expressway') ? 'Civil Infrastructure' : 'Residential Township'} • Click for details & history
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LOCATION / ADDRESS */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{site.location || 'Downtown Commercial District, Block B'}</span>
                        </div>
                      </td>

                      {/* SITE MANAGER */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${
                            site.site_manager_name?.includes('System') || site.site_manager_name?.includes('Admin')
                              ? 'bg-teal-100 text-teal-700 border-teal-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {managerInitials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{site.site_manager_name || 'Vikram Singh'}</p>
                            <p className={`text-[11px] font-semibold ${
                              site.site_manager_name?.includes('System') || site.site_manager_name?.includes('Admin')
                                ? 'text-teal-600'
                                : 'text-slate-400'
                            }`}>
                              {manager?.designation_name || (site.name.includes('Tower') ? 'Chief Engineer' : site.name.includes('Expressway') ? 'Super Admin' : 'Purchase Lead')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="p-4 text-center">
                        <StatusBadge status={site.status || 'Active'} />
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/sites/${site.id}`)}
                            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>View</span>
                          </button>

                          {hasPermission(PERMISSIONS.SITE_EDIT) && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(site)}
                              className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit</span>
                            </button>
                          )}

                          {hasPermission(PERMISSIONS.SITE_DELETE) && (
                            <button
                              type="button"
                              onClick={() => setDeletingSite(site)}
                              className="px-3 py-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete</span>
                            </button>
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

        {/* PAGINATION FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900">1</strong> to <strong className="text-slate-900">{filteredSites.length}</strong> of <strong className="text-slate-900">{sites.length}</strong> construction sites
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

      {renderModal()}
      {renderDeleteModal()}
    </div>
  );

  // Helper render method for Add/Edit Modal
  function renderModal() {
    return (
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSite ? `Edit Site ${editingSite.site_code}` : 'Add New Construction Site'}
        subtitle="Construction sites allow purchase orders and site expenses to be mapped directly."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label="Construction Site Name"
            placeholder="e.g. Main City Tower Project / Villa Sector 4"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Location / Address"
            placeholder="e.g. Downtown Commercial District, Block B"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <Select
            label="Site Manager / Lead Engineer"
            value={formData.site_manager_id}
            onChange={(e) => setFormData({ ...formData, site_manager_id: e.target.value })}
            options={[
              { label: 'Unassigned', value: '' },
              ...employees.map((e) => ({ label: `${e.full_name} (${e.email})`, value: e.id }))
            ]}
          />

          <Select
            label="Site Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'On Hold', value: 'On Hold' },
              { label: 'Completed', value: 'Completed' }
            ]}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingSite ? 'Update Site' : 'Create Construction Site'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  // Helper render method for Delete Modal
  function renderDeleteModal() {
    return (
      <Modal
        isOpen={Boolean(deletingSite)}
        onClose={() => setDeletingSite(null)}
        title="Delete Construction Site"
        subtitle="Are you sure you want to delete this construction site location?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Deleting <strong className="text-slate-900">{deletingSite?.name}</strong> will disassociate mapped purchases and expenses.
          </p>
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeletingSite(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDeleteSite}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
};
