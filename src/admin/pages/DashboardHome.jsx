import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Users,
  ShoppingBag, Calendar, ArrowRight, RefreshCw, BarChart2, ShieldAlert, ClipboardList, Store, Archive, X
} from 'lucide-react';

export default function DashboardHome({ isDarkMode }) {
  const navigate = useNavigate();
  const [range, setRange] = useState('month');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [startDate, setStartDate] = useState('2026-07-14');
  const [endDate, setEndDate] = useState('2026-07-20');
  const [stats, setStats] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  const fetchStatsAndTargets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.stats.getDashboardStats(range, startDate, endDate);
      setStats(data);

      // Fetch active target
      const targetsData = await api.targets.getAll();
      const currentMonthKey = new Date().toISOString().substring(0, 7); // "YYYY-MM"
      const target = targetsData.find(t => t.period === currentMonthKey);
      setActiveTarget(target || null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndTargets();
  }, [range]);

  const handleCustomSearch = () => {
    if (range === 'custom') {
      fetchStatsAndTargets();
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

  // Determine cards based on range selection
  let cards = [];
  if (range === 'today') {
    const today = summary.today || { productsProduced: 0, productsSold: 0, revenue: 0 };
    cards = [
      { title: 'Products Manufactured Today', value: today.productsProduced, unit: 'packs', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
      { title: 'Products Sold Today', value: today.productsSold, unit: 'packs', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10' },
      { title: 'Revenue Today', value: `₹${(today.revenue || 0).toFixed(2)}`, unit: '', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
      { title: 'Current Finished Stock', value: summary.currentInventory || 0, unit: 'packs', icon: Archive, color: 'text-orange-500 bg-orange-500/10' },
      { title: 'Low Stock Alerts', value: summary.lowStockAlerts || 0, unit: 'warnings', icon: AlertTriangle, color: summary.lowStockAlerts > 0 ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 bg-slate-400/10' },
    ];
  } else if (range === 'year') {
    const year = summary.thisYear || { revenue: 0, netProfit: 0, expenses: 0, ingredientPurchases: 0, productionQty: 0, pouchesSold: 0 };
    cards = [
      { title: 'Total Revenue (Year)', value: `₹${(year.revenue || 0).toFixed(2)}`, unit: '', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
      { title: 'Net Profit (Year)', value: `₹${(year.netProfit || 0).toFixed(2)}`, unit: '', icon: TrendingUp, color: 'text-teal-500 bg-teal-500/10' },
      { title: 'Total Expenses (Year)', value: `₹${(year.expenses || 0).toFixed(2)}`, unit: '', icon: TrendingDown, color: 'text-rose-500 bg-rose-500/10' },
      { title: 'Ingredient Purchases (Year)', value: `₹${(year.ingredientPurchases || 0).toFixed(2)}`, unit: '', icon: ShoppingBag, color: 'text-indigo-500 bg-indigo-500/10' },
      { title: 'Production Quantity (Year)', value: year.productionQty || 0, unit: 'packs', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
      { title: 'Pouches Sold (Year)', value: year.pouchesSold || 0, unit: 'packs', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10' },
      { title: 'Current Finished Stock', value: summary.currentInventory || 0, unit: 'packs', icon: Archive, color: 'text-orange-500 bg-orange-500/10' },
      { title: 'Low Stock Alerts', value: summary.lowStockAlerts || 0, unit: 'warnings', icon: AlertTriangle, color: summary.lowStockAlerts > 0 ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 bg-slate-400/10' },
    ];
  } else if (range === 'month') {
    const month = summary.thisMonth || { revenue: 0, netProfit: 0, expenses: 0, ingredientPurchases: 0, productionQty: 0, pouchesSold: 0 };
    cards = [
      { title: 'Total Revenue (Month)', value: `₹${(month.revenue || 0).toFixed(2)}`, unit: '', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
      { title: 'Net Profit (Month)', value: `₹${(month.netProfit || 0).toFixed(2)}`, unit: '', icon: TrendingUp, color: 'text-teal-500 bg-teal-500/10' },
      { title: 'Total Expenses (Month)', value: `₹${(month.expenses || 0).toFixed(2)}`, unit: '', icon: TrendingDown, color: 'text-rose-500 bg-rose-500/10' },
      { title: 'Ingredient Purchases (Month)', value: `₹${(month.ingredientPurchases || 0).toFixed(2)}`, unit: '', icon: ShoppingBag, color: 'text-indigo-500 bg-indigo-500/10' },
      { title: 'Production Quantity (Month)', value: month.productionQty || 0, unit: 'packs', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
      { title: 'Pouches Sold (Month)', value: month.pouchesSold || 0, unit: 'packs', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10' },
      { title: 'Current Finished Stock', value: summary.currentInventory || 0, unit: 'packs', icon: Archive, color: 'text-orange-500 bg-orange-500/10' },
      { title: 'Low Stock Alerts', value: summary.lowStockAlerts || 0, unit: 'warnings', icon: AlertTriangle, color: summary.lowStockAlerts > 0 ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 bg-slate-400/10' },
    ];
  } else {
    // Week or Custom (Default)
    const week = summary.thisWeek || { production: 0, sales: 0, revenue: 0, profit: 0 };
    cards = [
      { title: 'Production (Week)', value: week.production || 0, unit: 'packs', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
      { title: 'Sales (Week)', value: week.sales || 0, unit: 'packs', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10' },
      { title: 'Revenue (Week)', value: `₹${(week.revenue || 0).toFixed(2)}`, unit: '', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
      { title: 'Profit (Week)', value: `₹${(week.profit || 0).toFixed(2)}`, unit: '', icon: TrendingUp, color: 'text-teal-500 bg-teal-500/10' },
      { title: 'Current Finished Stock', value: summary.currentInventory || 0, unit: 'packs', icon: Archive, color: 'text-orange-500 bg-orange-500/10' },
      { title: 'Low Stock Alerts', value: summary.lowStockAlerts || 0, unit: 'warnings', icon: AlertTriangle, color: summary.lowStockAlerts > 0 ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 bg-slate-400/10' },
    ];
  }

  // Target warning calculations
  const now = new Date();
  const currentDay = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsedRatio = currentDay / totalDays;
  const revenueMonth = summary.thisMonth?.revenue || 0;

  const expectedRevenue = activeTarget ? activeTarget.targetRevenue * elapsedRatio : 0;
  const isBehind = activeTarget && revenueMonth < expectedRevenue;
  const remainingTargetAmount = activeTarget ? Math.max(0, activeTarget.targetRevenue - revenueMonth) : 0;
  const targetPercent = activeTarget ? Math.min(100, Math.round((revenueMonth / activeTarget.targetRevenue) * 100)) : 0;

  // Helper to generate smooth cubic bezier spline paths
  const getBezierPath = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const getAreaPath = (points, bottomY) => {
    if (!points || points.length === 0) return '';
    const curve = getBezierPath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${curve} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  };

  // Render Smooth Bezier Area Chart (Revenue & Profit)
  const renderTrendChart = () => {
    const data = charts.dailyTrends || [];
    if (data.length === 0) return <div className="text-center py-12 text-slate-400 text-xs">No ledger transactions for this period</div>;

    const width = 640;
    const height = 260;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    const bottomY = height - paddingBottom;

    const maxVal = Math.max(...data.map(d => Math.max(d.revenue || 0, d.profit || 0, 100)));
    
    const getX = (index) => paddingLeft + (index * (width - paddingLeft - paddingRight)) / Math.max(data.length - 1, 1);
    const getY = (val) => bottomY - (val * (bottomY - paddingTop)) / maxVal;

    const revPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.revenue || 0), revenue: d.revenue, date: d.date, sales: d.sales }));
    const profitPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.profit || 0), profit: d.profit, date: d.date, sales: d.sales }));

    const revBezier = getBezierPath(revPoints);
    const revArea = getAreaPath(revPoints, bottomY);

    const profitBezier = getBezierPath(profitPoints);
    const profitArea = getAreaPath(profitPoints, bottomY);

    // Summary calculation for badges
    const totalRev = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalProf = data.reduce((sum, d) => sum + (d.profit || 0), 0);
    const peakRev = Math.max(...data.map(d => d.revenue || 0));
    const marginPct = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : '0.0';

    return (
      <div className="relative space-y-4">
        {/* Executive Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Peak Period Sales:</span>
            <span className="font-black text-amber-500">₹{peakRev.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Avg Sales / Slot:</span>
            <span className="font-black text-slate-700 dark:text-slate-200">₹{(totalRev / Math.max(data.length, 1)).toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Gross Margin:</span>
            <span className={`font-black ${parseFloat(marginPct) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{marginPct}%</span>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y-Axis Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingTop + ratio * (bottomY - paddingTop);
              const val = Math.round(maxVal * (1 - ratio));
              return (
                <g key={index}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-400 font-mono">
                    ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Dates / Labels */}
            {data.map((d, i) => {
              if (data.length > 12 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1) return null;
              const x = getX(i);
              const labelDate = d.date.length > 5 ? d.date.substring(5) : d.date; // MM-DD or Month name
              return (
                <text key={i} x={x} y={height - 12} textAnchor="middle" className="text-[9px] font-bold fill-slate-400 font-mono">
                  {labelDate}
                </text>
              );
            })}

            {/* Area Fills */}
            <path d={revArea} fill="url(#revGrad)" />
            <path d={profitArea} fill="url(#profitGrad)" />

            {/* Bezier Stroke Paths */}
            <path d={revBezier} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={profitBezier} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Active Vertical Guide Indicator Line */}
            {hoveredDataPoint && (
              <line
                x1={hoveredDataPoint.x}
                y1={paddingTop}
                x2={hoveredDataPoint.x}
                y2={bottomY}
                stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Interactive Data Markers */}
            {data.map((d, i) => {
              const x = getX(i);
              const yRev = getY(d.revenue || 0);
              const yProfit = getY(d.profit || 0);
              const isHovered = hoveredDataPoint && hoveredDataPoint.index === i;

              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={yRev}
                    r={isHovered ? '6' : '3.5'}
                    className="fill-amber-500 stroke-slate-900 stroke-2 cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredDataPoint({ index: i, date: d.date, revenue: d.revenue, profit: d.profit, sales: d.sales, x, y: yRev })}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                  <circle
                    cx={x}
                    cy={yProfit}
                    r={isHovered ? '6' : '3.5'}
                    className="fill-emerald-500 stroke-slate-900 stroke-2 cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredDataPoint({ index: i, date: d.date, revenue: d.revenue, profit: d.profit, sales: d.sales, x, y: yProfit })}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating Glassmorphic Tooltip Card */}
          {hoveredDataPoint && (
            <div
              className="absolute bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white rounded-2xl p-3 shadow-2xl text-xs space-y-1.5 z-30 pointer-events-none w-48 transition-all duration-150 animate-fade-in"
              style={{
                left: `${(hoveredDataPoint.x / width) * 100}%`,
                top: `${(hoveredDataPoint.y / height) * 100 - 80}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-1 font-bold text-slate-300">
                <span>{hoveredDataPoint.date}</span>
                {hoveredDataPoint.sales > 0 && <span className="text-[10px] text-saffron bg-saffron/10 px-1.5 py-0.5 rounded">{hoveredDataPoint.sales} sold</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-medium">Revenue:</span>
                <span className="font-black text-amber-400">₹{(hoveredDataPoint.revenue || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-medium">Net Profit:</span>
                <span className="font-black text-emerald-400">₹{(hoveredDataPoint.profit || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
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
            <div key={index} className="space-y-1 text-left">
              <div className="flex justify-between text-xs font-semibold">
                <span className="truncate max-w-[200px]">{item.name}</span>
                <span className="text-slate-500 dark:text-slate-400">₹{item.revenue.toFixed(0)} ({item.quantity} packs)</span>
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
            <div key={index} className="space-y-1 text-left">
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
          onClick={fetchStatsAndTargets}
          className="flex items-center gap-1.5 text-xs text-saffron font-bold hover:text-orange-500 bg-saffron/10 px-3 py-1.5 rounded-xl transition-colors ml-auto sm:ml-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Metrics</span>
        </button>
      </div>

      {/* ---------------- SALES TARGETS SCHEDULE NOTIFICATION BANNERS ---------------- */}
      {activeTarget && isBehind && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold text-left">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-bold text-sm">Monthly Sales Target Behind Schedule ({activeTarget.period})</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-normal">
              You are currently behind the expected schedule for this month's revenue goal of ₹{activeTarget.targetRevenue.toFixed(0)}. 
              Expected so far: ₹{expectedRevenue.toFixed(0)}, Actual: ₹{revenueMonth.toFixed(0)} ({targetPercent}% Achieved). 
              Need to collect ₹{remainingTargetAmount.toFixed(0)} more by the end of the month.
            </p>
          </div>
        </div>
      )}

      {activeTarget && !isBehind && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold text-left">
          <TrendingUp className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <div className="flex-1">
            <p className="font-bold text-sm">On Track for Monthly Goal ({activeTarget.period})</p>
            <p className="mt-1 text-slate-650 dark:text-slate-450 leading-normal">
              Excellent! You are on track for your monthly revenue target of ₹{activeTarget.targetRevenue.toFixed(0)}. 
              Actual collections so far: ₹{revenueMonth.toFixed(0)} ({targetPercent}% Achieved). Keep up the great pace!
            </p>
          </div>
        </div>
      )}

      {/* ---------------- LOW STOCK ALERT BANNER ---------------- */}
      {summary.lowStockAlerts > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold text-left animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 animate-pulse" />
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-white">
                {summary.lowStockAlerts} Low Stock Warnings Detected
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                Some raw ingredient stocks or finished pouch inventories are below safe threshold levels.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLowStockModal(true)}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-sm flex-shrink-0 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>View All {summary.lowStockAlerts} Warnings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ---------------- SUMMARY METRIC CARDS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isLowStockCard = card.title.includes('Low Stock');
          return (
            <div
              key={idx}
              onClick={() => {
                if (isLowStockCard) setShowLowStockModal(true);
              }}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group ${
                isLowStockCard ? 'cursor-pointer hover:border-red-500/50' : ''
              }`}
            >
              <div className="space-y-1.5 text-left">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors flex items-center gap-1">
                  <span>{card.title}</span>
                  {isLowStockCard && <span className="text-[10px] text-red-500 font-bold">(Click to view)</span>}
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
                    <p className="text-slate-555 dark:text-slate-400">{act.details}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 self-center" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ---------------- LOW STOCK BREAKDOWN MODAL ---------------- */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 text-left relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Low Stock Inventory Warnings</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Items below minimum safety thresholds ({summary.lowStockAlerts || 0} items)</p>
                </div>
              </div>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {(!summary.lowStockItemsList || summary.lowStockItemsList.length === 0) ? (
                <div className="text-center py-8 space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">All Stock Levels Healthy!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">No raw materials or product inventories are currently below safety thresholds.</p>
                  </div>
                </div>
              ) : (
                summary.lowStockItemsList.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.type.includes('Raw') ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {item.type}
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-red-500 font-bold">Current Stock: {item.currentStock}</span>
                        <span className="text-slate-400">Min Threshold: {item.threshold}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowLowStockModal(false);
                        navigate(item.actionUrl);
                      }}
                      className="px-3 py-1.5 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm flex-shrink-0 cursor-pointer"
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
