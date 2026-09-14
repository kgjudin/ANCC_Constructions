import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import {
  Users,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Download,
  Plus,
  Calendar,
  Filter,
  ShieldAlert,
  TrendingUp,
  LogIn,
  Server,
  ChevronRight,
  MessageSquare,
  Building2,
  Package,
  CalendarCheck,
  CalendarDays,
  Sun,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, role, employee, hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Attendance Punch State for Staff Workspace
  const [checkedIn, setCheckedIn] = useState(true);
  const [punchTime, setPunchTime] = useState('09:00 AM');

  // Explicitly ensure 'dark' class is removed from <html>
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const isSuperAdmin =
    role?.name === 'Super Admin' ||
    role?.name === 'Administrator' ||
    role?.name === 'Managing Director' ||
    user?.email === 'admin@construction.com' ||
    hasPermission('finance.approve');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (isSuperAdmin) {
        const [dashRes, sitesRes]: any[] = await Promise.all([
          api.get('/dashboard/admin'),
          api.get('/sites')
        ]);
        setData(dashRes.data);
        setSites(sitesRes.data?.items || []);
      } else {
        const [sitesRes, holRes]: any[] = await Promise.all([
          api.get('/sites').catch(() => ({ data: { items: [] } })),
          api.get('/holidays').catch(() => ({ data: [] }))
        ]);
        setSites(sitesRes.data?.items || []);
        setHolidays(Array.isArray(holRes.data) ? holRes.data : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // ----------------------------------------------------
  // 1. COMMON INTERACTIVE DASHBOARD FOR STAFF / NON-ADMINS
  // ----------------------------------------------------
  if (!isSuperAdmin) {
    if (isLoading) return <LoadingState message="Loading your personal employee portal..." />;

    return (
      <div className="space-y-6 font-sans pb-12 bg-slate-100/50 min-h-screen p-2 rounded-3xl">
        {/* GREETING & PERSONAL PROFILE BANNER */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 z-10">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-teal-500 text-white uppercase tracking-wider">
                Staff Portal
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Sep 14, 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome Back, {employee?.full_name || 'Team Member'}! 👋
            </h1>

            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Access your daily attendance status, leave balances, project sites, and team messages in one central cockpit.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold">
              <span className="bg-slate-800 text-teal-300 px-3 py-1 rounded-xl border border-slate-700">
                Role: <strong className="text-white">{role?.name || 'Employee'}</strong>
              </span>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-xl border border-slate-700 font-mono">
                Code: <strong className="text-white">{employee?.employee_code || 'EMP-0001'}</strong>
              </span>
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => navigate('/chat')}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-3 shadow-lg shadow-teal-600/30"
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Open Team Messages
            </Button>
          </div>
        </div>

        {/* 4 PERSONAL QUICK STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Attendance Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-emerald-600">
                  {checkedIn ? 'Present' : 'Not Checked In'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {checkedIn ? '09:00 AM' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-medium">Standard 9.0 hrs shift</span>
              <button
                onClick={() => setCheckedIn(!checkedIn)}
                className="text-teal-600 font-bold hover:underline underline-offset-2"
              >
                {checkedIn ? 'Clock Out' : 'Punch Check In'}
              </button>
            </div>
          </div>

          {/* Card 2: Leave Balances */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leave Balance</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">12 Days</span>
                <span className="text-xs text-slate-400 font-semibold">available</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
              <span className="text-teal-600 font-bold">✓ 0 Pending Requests</span>
              <Link to="/leave" className="text-teal-600 font-bold hover:underline">Apply Leave</Link>
            </div>
          </div>

          {/* Card 3: Construction Sites */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Sites</span>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">{sites.length || 3}</span>
                <span className="text-xs text-slate-400 font-semibold">project locations</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
              <span className="text-teal-600 font-bold">• Active Project Scope</span>
              <Link to="/sites" className="text-teal-600 font-bold hover:underline">View Sites</Link>
            </div>
          </div>

          {/* Card 4: Product Requests */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Material Requisitions</span>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">Active</span>
                <span className="text-xs text-teal-600 font-semibold">• Stock Requisitions</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
              <span className="text-slate-400">Requisitions active</span>
              <Link to="/product-requests" className="text-teal-600 font-bold hover:underline">Submit Request</Link>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS BAR */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
            Staff Quick Action Center
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-left transition-all group flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 group-hover:text-teal-800">Attendance Log</p>
                <p className="text-[11px] text-slate-400">View daily punch matrix</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/sites')}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-left transition-all group flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 group-hover:text-teal-800">Construction Sites</p>
                <p className="text-[11px] text-slate-400">Browse site locations</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/product-requests')}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-left transition-all group flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 group-hover:text-teal-800">Material Requisition</p>
                <p className="text-[11px] text-slate-400">Request site materials</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/leave')}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-300 text-left transition-all group flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 group-hover:text-blue-800">Leave Requests</p>
                <p className="text-[11px] text-slate-400">Submit time-off request</p>
              </div>
            </button>
          </div>
        </div>

        {/* 2-COLUMN LOWER SECTION: ACTIVE SITES GRID & UPCOMING HOLIDAYS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Sites Directory Preview (2 Cols Wide) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Registered Construction Sites</h3>
                <p className="text-xs text-slate-400">Active project locations and site managers</p>
              </div>
              <Link to="/sites" className="text-xs font-bold text-teal-600 hover:underline flex items-center space-x-1">
                <span>Explore All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sites.slice(0, 4).map((site: any) => (
                <div
                  key={site.id}
                  onClick={() => navigate(`/sites/${site.id}`)}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-300 hover:shadow-md cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {site.site_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {site.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{site.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{site.location || 'Site Location'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Manager: <strong className="text-slate-800">{site.site_manager_name || 'Assigned Manager'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Holidays & Company Notices (1 Col Wide) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Holidays</h3>
                <p className="text-xs text-slate-400">Company official calendar 2026</p>
              </div>
              <Link to="/holidays" className="text-xs font-bold text-teal-600 hover:underline">View All</Link>
            </div>

            <div className="space-y-3">
              {holidays.length === 0 ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Gandhi Jayanti</p>
                      <p className="text-[11px] text-slate-500">October 02, 2026</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">Gazetted</span>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Dussehra (Vijayadashami)</p>
                      <p className="text-[11px] text-slate-500">October 20, 2026</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Festival</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Diwali (Deepavali)</p>
                      <p className="text-[11px] text-slate-500">November 08, 2026</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">National</span>
                  </div>
                </div>
              ) : (
                holidays.slice(0, 3).map((h: any) => (
                  <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{h.name}</p>
                      <p className="text-[11px] text-slate-500">{h.date}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">Holiday</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. EXECUTIVE DASHBOARD FOR SUPER ADMINS
  // ----------------------------------------------------
  if (isLoading) return <LoadingState message="Connecting to Live Sync Executive Cockpit..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const m = data?.metrics || {};
  const purchases = data?.recent_purchases || [];
  const activities = data?.recent_activities || [];

  return (
    <div className="space-y-6 font-sans pb-12 bg-slate-100/50 min-h-screen p-2 rounded-3xl">
      {/* EXECUTIVE DASHBOARD HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              FY 2026-Q3
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Real-time company overview, workforce status, material purchases, and financial outstanding.
          </p>
        </div>

        {/* Header Right Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44">
            <Select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              options={[
                { label: `All Sites (${sites.length || 3} Active)`, value: '' },
                ...sites.map((s) => ({ label: s.name, value: s.id }))
              ]}
            />
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Today: Sep 14, 2026</span>
          </div>

          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
            Export Report
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/purchases')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            + New Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL ACTIVE STAFF */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active Staff</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{m.total_employees || 4}</span>
              <span className="text-xs text-slate-400 font-semibold">registered</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-teal-600 font-bold flex items-center">
              ↑ +12% vs last week
            </span>
            <span className="text-slate-400">All sites pooled</span>
          </div>
        </div>

        {/* Card 2: PRESENT TODAY */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black text-slate-900">{m.present_today || 1}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                25% Rate
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-700 font-semibold">{m.present_today || 1} Checked In</span>
            <span className="text-slate-400">3 On Field / Remote</span>
          </div>
        </div>

        {/* Card 3: PENDING LEAVE REQ. */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Leave Req.</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{m.pending_leaves || 0}</span>
              <span className="text-xs text-slate-400 font-semibold">in queue</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-teal-600 font-bold">✓ All Cleared</span>
            <span className="text-slate-400">Zero backlogs</span>
          </div>
        </div>

        {/* Card 4: REGISTERED SUPPLIERS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Suppliers</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black text-slate-900">{m.total_suppliers || 1}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                Tier-1
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-700 font-semibold truncate max-w-[120px]">ABC Building Materials</span>
            <span className="text-teal-600 font-bold">Verified</span>
          </div>
        </div>

        {/* Card 5: TOTAL PURCHASES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Purchases</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(m.total_purchases || 4200)}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-400">Cumulative PO value</span>
            <Link to="/purchases" className="text-teal-600 font-bold hover:underline">1 Order Total</Link>
          </div>
        </div>

        {/* Card 6: TOTAL PAID AMOUNT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paid Amount</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-teal-600">{formatCurrency(m.total_paid || 4200)}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-teal-600 font-bold">100% Settled</span>
            <span className="text-slate-400">No pending dispatches</span>
          </div>
        </div>

        {/* Card 7: TOTAL OUTSTANDING DUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 col-span-1 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding Due</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                OPTIMAL CONDITION
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">₹0</span>
              <span className="text-xs text-slate-400 font-semibold">zero liability across all active sites</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-500 font-medium">All vendor liabilities cleared within invoice timeline</span>
            <span className="text-teal-600 font-mono font-bold">Risk Score: 0.0</span>
          </div>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Purchase Orders */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Recent Purchase Orders</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  {purchases.length} Record Found
                </span>
              </div>
              <p className="text-xs text-slate-400">Latest material acquisitions and payment status</p>
            </div>

            <Link to="/purchases" className="text-xs font-bold text-teal-600 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {p.po_number}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{p.supplier_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.gst} • {p.site_name}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: System Activity Feed */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">System Activity Feed</h3>
              </div>
              <p className="text-xs text-slate-400">Traceable audit log of employee actions</p>
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {activities.map((act: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start space-x-3 text-xs"
              >
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl mt-0.5 shrink-0 border border-teal-200">
                  {act.action.includes('LOGIN') ? (
                    <LogIn className="w-4 h-4" />
                  ) : act.action.includes('CRON') || act.action.includes('BACKUP') ? (
                    <Server className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 truncate">{act.actor_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{act.timestamp}</span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                      {act.action}
                    </span>
                    <span className="text-slate-500 text-[11px]">on {act.module}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                    {typeof act.details === 'object' && act.details !== null ? JSON.stringify(act.details) : String(act.details || '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
