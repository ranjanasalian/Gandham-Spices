import { useState, useEffect } from 'react';
import { api } from '../api';
import { FileText, Search, Printer, MessageSquare, RefreshCw, X, Receipt, CheckCircle2, Clock, DollarSign, Store, Calendar, ArrowRight } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.invoices.getAll();
      setInvoices(data);
    } catch (err) {
      setError('Failed to fetch invoice ledger history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const invNo = (inv.invoiceNumber || '').toLowerCase();
    const shop = (inv.customer?.shopName || inv.shopName || '').toLowerCase();
    const custName = (inv.customer?.contactName || inv.customer?.ownerName || '').toLowerCase();
    const date = (inv.date || '').toLowerCase();
    const status = (inv.paymentStatus || '').toLowerCase();
    const hasProduct = (inv.items || []).some(item => (item.productName || '').toLowerCase().includes(term));

    return invNo.includes(term) || shop.includes(term) || custName.includes(term) || date.includes(term) || status.includes(term) || hasProduct;
  });

  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
  const totalReceived = invoices.reduce((acc, inv) => acc + (inv.amountReceived || 0), 0);
  const totalPending = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body text-left">
      
      {/* ---------------- HEADER & ACTIONS ---------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <FileText className="w-6 h-6 text-saffron" />
            <span>Bill & Invoice History</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Auto-generated invoices for all recorded sales. Print, download PDF, or share directly via WhatsApp.
          </p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Invoices</span>
        </button>
      </div>

      {/* ---------------- METRIC CARDS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices Issued</span>
          <p className="text-xl font-black text-slate-800 dark:text-white">{invoices.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Invoiced</span>
          <p className="text-xl font-black text-saffron">₹{totalBilled.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Collected</span>
          <p className="text-xl font-black text-emerald-500">₹{totalReceived.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance Dues</span>
          <p className={`text-xl font-black ${totalPending > 0 ? 'text-red-500' : 'text-slate-400'}`}>₹{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {/* ---------------- SEARCH BAR ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by Invoice #, Shop Name, Customer, Date, Product Name, or Status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-200 p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* ---------------- INVOICE CARDS GRID ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center text-slate-400 text-xs">
            No invoices match your search criteria.
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = (inv.balanceAmount || 0) <= 0;
            const shopName = inv.customer?.shopName || inv.shopName || 'Retail Customer';
            const contactName = inv.customer?.contactName || inv.customer?.ownerName || '';

            return (
              <div
                key={inv.invoiceNumber}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-saffron tracking-wider block">#{inv.invoiceNumber}</span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">{shopName}</h4>
                      {contactName && <p className="text-[11px] text-slate-400 font-medium">Attn: {contactName}</p>}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'}`}>
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  {/* Items list preview */}
                  <div className="border-t border-b border-slate-100 dark:border-slate-800/80 py-2 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Items Purchased:</span>
                    {(inv.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>{item.productName} ({item.quantityGiven}x)</span>
                        <span className="font-semibold">₹{item.totalAmount ? item.totalAmount.toFixed(2) : (item.quantityGiven * item.wholesalePrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financials Breakdown */}
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>Date: {inv.date}</span>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Grand Total</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white">₹{(inv.subtotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="flex-1 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Bill</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                    title="Print / PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- INVOICE MODAL POPUP ---------------- */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
