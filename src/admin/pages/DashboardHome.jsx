import { useState, useEffect } from 'react';
import { api } from '../api';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Users,
  ShoppingBag, Calendar, ArrowRight, RefreshCw, BarChart2, ShieldAlert, ClipboardList, Store
} from 'lucide-react';

export default function DashboardHome({ isDarkMode }) {
  const [range, setRange] = useState('week');
  const [startDate, setStartDate] = useState('2026-07-14');
  const [endDate, setEndDate] = useState('2026-07-20');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.stats.getDashboardStats(range, startDate, endDate);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  const handleCustomSearch = () => {
    if (range === 'custom') {
      fetchStats();
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  const summary = stats?.summary || {};
  const charts = stats?.charts || {};
  const recentActivities = stats?.recentActivities || [];

  // Card definition helper
  const cards = [
    { title: 'Products Manufactured Today', value: summary.productsManufactured, unit: 'packs', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Products Sold Today', value: summary.productsSold, unit: 'packs', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Products Delivered Today', value: summary.productsDelivered, unit: 'packs', icon: TrendingUp, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Current Inventory', value: summary.currentInventory, unit: 'packs', icon: Package, color: 'text-orange-500 bg-orange-500/10' },
    { title: 'Total Revenue', value: `₹${summary.totalRevenue || 0}`, unit: '', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Total Profit', value: `₹${summary.totalProfit || 0}`, unit: '', icon: TrendingUp, color: 'text-teal-500 bg-teal-500/10' },
    { title: 'Total Expenses', value: `₹${summary.totalExpenses || 0}`, unit: '', icon: TrendingDown, color: 'text-rose-500 bg-rose-500/10' },
    { title: 'Pending Payments', value: `₹${summary.pendingPayments || 0}`, unit: '', icon: DollarSign, color: 'text-yellow-500 bg-yellow-500/10' },
    { title: 'Total Customers', value: summary.totalCustomers, unit: 'profiles', icon: Users, color: 'text-sky-500 bg-sky-500/10' },
    { title: 'Total Shops', value: summary.totalShops, unit: 'shops', icon: Store, color: 'text-violet-500 bg-violet-500/10' },
    { title: 'Orders Received Today', value: summary.ordersReceived, unit: 'orders', icon: ShoppingBag, color: 'text-cyan-500 bg-cyan-500/10' },
    { title: 'Orders Delivered Today', value: summary.ordersDelivered, unit: 'orders', icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' },
    { title: 'Low Stock Alerts', value: summary.lowStockAlerts, unit: 'warnings', icon: AlertTriangle, color: summary.lowStockAlerts > 0 ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 bg-slate-400/10' },
  ];

  // Render Line Chart (Revenue & Profit) using pure SVG
  const renderTrendChart = () => {
    const data = charts.dailyTrends || [];
    if (data.length === 0) return <div className="text-center py-10 text-slate-400 text-xs">No data for selected period</div>;

    const width = 600;
    const height = 240;
    const padding = 40;

    const maxRev = Math.max(...data.map(d => Math.max(d.revenue, d.profit, 100)));
    
    // Scale helper
    const getX = (index) => padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const getY = (val) => height - padding - (val * (height - padding * 2)) / maxRev;

    // Build path strings
    let revPath = '';
    let profitPath = '';
    
    data.forEach((d, i) => {
      const x = getX(i);
      const yRev = getY(d.revenue);
      const yProfit = getY(d.profit);

      if (i === 0) {
        revPath = `M ${x} ${yRev}`;
        profitPath = `M ${x} ${yProfit}`;
      } else {
        revPath += ` L ${x} ${yRev}`;
        profitPath += ` L ${x} ${yProfit}`;
      }
    });

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + ratio * (height - padding * 2);
            const val = Math.round(maxRev * (1 - ratio));
            return (
              <g key={index}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding - 8} y={y + 4} textAnchor="end" className="text-[9px] font-semibold fill-slate-400">
                  ₹{val}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            if (data.length > 10 && i % Math.round(data.length / 5) !== 0) return null;
            const x = getX(i);
            const labelDate = d.date.substring(5); // MM-DD
            return (
              <text key={i} x={x} y={height - padding + 18} textAnchor="middle" className="text-[9px] font-semibold fill-slate-400">
                {labelDate}
              </text>
            );
          })}

          {/* Lines */}
          <path d={revPath} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={profitPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactivity dots */}
          {data.map((d, i) => {
            const x = getX(i);
            const yRev = getY(d.revenue);
            const yProfit = getY(d.profit);

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={yRev}
                  r="4"
                  className="fill-saffron stroke-slate-900 stroke-2 cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredDataPoint({ date: d.date, revenue: d.revenue, profit: d.profit, x, y: yRev })}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                />
                <circle
                  cx={x}
                  cy={yProfit}
                  r="4"
                  className="fill-emerald-500 stroke-slate-900 stroke-2 cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredDataPoint({ date: d.date, revenue: d.revenue, profit: d.profit, x, y: yProfit })}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip Overlay */}
        {hoveredDataPoint && (
          <div
            className="absolute bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 shadow-xl text-[10px] space-y-1 z-20 pointer-events-none"
            style={{
              left: `${(hoveredDataPoint.x / width) * 100}%`,
              top: `${(hoveredDataPoint.y / height) * 100 - 65}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <p className="font-bold border-b border-slate-700 pb-1">{hoveredDataPoint.date}</p>
            <p className="flex justify-between gap-4"><span className="text-amber-500">Revenue:</span> <span>₹{hoveredDataPoint.revenue}</span></p>
            <p className="flex justify-between gap-4"><span className="text-emerald-400">Profit:</span> <span>₹{hoveredDataPoint.profit}</span></p>
          </div>
        )}
      </div>
    );
  };

  // Render Horizontal Bar Chart (Product Performance)
  const renderProductChart = () => {
    const data = charts.productPerformance || [];
    if (data.length === 0) return <div className="text-center py-10 text-slate-400 text-xs">No product sales logged</div>;

    const maxRev = Math.max(...data.map(d => d.revenue || 1));

    return (
      <div className="space-y-4">
        {data.slice(0, 5).map((item, index) => {
          const pct = Math.max(5, (item.revenue / maxRev) * 100);
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="truncate max-w-[200px]">{item.name}</span>
                <span className="text-slate-500 dark:text-slate-400">₹{item.revenue} ({item.quantity} packs)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-saffron to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Inventory Stock Level Bars
  const renderInventoryChart = () => {
    const data = charts.inventoryData || [];
    if (data.length === 0) return <div className="text-center py-10 text-slate-400 text-xs">No products in stock</div>;

    const maxStock = Math.max(...data.map(d => d.stock || 1));

    return (
      <div className="space-y-4">
        {data.map((item, index) => {
          const pct = Math.max(5, (item.stock / maxStock) * 100);
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="truncate max-w-[200px]">{item.name}</span>
                <span className={`font-bold ${item.stock < 20 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.stock} packs {item.stock < 20 && '(Low)'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.stock < 20 ? 'bg-red-500' : 'bg-orange-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* ---------------- FILTERS & RELOAD ---------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {['today', 'week', 'month', 'year', 'custom'].map((mode) => (
            <button
              key={mode}
              onClick={() => setRange(mode)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                range === mode
                  ? 'bg-saffron text-white shadow-md shadow-saffron/25'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2 animate-fade-in-up">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs focus:ring-1 focus:ring-saffron focus:outline-none"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs focus:ring-1 focus:ring-saffron focus:outline-none"
            />
            <button
              onClick={handleCustomSearch}
              className="px-3 py-1.5 bg-saffron text-white rounded-xl text-xs font-bold hover:bg-orange-500 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 text-xs text-saffron font-bold hover:text-orange-500 bg-saffron/10 px-3 py-1.5 rounded-xl transition-colors ml-auto sm:ml-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Metrics</span>
        </button>
      </div>

      {/* ---------------- SUMMARY METRIC CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group`}
            >
              <div className="space-y-1.5 text-left">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {card.title}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{card.value}</span>
                  {card.unit && <span className="text-xs text-slate-400 font-semibold">{card.unit}</span>}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- CHARTS PANEL ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-saffron" />
              <span>Sales & Profit Ledger Trend</span>
            </h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-saffron" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit</span>
            </div>
          </div>
          {renderTrendChart()}
        </div>

        {/* Product Performance Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-saffron" />
              <span>Top spice sales</span>
            </h3>
          </div>
          {renderProductChart()}
        </div>

      </div>

      {/* ---------------- SECONDARY CHARTS & ACTIVITIES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory Stock Levels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-saffron" />
              <span>Finished Stock Catalog</span>
            </h3>
          </div>
          {renderInventoryChart()}
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-saffron" />
              <span>Recent Activity Feed</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Live Logs</span>
          </div>

          <div className="overflow-y-auto max-h-[300px] space-y-4 pr-1 text-left">
            {recentActivities.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-400 text-xs">No recent admin logs found.</div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3.5 items-start border-b border-slate-100 dark:border-slate-800 pb-3 last:border-b-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-saffron mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-0.5 text-xs">
                    <p className="font-bold">{act.action}</p>
                    <p className="text-slate-500 dark:text-slate-400">{act.details}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 self-center" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
