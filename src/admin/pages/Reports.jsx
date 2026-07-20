import { useState } from 'react';
import { api } from '../api';
import { FileBarChart, Calendar, RefreshCw, FileText, Download, AlertCircle, Eye } from 'lucide-react';

export default function Reports({ isDarkMode }) {
  const [reportType, setReportType] = useState('monthly-sales');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-20');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const data = await api.reports.getReport(reportType, startDate, endDate);
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate requested report dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.reportData.length === 0) return;
    
    const rows = reportData.reportData;
    const headers = Object.keys(rows[0]);
    
    // Map headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const cell = row[header] === undefined || row[header] === null ? '' : String(row[header]);
        // escape double quotes
        return `"${cell.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Gandham_Spices_${reportType}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-body text-left">
      
      {/* ---------------- CONFIGURATOR PANELS ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 border-b pb-2">
          <FileBarChart className="w-5 h-5 text-saffron" />
          <span>Generate Business Audits & Reports</span>
        </h3>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="report-type-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Audit Report Type *</label>
            <select
              id="report-type-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
            >
              <option value="today-sales">Today's Sales</option>
              <option value="weekly-sales">Weekly Sales Summary</option>
              <option value="monthly-sales">Monthly Sales Ledger</option>
              <option value="yearly-sales">Yearly Sales Audit</option>
              <option value="revenue">Product Revenue Breakdown</option>
              <option value="profit">Revenue & Profit Margins</option>
              <option value="production">Production Batches Log</option>
              <option value="inventory">Raw Material Stock Audit</option>
              <option value="delivery">Delivery Dispatch History</option>
              <option value="customer">Customer Outstanding Dues</option>
              <option value="pending-payments">Overdue Payment Reminders</option>
              <option value="expense">Operating Expense Ledger</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-start-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Start Date *</label>
            <input
              id="report-start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="report-end-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">End Date *</label>
            <input
              id="report-end-date-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-saffron hover:bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            <span>Compile Report</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- PREVIEW & EXPORT CONTAINER ---------------- */}
      {reportData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-6">
          
          <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800 flex-wrap gap-4">
            <div>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white tracking-tight">{reportData.title}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Audit scope date range: {reportData.dateRange}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold rounded-xl shadow transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Aggregations cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(reportData.summary).map(([key, val]) => (
              <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{key}</span>
                <p className="text-sm font-black text-slate-800 dark:text-white">{val}</p>
              </div>
            ))}
          </div>

          {/* Grid Preview Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  {reportData.reportData.length > 0 && Object.keys(reportData.reportData[0]).map((h) => (
                    <th key={h} className="py-2.5 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.reportData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-10 text-center text-slate-500 dark:text-slate-400">
                      No records matched the selected parameters.
                    </td>
                  </tr>
                ) : (
                  reportData.reportData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 last:border-b-0 hover:bg-slate-100/10">
                      {Object.values(row).map((val, cellIdx) => (
                        <td key={cellIdx} className="py-3 px-2 font-medium">{String(val)}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ---------------- PRINT LAYOUT OVERLAY (Guarded by @media print CSS styles in index.css) ---------------- */}
          <div className="hidden print:block print:bg-white print:text-black print:p-8 print:w-full print:min-h-screen text-xs text-left leading-normal space-y-6">
            
            {/* Report Header Logo */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black font-display text-orange-600">Gandham Spices</h1>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Premium Small-Batch Spices & Blends</p>
                <p className="text-[9px] text-slate-400">Brahmavar, Udupi, Karnataka, India</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold uppercase">{reportData.title}</h2>
                <p className="text-[10px] text-slate-500 font-medium">Date Scope: {reportData.dateRange}</p>
                <p className="text-[9px] text-slate-400">Report Gen Date: {new Date('2026-07-20').toLocaleString()}</p>
              </div>
            </div>

            {/* Aggregations summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(reportData.summary).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">{key}</span>
                  <p className="text-xs font-black text-slate-800 mt-1">{val}</p>
                </div>
              ))}
            </div>

            {/* Print Data Table */}
            <table className="w-full text-[10px] text-left border-collapse mt-4">
              <thead>
                <tr className="border-b-2 border-slate-800 font-bold uppercase">
                  {reportData.reportData.length > 0 && Object.keys(reportData.reportData[0]).map((h) => (
                    <th key={h} className="py-2 px-1 text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.reportData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    {Object.values(row).map((val, cellIdx) => (
                      <td key={cellIdx} className="py-2 px-1 text-slate-800">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Print Footer */}
            <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between text-[9px] text-slate-400 font-semibold">
              <span>Gandham Spices Administration Audit Logs</span>
              <span>Confidential — Internal Board Registry Only</span>
              <span>Page 1 of 1</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
