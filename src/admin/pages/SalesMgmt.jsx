import { useState, useEffect } from 'react';
import { api } from '../api';
import { Receipt, Plus, Trash2, AlertCircle, CheckCircle2, DollarSign, RefreshCw, ShoppingCart, Loader } from 'lucide-react';

export default function SalesMgmt() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Flat Transaction Ledger Form State
  const [date, setDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantityGiven, setQuantityGiven] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [amountReceived, setAmountReceived] = useState('0');
  const [paymentDate, setPaymentDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const sData = await api.sales.getAll();
      setSales(sData.sort((a,b) => b.date.localeCompare(a.date)));

      const cData = await api.customers.getAll();
      setCustomers(cData);

      const pData = await api.products.getAll();
      setProducts(pData);

      const bData = await api.batches.getAll();
      setBatches(bData);
    } catch (err) {
      setError('Failed to fetch sales database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!date) {
      setError('Please select a Transaction Date');
      return;
    }
    if (!customerId) {
      setError('Please select a Buyer Shop / Customer');
      return;
    }
    if (!productId) {
      setError('Please select a Product');
      return;
    }
    if (!batchId) {
      setError('Please select a Production Batch');
      return;
    }
    if (!quantityGiven || parseInt(quantityGiven, 15) <= 0) {
      setError('Please provide a valid quantity given');
      return;
    }

    const qty = parseInt(quantityGiven, 10);
    const selectedBatch = batches.find(b => b.id === batchId);
    if (selectedBatch && selectedBatch.remainingStock < qty) {
      setError(`Requested quantity (${qty}) exceeds selected batch remaining stock (${selectedBatch.remainingStock})`);
      return;
    }

    setSubmitting(true);
    try {
      const salePayload = {
        date,
        customerId,
        productId,
        batchId,
        quantityGiven: qty,
        amountReceived: parseFloat(amountReceived || 0),
        paymentStatus,
        paymentDate,
        remarks
      };

      await api.sales.create(salePayload);
      setSuccess('Transaction recorded in sales ledger. Finished stock updated.');
      
      // Reset Form
      setProductId('');
      setBatchId('');
      setQuantityGiven('');
      setAmountReceived('0');
      setPaymentDate('');
      setRemarks('');

      // Reload lists
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales transaction? This will reverse stock and outstanding dues.')) return;
    setError('');
    setSuccess('');
    try {
      await api.sales.delete(id);
      setSuccess('Transaction deleted from ledger.');
      loadData();
    } catch (err) {
      setError('Failed to delete sales record');
    }
  };

  // Real-time pricing derivation
  const selectedProduct = products.find(p => p.id === productId);
  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedBatchObj = batches.find(b => b.id === batchId);

  const mrpVal = selectedProduct ? selectedProduct.mrp : 0;
  const wholesaleVal = selectedProduct ? selectedProduct.wholesalePrice : 0;
  const qtyVal = parseInt(quantityGiven, 10) || 0;
  const receivableVal = parseFloat((qtyVal * wholesaleVal).toFixed(2));
  const receivedVal = parseFloat(amountReceived) || 0;
  const balanceVal = parseFloat((receivableVal - receivedVal).toFixed(2));

  // Sync payment status when balance changes
  useEffect(() => {
    if (balanceVal <= 0 && receivableVal > 0) {
      setPaymentStatus('Paid');
    } else {
      setPaymentStatus('Pending');
    }
  }, [balanceVal, receivableVal]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body text-left">
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* ---------------- RECORD SALES LEDGER FORM ---------------- */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <ShoppingCart className="w-5 h-5 text-saffron" />
            <span>Record Sales Ledger Transaction</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sales-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Supply Date *</label>
                <input
                  id="sales-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>
              <div>
                <label htmlFor="sales-cust-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Shop / Retailer Profile *</label>
                <select
                  id="sales-cust-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                >
                  <option value="">Select buyer shop</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.shopName}{c.contactName ? ` (${c.contactName})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sales-product-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Select Product *</label>
                <select
                  id="sales-product-select"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                >
                  <option value="">Select product item</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sales-batch-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Select Production Batch *</label>
                <select
                  id="sales-batch-select"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  disabled={!productId}
                >
                  <option value="">Choose batch source</option>
                  {batches.filter(b => b.productId === productId).map(b => (
                    <option key={b.id} value={b.id}>{b.batchNumber} (Avail: {b.remainingStock} packs)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sales-quantity-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Quantity Given (packets) *</label>
                <input
                  id="sales-quantity-input"
                  type="number"
                  placeholder="Total units supplied"
                  value={quantityGiven}
                  onChange={(e) => setQuantityGiven(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>
              <div>
                <label htmlFor="sales-received-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Amount Received (₹)</label>
                <input
                  id="sales-received-input"
                  type="number"
                  step="0.01"
                  placeholder="Cash/UPI collected"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>
            </div>

            {/* Read-Only pricing parameters */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>MRP Price:</span>
                <span>₹{mrpVal} / pack</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Wholesale Trade Price:</span>
                <span>₹{wholesaleVal} / pack</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold border-t dark:border-slate-800 pt-1.5">
                <span>Total Amount Receivable:</span>
                <span>₹{receivableVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Paid Today:</span>
                <span className="text-emerald-500 font-semibold">₹{receivedVal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-800 dark:text-white border-t dark:border-slate-800 pt-2">
                <span>Balance Dues (Outstanding):</span>
                <span className={balanceVal > 0 ? 'text-red-500' : 'text-slate-500'}>₹{balanceVal.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="payment-status-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Payment Status</label>
                <select
                  id="payment-status-select"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  disabled={balanceVal <= 0}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label htmlFor="payment-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Payment Clearance Date (Optional)</label>
                <input
                  id="payment-date-input"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="invoice-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Remarks / Remarks</label>
              <textarea
                id="invoice-notes-input"
                placeholder="Dispatched via truck, payment remarks, credit periods..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows="2"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-saffron to-orange-500 hover:from-orange-500 hover:to-terracotta text-white font-bold rounded-2xl shadow active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Recording ledger entry...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Log Sales Ledger Transaction</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* ---------------- LEDGER FEED (COL 2) ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-full min-h-[450px]">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <Receipt className="w-5 h-5 text-saffron" />
            <span>Sales & Inventory Ledger Feed</span>
          </h3>

          <div className="overflow-y-auto flex-1 text-left space-y-3.5 pr-1">
            {sales.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No ledger transactions recorded yet.
              </div>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-black text-saffron">{sale.shopName}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{sale.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm block">₹{sale.totalAmountReceivable}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        sale.balanceAmount > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {sale.balanceAmount > 0 ? `Unpaid: ₹${sale.balanceAmount}` : 'Paid'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/50 flex justify-between text-slate-500 font-semibold">
                    <span>{sale.productName} ({sale.quantityGiven} packs @ batch {sale.batchNumber})</span>
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 p-1 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {sale.remarks && (
                    <div className="text-[10px] italic text-slate-400 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg mt-1 leading-normal">
                      Note: {sale.remarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
