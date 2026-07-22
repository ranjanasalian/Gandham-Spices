import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import {
  LayoutDashboard, ClipboardList, Factory, FlaskConical, Search, Archive, Package,
  Store, Truck, Receipt, Wallet, CircleDollarSign, ArrowRightLeft, Users, Target,
  FileBarChart, LogOut, Bell, Sun, Moon, Menu, X, ShieldAlert, ShoppingBag, FileText
} from 'lucide-react';

export default function AdminLayout({ user, currentTab, setCurrentTab, children, isDarkMode, setIsDarkMode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef(null);

  // Scroll to top of workspace container when tab changes
  useEffect(() => {
    const resetScroll = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    };
    resetScroll();
    // Safety fallback for slightly delayed DOM render cycles
    const timer = setTimeout(resetScroll, 50);
    return () => clearTimeout(timer);
  }, [currentTab]);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleDismissNotification = async (id) => {
    try {
      await api.notifications.dismiss(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const navItems = [
    { id: 'home', label: 'Dashboard Home', icon: LayoutDashboard },
    { id: 'daily-summary', label: 'Daily Business Summary', icon: ClipboardList },
    { id: 'purchase-history', label: 'Ingredient Purchase History', icon: ShoppingBag },
    { id: 'production', label: 'Production Mgmt', icon: Factory },
    { id: 'recipes', label: 'Recipe & Batch Tracker', icon: FlaskConical },
    { id: 'traceability', label: 'Batch Traceability', icon: Search },
    { id: 'inventory', label: 'Raw Material Inventory', icon: Archive },
    { id: 'products', label: 'Product Management', icon: Package },
    { id: 'customers', label: 'Shop & Customer Mgmt', icon: Store },
    { id: 'deliveries', label: 'Delivery Management', icon: Truck },
    { id: 'sales', label: 'Sales Management', icon: Receipt },
    { id: 'invoices', label: 'Bill & Invoice Generator', icon: FileText },
    { id: 'expenses', label: 'Expense Management', icon: Wallet },
    { id: 'payments', label: 'Pending Payments', icon: CircleDollarSign },
    { id: 'orders', label: 'Order Management', icon: ArrowRightLeft },
    { id: 'suppliers', label: 'Supplier Management', icon: Users },
    { id: 'targets', label: 'Sales Targets', icon: Target },
    { id: 'reports', label: 'Reports & Downloads', icon: FileBarChart },
  ];

  const handleLogout = () => {
    api.auth.logout();
  };

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <div className={`h-screen overflow-hidden flex ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-body transition-colors duration-200`}>
      
      {/* ---------------- SIDEBAR (DESKTOP) ---------------- */}
      <aside className={`hidden lg:flex flex-col w-64 border-r ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex-shrink-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-inherit">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-saffron to-orange-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              GS
            </div>
            <span className="font-display font-bold text-lg text-saffron">Gandham Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-gradient-to-r from-saffron/10 to-orange-500/10 text-saffron border border-saffron/20'
                    : isDarkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-saffron' : 'text-slate-400 group-hover:text-inherit'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-inherit">
          <div className="flex items-center justify-between px-2 py-2 mb-4 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl">
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Signed in as</span>
              <span className="text-sm font-bold truncate max-w-[120px]">{user?.name || 'Administrator'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- MOBILE DRAWER SIDEBAR ---------------- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className={`relative flex flex-col w-64 h-full ${isDarkMode ? 'bg-slate-900 border-r border-slate-800 text-slate-100' : 'bg-white border-r border-slate-200 text-slate-800'} flex-shrink-0 z-10 animate-fade-in-up`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-saffron to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow">
                  GS
                </div>
                <span className="font-display font-bold text-lg text-saffron">Gandham Admin</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-saffron/10 text-saffron border border-saffron/20'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-saffron' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-2 py-2 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Signed in as</span>
                  <span className="text-sm font-bold truncate max-w-[120px]">{user?.name || 'Admin'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* ---------------- TOP BAR ---------------- */}
        <header className={`h-16 flex items-center justify-between px-4 sm:px-6 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex-shrink-0 z-30`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold tracking-tight md:text-xl">
              {navItems.find(item => item.id === currentTab)?.label || 'Administration'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Dark/Light Mode"
              className="p-2.5 rounded-xl text-slate-400 hover:text-saffron hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`p-2.5 rounded-xl text-slate-400 hover:text-saffron hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative ${notifOpen ? 'bg-slate-100 dark:bg-slate-800 text-saffron' : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl border p-4 z-50 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} animate-fade-in-up`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                      <span className="font-bold text-sm">Notifications & Alerts</span>
                      <span className="text-xs bg-saffron/10 text-saffron px-2.5 py-0.5 rounded-full font-semibold">{notifications.length} Total</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                          No active notifications or alerts.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex gap-3 p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                              notif.type === 'Low Stock' 
                                ? 'bg-amber-500/5 border-amber-500/20' 
                                : 'bg-red-500/5 border-red-500/20'
                            }`}
                          >
                            <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${notif.type === 'Low Stock' ? 'text-amber-500' : 'text-red-500'}`} />
                            <div className="flex-1 text-left">
                              <p className="font-semibold">{notif.type}</p>
                              <p className="text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">{notif.date}</span>
                            </div>
                            <button
                              onClick={() => handleDismissNotification(notif.id)}
                              className="text-slate-400 hover:text-white self-start p-1 rounded hover:bg-white/5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Profile Avatar */}
            <div className="flex items-center gap-2.5 pl-1.5">
              <div className="w-8 h-8 rounded-full bg-saffron/10 text-saffron flex items-center justify-center font-bold text-sm uppercase ring-2 ring-saffron/20">
                {user?.username?.substring(0, 2) || 'AD'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight">{user?.name || 'Administrator'}</span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase leading-tight mt-0.5">{user?.role || 'Admin'}</span>
              </div>
            </div>

          </div>
        </header>

        {/* ---------------- WORKSPACE CONTENT ---------------- */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
