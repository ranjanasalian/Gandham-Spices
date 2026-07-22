import { useState, useEffect } from 'react';
import { api } from './api';
import AdminLogin from './components/AdminLogin';
import AdminLayout from './components/AdminLayout';
import { Loader } from 'lucide-react';

// Subpages
import DashboardHome from './pages/DashboardHome';
import DailySummary from './pages/DailySummary';
import PurchaseHistory from './pages/PurchaseHistory';
import ProductionMgmt from './pages/ProductionMgmt';
import RecipeTracker from './pages/RecipeTracker';
import BatchTraceability from './pages/BatchTraceability';
import InventoryMgmt from './pages/InventoryMgmt';
import ProductMgmt from './pages/ProductMgmt';
import ShopCustomerMgmt from './pages/ShopCustomerMgmt';
import DeliveryMgmt from './pages/DeliveryMgmt';
import SalesMgmt from './pages/SalesMgmt';
import Invoices from './pages/Invoices';
import ExpenseMgmt from './pages/ExpenseMgmt';
import PendingPayments from './pages/PendingPayments';
import OrderMgmt from './pages/OrderMgmt';
import SupplierMgmt from './pages/SupplierMgmt';
import SalesTargetDashboard from './pages/SalesTargetDashboard';
import Reports from './pages/Reports';

const getTabFromPath = () => {
  const path = window.location.pathname;
  const parts = path.split('/admin/');
  if (parts.length > 1 && parts[1]) {
    return parts[1].split('/')[0] || 'home';
  }
  return 'home';
};

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(getTabFromPath());
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync tab state when back/forward browser buttons are pressed
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('gandham_admin_token');
    const storedUser = localStorage.getItem('gandham_admin_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verify token freshness
      api.auth.me()
        .then(res => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('gandham_admin_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          localStorage.removeItem('gandham_admin_token');
          localStorage.removeItem('gandham_admin_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    const newPath = tab === 'home' ? '/admin' : `/admin/${tab}`;
    window.history.pushState(null, '', newPath);
  };

  const renderPageContent = () => {
    switch (currentTab) {
      case 'home':
        return <DashboardHome isDarkMode={isDarkMode} />;
      case 'daily-summary':
        return <DailySummary />;
      case 'purchase-history':
        return <PurchaseHistory />;
      case 'production':
        return <ProductionMgmt />;
      case 'recipes':
        return <RecipeTracker />;
      case 'traceability':
        return <BatchTraceability />;
      case 'inventory':
        return <InventoryMgmt />;
      case 'products':
        return <ProductMgmt />;
      case 'customers':
        return <ShopCustomerMgmt />;
      case 'deliveries':
        return <DeliveryMgmt />;
      case 'sales':
        return <SalesMgmt />;
      case 'invoices':
        return <Invoices />;
      case 'expenses':
        return <ExpenseMgmt />;
      case 'payments':
        return <PendingPayments />;
      case 'orders':
        return <OrderMgmt />;
      case 'suppliers':
        return <SupplierMgmt />;
      case 'targets':
        return <SalesTargetDashboard isDarkMode={isDarkMode} />;
      case 'reports':
        return <Reports isDarkMode={isDarkMode} />;
      default:
        return <DashboardHome isDarkMode={isDarkMode} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <Loader className="w-10 h-10 animate-spin text-saffron mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Booting Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <AdminLayout
      user={user}
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
    >
      {renderPageContent()}
    </AdminLayout>
  );
}
