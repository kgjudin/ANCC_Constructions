import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Sun,
  Package,
  Truck,
  ShoppingCart,
  Receipt,
  BarChart3,
  ShieldCheck,
  History,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCheck,
  MessageSquare,
  Boxes,
  Bell,
  Search,
  CheckCircle2
} from 'lucide-react';
import { PERMISSIONS } from '@construction/constants';
import { ConstructionSite } from '@construction/shared-types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  isSiteGroup?: boolean;
}

interface NavGroup {
  groupName: string;
  badge?: string;
  items: NavItem[];
}

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sitesExpanded, setSitesExpanded] = useState(true);
  const [sidebarSites, setSidebarSites] = useState<ConstructionSite[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('read_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const location = useLocation();
  const navigate = useNavigate();

  const { user, employee, role, logout, hasPermission } = useAuthStore();

  const fetchSidebarSites = async () => {
    try {
      if (hasPermission(PERMISSIONS.SITE_VIEW)) {
        const res: any = await api.get('/sites');
        setSidebarSites(res.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to load sidebar sites:', err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      if (hasPermission(PERMISSIONS.FINANCE_VIEW)) {
        const res: any = await api.get('/finance/documents');
        const docs = res.data?.items || [];
        setPendingApprovals(docs.filter((d: any) => d.status === 'Pending'));
      }
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    }
  };

  useEffect(() => {
    fetchSidebarSites();
    fetchPendingApprovals();
  }, [location.pathname]);

  const markAsRead = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!readNotifications.includes(docId)) {
      const updated = [...readNotifications, docId];
      setReadNotifications(updated);
      localStorage.setItem('read_notifications', JSON.stringify(updated));
    }
  };

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...new Set([...readNotifications, ...pendingApprovals.map((d) => d.id)])];
    setReadNotifications(updated);
    localStorage.setItem('read_notifications', JSON.stringify(updated));
  };

  const unreadCount = pendingApprovals.filter(doc => !readNotifications.includes(doc.id)).length;

  const navGroups: NavGroup[] = [
    {
      groupName: 'Main Console',
      items: [
        { name: 'Executive Cockpit', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: 'Team Chat', path: '/chat', icon: <MessageSquare className="w-4 h-4" />, permission: PERMISSIONS.CHAT_VIEW }
      ]
    },
    {
      groupName: 'Human Resources',
      badge: '4 Staff',
      items: [
        { name: 'Employees', path: '/employees', icon: <Users className="w-4 h-4" />, permission: PERMISSIONS.EMPLOYEE_VIEW },
        { name: 'Attendance', path: '/attendance', icon: <CalendarCheck className="w-4 h-4" />, permission: PERMISSIONS.ATTENDANCE_VIEW },
        { name: 'Leave Management', path: '/leave', icon: <CalendarDays className="w-4 h-4" />, permission: PERMISSIONS.LEAVE_VIEW },
        { name: 'Holidays', path: '/holidays', icon: <Sun className="w-4 h-4" />, permission: PERMISSIONS.HOLIDAY_VIEW }
      ]
    },
    {
      groupName: 'Construction Operations',
      badge: `${sidebarSites.length || 3} Sites`,
      items: [
        { name: 'Site Network', path: '/sites', icon: <Building2 className="w-4 h-4" />, permission: PERMISSIONS.SITE_VIEW, isSiteGroup: true },
        { name: 'Product Requests', path: '/product-requests', icon: <Package className="w-4 h-4" />, permission: PERMISSIONS.PRODUCT_REQUEST_VIEW },
        { name: 'Inventory Stock', path: '/inventory', icon: <Boxes className="w-4 h-4" />, permission: PERMISSIONS.INVENTORY_VIEW },
        { name: 'Products & Materials', path: '/products', icon: <Package className="w-4 h-4" />, permission: PERMISSIONS.PRODUCT_VIEW },
        { name: 'Suppliers Master', path: '/suppliers', icon: <Truck className="w-4 h-4" />, permission: PERMISSIONS.SUPPLIER_VIEW },
        { name: 'Purchases & Orders', path: '/purchases', icon: <ShoppingCart className="w-4 h-4" />, permission: PERMISSIONS.PURCHASE_VIEW },
        { name: 'Expenses & Billing', path: '/expenses', icon: <Receipt className="w-4 h-4" />, permission: PERMISSIONS.EXPENSE_VIEW }
      ]
    },
    {
      groupName: 'Finance & Accounting',
      items: [
        { name: 'Accountant Console', path: '/finance', icon: <Receipt className="w-4 h-4" />, permission: PERMISSIONS.FINANCE_VIEW }
      ]
    },
    {
      groupName: 'Analytics & Audits',
      items: [
        { name: 'Reports & Export', path: '/reports', icon: <BarChart3 className="w-4 h-4" />, permission: PERMISSIONS.REPORT_VIEW },
        { name: 'Audit Trail Logs', path: '/audit-logs', icon: <History className="w-4 h-4" />, permission: PERMISSIONS.AUDIT_LOG_VIEW }
      ]
    },
    {
      groupName: 'Administration',
      items: [
        { name: 'Roles & Permissions', path: '/roles', icon: <ShieldCheck className="w-4 h-4" />, permission: PERMISSIONS.ROLE_VIEW }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Cockpit';
    if (path.startsWith('/employees')) return 'Employees Directory';
    if (path.startsWith('/attendance')) return 'Attendance Matrix';
    if (path.startsWith('/leave')) return 'Leave Management';
    if (path.startsWith('/holidays')) return 'Company Holidays';
    if (path.startsWith('/sites')) return 'Site Network Operations';
    if (path.startsWith('/product-requests')) return 'Site Requisitions';
    if (path.startsWith('/inventory')) return 'Inventory Stock';
    if (path.startsWith('/products')) return 'Products Master';
    if (path.startsWith('/suppliers')) return 'Suppliers Master';
    if (path.startsWith('/purchases')) return 'Purchases & Orders';
    if (path.startsWith('/expenses')) return 'Expenses Ledger';
    if (path.startsWith('/finance')) return 'Accountant Console';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/roles')) return 'Roles & Permissions';
    if (path.startsWith('/audit-logs')) return 'Audit Logs';
    if (path.startsWith('/chat')) return 'Team Messaging';
    return 'Management Console';
  };

  return (
    <div className="min-h-screen bg-slate-100/80 font-sans text-slate-900 flex flex-col">
      {/* 1. TOPBAR FIXED AT VERY TOP (FULL WIDTH) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl focus:outline-none transition-colors shrink-0"
            title={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* ANCC Logo Branding */}
          <Link to="/" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-teal-600/20 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-xs tracking-tight text-teal-800 block uppercase">
                ANCC CONSTRUCTION
              </span>
              <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wider block">
                MANAGEMENT CONSOLE
              </span>
            </div>
          </Link>

          {/* Breadcrumb & Global Search */}
          <div className="flex items-center space-x-4 flex-1 max-w-xl ml-2 sm:ml-6">
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 font-semibold truncate">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-slate-900 font-bold">{getBreadcrumbTitle()}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                Live Sync
              </span>
            </div>

            <div className="relative flex-1 min-w-[120px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search POs, sites, materials..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-xl bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Top Right Header Controls */}
        <div className="flex items-center space-x-3 shrink-0 ml-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="w-3 h-3 rounded-full bg-rose-500 absolute top-1 right-1 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">Pending Approvals</span>
                    <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[10px] text-teal-600 hover:text-teal-700 font-bold transition-colors">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {pendingApprovals.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No pending approvals.</div>
                  ) : (
                    pendingApprovals.map((doc) => {
                      const isRead = readNotifications.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start space-x-3 ${isRead ? 'opacity-60' : ''}`}
                        >
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              navigate('/finance?tab=approvals');
                            }}
                            className="flex-1 flex items-start space-x-3 text-left"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isRead ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'}`}>
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isRead ? 'text-slate-600' : 'text-slate-900'}`}>New Bill: {doc.invoice_no}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{doc.vendor_name}</p>
                              <p className={`text-[10px] font-mono font-bold mt-1 ${isRead ? 'text-slate-500' : 'text-emerald-600'}`}>₹{Number(doc.total || 0).toLocaleString('en-IN')}</p>
                            </div>
                          </button>
                          
                          {!isRead && (
                            <button
                              onClick={(e) => markAsRead(e, doc.id)}
                              className="p-1.5 text-slate-300 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900">{employee?.full_name || user?.email}</span>
            <span className="text-[10px] text-slate-400 font-medium">{role?.name || 'Super Admin'}</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center border border-teal-300 shadow-xs shrink-0">
            {employee?.full_name ? employee.full_name.charAt(0) : 'S'}
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MOBILE OVERLAY BACKDROP BELOW TOPBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed top-16 left-0 right-0 bottom-0 bg-slate-900/60 backdrop-blur-xs z-20 lg:hidden transition-opacity"
        />
      )}

      {/* 3. RESPONSIVE SIDEBAR PINNED BELOW TOPBAR (top-16) */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between shadow-sm overflow-hidden h-[calc(100vh-4rem)]`}
      >
        {/* SIDEBAR NAV LINKS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupName} className="space-y-1.5">
                <div className="px-3 flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                    {group.groupName}
                  </h5>
                  {group.badge && (
                    <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {group.badge}
                    </span>
                  )}
                </div>

                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;

                  if (item.isSiteGroup) {
                    const isAnySiteActive = location.pathname.startsWith('/sites');

                    return (
                      <div key={item.path} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Link
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex-1 flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                              isAnySiteActive && location.pathname === '/sites'
                                ? 'bg-teal-50 text-teal-800 font-black border-l-4 border-teal-600 shadow-2xs'
                                : 'text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <span className={isAnySiteActive ? 'text-teal-600' : 'text-slate-400'}>
                              {item.icon}
                            </span>
                            <span className="flex-1 text-left">{item.name}</span>
                            <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-extrabold border border-teal-200">
                              Online
                            </span>
                          </Link>

                          <button
                            onClick={() => setSitesExpanded(!sitesExpanded)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title={sitesExpanded ? 'Collapse site list' : 'Expand site list'}
                          >
                            {sitesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* DYNAMIC SITES SUB-LIST */}
                        {sitesExpanded && (
                          <div className="ml-3 pl-3 border-l border-slate-200 space-y-1 py-1">
                            {sidebarSites.length === 0 ? (
                              <p className="text-xs text-slate-400 px-2 py-1 font-medium">No active sites</p>
                            ) : (
                              sidebarSites.map((site) => {
                                const isSiteActive = location.pathname === `/sites/${site.id}`;
                                return (
                                  <Link
                                    key={site.id}
                                    to={`/sites/${site.id}`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                      isSiteActive
                                        ? 'bg-teal-50 text-teal-800 font-black border border-teal-200'
                                        : 'text-slate-500 font-bold hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          site.status === 'Active'
                                            ? 'bg-teal-500'
                                            : site.status === 'On Hold'
                                            ? 'bg-amber-400'
                                            : 'bg-slate-400'
                                        }`}
                                      />
                                      <span className="truncate">{site.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                                      {site.site_code}
                                    </span>
                                  </Link>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-black border-l-4 border-teal-600 shadow-2xs'
                          : 'text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className={isActive ? 'text-teal-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* SIDEBAR FOOTER USER CARD */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center border border-teal-300 shrink-0">
              {employee?.full_name ? employee.full_name.charAt(0) : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">
                {employee?.full_name || 'System Admin'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {role?.name || 'Super Admin'} • {employee?.employee_code || 'EMP-0001'}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>ERP Core v4.2</span>
            <span>Build 2026.09</span>
          </div>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA OFFSET BY TOPBAR (pt-16) AND SIDEBAR (lg:pl-64) */}
      <div className="flex-1 pt-16 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
