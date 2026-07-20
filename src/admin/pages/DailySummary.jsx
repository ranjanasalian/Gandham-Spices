import { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Calendar, ShoppingBag, Package, DollarSign, ArrowUpRight, TrendingUp,
  AlertTriangle, RefreshCw, Clock, ArrowRight, ShieldAlert, Truck
} from 'lucide-react';

export default function DailySummary() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawOrders, setRawOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Query "today" stats (which defaults to 2026-07-20 baseline metrics)
      const data = await api.stats.getDashboardStats('today');
      setStats(data);

      const ordersData = await api.orders.getAll();
      setRawOrders(ordersData);

      const custData = await api.customers.getAll();
      setCustomers(custData);

      const prodData = await api.products.getAll();
      setProducts(prodData);
    } catch (err) {
      setError(err.message || 'Failed to load business summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  const summary = stats?.summary || {};
  const recentActivities = stats?.recentActivities || [];

  // Filter orders matching today's date "2026-07-20"
  const todaysOrders = rawOrders.filter(o => o.orderDate === '2026-07-20');

  return (
    <div className="space-y-8 font-body">
      
      {/* ---------------- TITLE HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-saffron to-orange-500 p-6 rounded-3xl text-white shadow-lg">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-black tracking-tight">Daily Executive Summary</h2>
          <p className="text-white/80 text-xs font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Operational log for Monday, July 20, 2026</span>
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-xs bg-white text-orange-600 font-bold hover:bg-slate-50 px-4 py-2 rounded-2xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Snapshot</span>
        </button>
      </div>

      {/* ---------------- TODAY METRIC TILES ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Today's Revenue</p>
            <h4 className="text-xl font-black mt-0.5 text-slate-900 dark:text-white">₹{summary.totalRevenue}</h4>
            <span className="text-[10px] text-slate-400 font-medium">Logged invoices</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Today's Profit</p>
            <h4 className="text-xl font-black mt-0.5 text-slate-900 dark:text-white">₹{summary.totalProfit}</h4>
            <span className="text-[10px] text-slate-400 font-medium">Net margin</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Today's Expenses</p>
            <h4 className="text-xl font-black mt-0.5 text-slate-900 dark:text-white">₹{summary.totalExpenses}</h4>
            <span className="text-[10px] text-slate-400 font-medium">Materials & Utilities</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Pending Payments</p>
            <h4 className="text-xl font-black mt-0.5 text-slate-900 dark:text-white">₹{summary.pendingPayments}</h4>
            <span className="text-[10px] text-slate-400 font-medium">Dues outstanding</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Manufactured Today</p>
            <h4 className="text-lg font-black mt-0.5 text-slate-900 dark:text-white">{summary.productsManufactured} packs</h4>
            <span className="text-[10px] text-slate-400 font-medium">Added to stock</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Products Sold Today</p>
            <h4 className="text-lg font-black mt-0.5 text-slate-900 dark:text-white">{summary.productsSold} packs</h4>
            <span className="text-[10px] text-slate-400 font-medium">Billed out</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-left">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Shipped Today</p>
            <h4 className="text-lg font-black mt-0.5 text-slate-900 dark:text-white">{summary.productsDelivered} packs</h4>
            <span className="text-[10px] text-slate-400 font-medium">Delivered to retail</span>
          </div>
        </div>

      </div>

      {/* ---------------- TODAY'S ACTIVITIES & ALERTS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-left">
            <ShoppingBag className="w-5 h-5 text-saffron" />
            <span>Today's Customer Orders ({todaysOrders.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Invoice #</th>
                  <th className="py-2.5">Customer / Shop</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysOrders.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No new customer orders recorded today.
                    </td>
                  </tr>
                ) : (
                  todaysOrders.map((ord) => {
                    const cust = customers.find(c => c.id === ord.customerId);
                    return (
                      <tr key={ord.id} className="border-b border-slate-50 dark:border-slate-800">
                        <td className="py-3 font-bold text-saffron">{ord.invoiceNumber}</td>
                        <td className="py-3 font-semibold">{cust ? cust.shopName : 'Direct Customer'}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            ord.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Warning Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-left">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Low Stock Alerts ({summary.lowStockAlerts})</span>
          </h3>

          <div className="space-y-2.5 text-left text-xs">
            {summary.lowStockAlerts === 0 ? (
              <p className="py-6 text-center text-slate-500 dark:text-slate-400">
                All inventory levels are healthy.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {products.filter(p => p.currentStock < 20).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-red-500/5 border border-red-500/20 p-2.5 rounded-xl">
                    <span className="font-semibold text-red-400">{p.name} (Product)</span>
                    <span className="font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg">{p.currentStock} packs left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ---------------- ACTIVITY FEED SNAPSHOT ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold flex items-center gap-2 text-left">
            <Clock className="w-5 h-5 text-saffron" />
            <span>Action logs for Today</span>
          </h3>
        </div>

        <div className="space-y-4 text-left">
          {recentActivities.length === 0 ? (
            <p className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">No administrative actions logged today.</p>
          ) : (
            recentActivities.map((act) => (
              <div key={act.id} className="flex gap-4 items-start border-b border-slate-50 dark:border-slate-800 pb-3 last:border-b-0">
                <div className="w-2 h-2 rounded-full bg-saffron mt-2" />
                <div className="flex-1 text-xs">
                  <p className="font-bold">{act.action}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{act.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold self-center">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
