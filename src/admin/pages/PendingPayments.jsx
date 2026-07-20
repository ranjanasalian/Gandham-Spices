import { useState, useEffect } from 'react';
import { api } from '../api';
import { CircleDollarSign, Plus, AlertCircle, CheckCircle2, DollarSign, RefreshCw, Calendar, Loader } from 'lucide-react';

export default function PendingPayments() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment collection modal form
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const ppData = await api.pendingPayments.getAll();
      setPendingPayments(ppData);
      
      const cData = await api.customers.getAll();
      setCustomers(cData);
    } catch (err) {
      setError('Failed to fetch pending payment ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayClick = (pp) => {
    setSelectedPayment(pp);
    setPaymentAmount(pp.pendingAmount);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPayment || !paymentAmount) return;

    const amountToPay = parseFloat(paymentAmount);
    if (amountToPay <= 0 || amountToPay > selectedPayment.pendingAmount) {
      setError('Please provide a valid collection amount (between 0 and current pending balance)');
      return;
    }

    setPaying(true);
    try {
      await api.pendingPayments.pay(selectedPayment.id, amountToPay);
      setSuccess(`Collected ₹${amountToPay} for invoice ${selectedPayment.invoiceNumber}. Dues updated.`);
      setSelectedPayment(null);
      setPaymentAmount('');
      loadData();
    } catch (err) {
      setError('Failed to apply payment collection');
    } finally {
      setPaying(false);
    }
  };

  // Helper baseline is 2026-07-20
  const isOverdue = (dateStr) => {
    return new Date(dateStr) < new Date('2026-07-20');
  };

  // Calculation summaries
  const calculatePendingSum = () => {
    return pendingPayments.filter(p => p.status === 'Pending').reduce((acc, p) => acc + p.pendingAmount, 0);
  };

  const calculateOverdueSum = () => {
    return pendingPayments
      .filter(p => p.status === 'Pending' && isOverdue(p.dueDate))
      .reduce((acc, p) => acc + p.pendingAmount, 0);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  const activeDues = pendingPayments.filter(p => p.status === 'Pending');

  return (
    <div className="space-y-6 font-body text-left">
      
      {/* ---------------- FINANCIAL SUMMARY TILES ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Pending Collections</p>
            <h3 className="text-2xl font-black mt-1 text-yellow-500">₹{calculatePendingSum().toFixed(2)}</h3>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">{activeDues.length} invoices awaiting payment</span>
          </div>
          <div className="p-3.5 bg-yellow-500/10 text-yellow-550 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Overdue Dues</p>
            <h3 className="text-2xl font-black mt-1 text-red-500">₹{calculateOverdueSum().toFixed(2)}</h3>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">Requires immediate collections</span>
          </div>
          <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notice:</span>
          <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Invoices are configured with a default 10-day credit period. Invoices past their due dates are automatically flagged as OVERDUE.
          </p>
        </div>

      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ---------------- COLLECTION DIALOG MODAL ---------------- */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedPayment(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm z-10 shadow-2xl animate-fade-in-up text-xs space-y-4">
            <h3 className="text-base font-bold border-b pb-2 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-saffron" />
              <span>Record Payment Collection</span>
            </h3>

            <div className="space-y-1">
              <span className="font-semibold text-slate-500">Invoice Reference:</span>
              <p className="font-bold text-saffron">{selectedPayment.invoiceNumber}</p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-500">Buyer Shop:</span>
              <p className="font-bold">{customers.find(c => c.id === selectedPayment.customerId)?.shopName}</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
              <div>
                <label htmlFor="collection-amount-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Collection Amount Received (₹) *</label>
                <input
                  id="collection-amount-input"
                  type="number"
                  step="0.01"
                  max={selectedPayment.pendingAmount}
                  placeholder={`Max ₹${selectedPayment.pendingAmount}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 bg-saffron text-white rounded-xl font-bold hover:bg-orange-500 flex items-center gap-1.5"
                >
                  {paying ? <Loader className="w-4 h-4 animate-spin" /> : 'Log Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- PENDING PAYMENTS LEDGER ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden">
        <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
          <CircleDollarSign className="w-5 h-5 text-saffron" />
          <span>Pending Payments Ledger</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Invoice #</th>
                <th className="py-3 px-2">Shop / Client</th>
                <th className="py-3 px-2 text-right">Invoice Total</th>
                <th className="py-3 px-2 text-right">Amount Paid</th>
                <th className="py-3 px-2 text-right">Outstanding Dues</th>
                <th className="py-3 px-2 text-center">Payment Due Date</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map((pp) => {
                const cust = customers.find(c => c.id === pp.customerId);
                const overdue = pp.status === 'Pending' && isOverdue(pp.dueDate);
                return (
                  <tr
                    key={pp.id}
                    className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors ${
                      overdue ? 'bg-red-500/5 dark:bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-2 font-bold text-saffron">{pp.invoiceNumber}</td>
                    <td className="py-3 px-2 font-semibold text-slate-800 dark:text-white">{cust ? cust.shopName : 'Direct Customer'}</td>
                    <td className="py-3 px-2 text-right font-bold">₹{pp.totalAmount}</td>
                    <td className="py-3 px-2 text-right font-medium text-emerald-500">₹{pp.amountPaid}</td>
                    <td className={`py-3 px-2 text-right font-black ${pp.pendingAmount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      ₹{pp.pendingAmount}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-semibold">
                      <span className="flex items-center justify-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pp.dueDate}</span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        pp.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : overdue
                            ? 'bg-red-500/10 text-red-500 animate-pulse'
                            : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {pp.status === 'Paid' ? 'Paid' : overdue ? 'OVERDUE' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {pp.status === 'Pending' ? (
                        <button
                          onClick={() => handlePayClick(pp)}
                          className="px-3 py-1 bg-saffron hover:bg-orange-500 text-white font-bold text-[10px] rounded-lg transition-colors"
                        >
                          Collect
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
