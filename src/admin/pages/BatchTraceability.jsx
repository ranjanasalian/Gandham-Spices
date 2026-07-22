import { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Calendar, DollarSign, Package, AlertTriangle, FileSpreadsheet, Store, Eye, RefreshCw } from 'lucide-react';

export default function BatchTraceability() {
  const [query, setQuery] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);

  useEffect(() => {
    api.batches.getAll()
      .then(data => setAvailableBatches(data || []))
      .catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setTraceData(null);
    try {
      const data = await api.batches.trace(query.trim());
      setTraceData(data);
    } catch (err) {
      setError(err.message || 'Batch not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = async (num) => {
    setQuery(num);
    setLoading(true);
    setError('');
    setTraceData(null);
    try {
      const data = await api.batches.trace(num);
      setTraceData(data);
    } catch (err) {
      setError(err.message || `Batch ${num} not found.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-body text-left">
      
      {/* ---------------- SEARCH BAR HEADER ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center space-y-4">
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Batch Traceability Tracker</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter or select a production batch number to audit its ingredients, manufacturing details, sales, and retail ledger.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto relative flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron text-sm text-center font-black uppercase tracking-wider"
              placeholder="e.g. Batch 1, RP01, BM01"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-saffron hover:bg-orange-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Audit'}
          </button>
        </form>

        <div className="flex flex-wrap justify-center items-center gap-2 text-xs pt-1">
          <span className="text-slate-400 font-semibold">Select Active Batch:</span>
          {availableBatches.length === 0 ? (
            <span className="text-slate-500 italic text-[11px]">No production batches registered yet</span>
          ) : (
            availableBatches.map((b) => {
              const label = b.batchNumber || b.batchCode || b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleExampleClick(label)}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white dark:hover:bg-saffron rounded-lg font-black transition-all text-saffron text-[10px]"
                >
                  {label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs max-w-md mx-auto">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- AUDIT RESULTS PANEL ---------------- */}
      {traceData && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Main Info Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Batch Manufacturing Metrics */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-4">
              <h4 className="font-black border-b pb-2 flex items-center gap-2 text-saffron uppercase tracking-wider">
                <Package className="w-4 h-4" />
                <span>Production Metrics</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Batch Number:</span>
                  <span className="font-bold text-saffron">{traceData.batch.batchNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Product Name:</span>
                  <span className="font-semibold text-right">{traceData.product?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                  <span className="text-slate-500">MFG Date:</span>
                  <span className="font-semibold">{traceData.batch.manufacturingDate}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Best Before:</span>
                  <span className="font-semibold">{traceData.batch.bestBeforeDate}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Packets Produced:</span>
                  <span className="font-bold">{traceData.batch.packetsProduced} packs</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Cost Per Packet:</span>
                  <span className="font-bold">₹{traceData.batch.costPerPacket}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Stock:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-lg ${traceData.batch.remainingStock === 0 ? 'bg-red-500/10 text-red-500' : 'bg-saffron/10 text-saffron'}`}>
                    {traceData.batch.remainingStock} packs
                  </span>
                </div>
              </div>
            </div>

            {/* Ingredients Audit Tree */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-4">
              <h4 className="font-black border-b pb-2 flex items-center gap-2 text-saffron uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ingredients consumed</span>
              </h4>
              <div className="space-y-3">
                {traceData.ingredientsUsed.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/45 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold">{ing.name}</span>
                    <span className="font-black text-slate-600 dark:text-slate-300">{ing.quantityTotal} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Financial Overview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-4">
              <h4 className="font-black border-b pb-2 flex items-center gap-2 text-saffron uppercase tracking-wider">
                <DollarSign className="w-4 h-4" />
                <span>Financial Dividends</span>
              </h4>
              <div className="space-y-3">
                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold">Total Revenue</p>
                    <h5 className="text-base font-black mt-0.5 text-amber-500">₹{traceData.financials.revenueGenerated}</h5>
                  </div>
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold">Gross Profit</p>
                    <h5 className="text-base font-black mt-0.5 text-emerald-500">₹{traceData.financials.profitGenerated}</h5>
                  </div>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold">Remaining Asset Value</p>
                    <h5 className="text-base font-black mt-0.5 text-indigo-500">₹{traceData.financials.remainingStockValue}</h5>
                  </div>
                  <Package className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Retailers Supplied */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-4">
              <h4 className="font-black border-b pb-2 flex items-center gap-2 text-saffron uppercase tracking-wider">
                <Store className="w-4 h-4" />
                <span>Retail Outlets Supplied</span>
              </h4>
              <div className="space-y-2">
                {traceData.shopsSupplied.length === 0 ? (
                  <p className="text-slate-500 py-6 text-center">No retail outlets supplied yet.</p>
                ) : (
                  traceData.shopsSupplied.map((shop, i) => (
                    <div key={i} className="flex gap-2.5 items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-2 h-2 rounded-full bg-saffron" />
                      <span className="font-bold">{shop}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sales ledger */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-4 flex flex-col h-full min-h-[250px]">
              <h4 className="font-black border-b pb-2 flex items-center gap-2 text-saffron uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Batch Sales Ledger Audit</span>
              </h4>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2 px-1">Invoice #</th>
                      <th className="py-2 px-1">Date</th>
                      <th className="py-2 px-1">Shop / Customer</th>
                      <th className="py-2 px-1 text-center">Qty Sold</th>
                      <th className="py-2 px-1 text-right">Revenue</th>
                      <th className="py-2 px-1 text-right text-emerald-500">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traceData.salesHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 dark:text-slate-400">No sale transactions recorded for this batch.</td>
                      </tr>
                    ) : (
                      traceData.salesHistory.map((s, i) => (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800 last:border-b-0 hover:bg-slate-100/10">
                          <td className="py-2.5 px-1 font-bold text-saffron">{s.invoiceNumber}</td>
                          <td className="py-2.5 px-1">{s.date}</td>
                          <td className="py-2.5 px-1 font-semibold">{s.customerName}</td>
                          <td className="py-2.5 px-1 text-center font-bold">{s.quantity}</td>
                          <td className="py-2.5 px-1 text-right font-black">₹{s.revenue}</td>
                          <td className="py-2.5 px-1 text-right font-black text-emerald-500">₹{s.profit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
