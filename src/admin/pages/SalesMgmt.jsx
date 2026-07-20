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

  // POS Billing Invoice Form State
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('2026-07-20');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { productId: '', batchId: '', quantity: '1', sellingPrice: '0', batchNumber: '', maxStock: 0 }
  ]);

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

  const handleAddItemRow = () => {
    setInvoiceItems(prev => [...prev, { productId: '', batchId: '', quantity: '1', sellingPrice: '0', batchNumber: '', maxStock: 0 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setInvoiceItems(prev => {
      const copy = [...prev];
      copy[idx][field] = val;

      if (field === 'productId') {
        const prod = products.find(p => p.id === val);
        const buyer = customers.find(c => c.id === customerId);
        
        // Auto set selling price based on customer type (Wholesale Price vs MRP)
        if (prod) {
          const isWholesale = buyer && buyer.customerType !== 'Direct Customer';
          copy[idx].sellingPrice = isWholesale ? prod.wholesalePrice : prod.mrp;
        }

        // Reset batch selection when product changes
        copy[idx].batchId = '';
        copy[idx].batchNumber = '';
        copy[idx].maxStock = 0;
      }

      if (field === 'batchId') {
        const bObj = batches.find(b => b.id === val);
        if (bObj) {
          copy[idx].batchNumber = bObj.batchNumber;
          copy[idx].maxStock = bObj.remainingStock;
        }
      }

      return copy;
    });
  };

  // Auto-recalculate prices if customer changes (resets prices to wholesale/retail matches)
  useEffect(() => {
    if (customerId) {
      setInvoiceItems(prev => {
        return prev.map(item => {
          if (!item.productId) return item;
          const prod = products.find(p => p.id === item.productId);
          const buyer = customers.find(c => c.id === customerId);
          if (prod) {
            const isWholesale = buyer && buyer.customerType !== 'Direct Customer';
            return {
              ...item,
              sellingPrice: isWholesale ? prod.wholesalePrice : prod.mrp
            };
          }
          return item;
        });
      });
    }
  }, [customerId, products, customers]);

  // Financial splits
  const calculateSubtotal = () => {
    return invoiceItems.reduce((acc, item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      const price = parseFloat(item.sellingPrice) || 0;
      return acc + qty * price;
    }, 0);
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const disc = parseFloat(discount) || 0;
    return Math.max(0, sub - disc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerId || invoiceItems.some(item => !item.productId || !item.batchId || !item.quantity)) {
      setError('Please configure client details and select product batch lines');
      return;
    }

    // Check stock boundaries
    const stockErrors = [];
    invoiceItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const qty = parseInt(item.quantity, 10);
      if (qty > item.maxStock) {
        stockErrors.push(`Requested quantity for ${prod?.name} (${qty}) exceeds batch stock (${item.maxStock})`);
      }
    });

    if (stockErrors.length > 0) {
      setError(stockErrors.join('. '));
      return;
    }

    setSubmitting(true);
    try {
      const salePayload = {
        customerId,
        date,
        discount: parseFloat(discount),
        paymentMethod,
        notes,
        items: invoiceItems.map(item => ({
          productId: item.productId,
          batchId: item.batchId,
          quantity: parseInt(item.quantity, 10),
          sellingPrice: parseFloat(item.sellingPrice)
        }))
      };

      await api.sales.create(salePayload);
      setSuccess('Invoice billing saved successfully! Inventory deducted.');
      
      // Reset POS Form
      setCustomerId('');
      setDiscount('0');
      setNotes('');
      setInvoiceItems([{ productId: '', batchId: '', quantity: '1', sellingPrice: '0', batchNumber: '', maxStock: 0 }]);

      // Reload lists
      const sData = await api.sales.getAll();
      setSales(sData.sort((a,b) => b.date.localeCompare(a.date)));
      const bData = await api.batches.getAll();
      setBatches(bData);
    } catch (err) {
      setError(err.message || 'Failed to save billing invoice');
    } finally {
      setSubmitting(false);
    }
  };

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
        
        {/* ---------------- POS BILLING FORM (COL 3) ---------------- */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <ShoppingCart className="w-5 h-5 text-saffron" />
            <span>Generate Commercial Invoice</span>
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
                <label htmlFor="sales-cust-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Client / Shop *</label>
                <select
                  id="sales-cust-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                >
                  <option value="">Select buyer profile</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.shopName} ({c.customerType})</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sales-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Invoice Date *</label>
                <input
                  id="sales-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-3">
              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Billing Itemized Lines *</label>
              
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        aria-label="POS product select"
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl focus:outline-none"
                      >
                        <option value="">Choose Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        aria-label="POS batch select"
                        value={item.batchId}
                        onChange={(e) => handleItemChange(idx, 'batchId', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl focus:outline-none"
                      >
                        <option value="">Select Batch</option>
                        {batches.filter(b => b.productId === item.productId).map(b => (
                          <option key={b.id} value={b.id}>{b.batchNumber} (Avail: {b.remainingStock})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Qty:</span>
                      <input
                        aria-label="POS item quantity"
                        type="number"
                        min="1"
                        placeholder="Packets"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-center focus:outline-none"
                      />
                      {item.batchId && (
                        <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[60px]">(Avail: {item.maxStock})</span>
                      )}
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Rate:</span>
                      <input
                        aria-label="POS item selling price"
                        type="number"
                        placeholder="Price"
                        value={item.sellingPrice}
                        onChange={(e) => handleItemChange(idx, 'sellingPrice', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-center focus:outline-none font-bold"
                      />
                    </div>

                    <div className="w-20 text-right font-black text-slate-700 dark:text-slate-300">
                      ₹{((parseInt(item.quantity, 10) || 0) * (parseFloat(item.sellingPrice) || 0)).toFixed(2)}
                    </div>

                    {invoiceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1.5 bg-saffron/10 text-saffron px-4 py-2 rounded-xl font-bold hover:bg-saffron/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="payment-method-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Payment Method *</label>
                <select
                  id="payment-method-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                >
                  <option value="UPI">UPI / Digital</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit / Ledger account</option>
                </select>
              </div>
              <div>
                <label htmlFor="flat-discount-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Flat Discount (₹)</label>
                <input
                  id="flat-discount-input"
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="invoice-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Invoice Notes</label>
              <textarea
                id="invoice-notes-input"
                placeholder="Credit terms, special references, dispatch coordinates..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
              />
            </div>

            {/* Calculations breakdown */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl space-y-2 text-xs leading-normal">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-bold">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-555">
                <span>Flat Discount Deductions:</span>
                <span className="font-bold text-red-500">- ₹{(parseFloat(discount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t dark:border-slate-800 pt-2 font-black text-sm text-slate-800 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-saffron">₹{calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-saffron to-orange-500 hover:from-orange-500 hover:to-terracotta text-white font-bold rounded-2xl shadow active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Deducting batch stock...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Finalize & Bill Invoice</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* ---------------- RECENT INVOICES LOG (COL 2) ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-full min-h-[450px]">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <Receipt className="w-5 h-5 text-saffron" />
            <span>Invoice Billing Archives</span>
          </h3>

          <div className="overflow-y-auto flex-1 text-left space-y-3.5 pr-1">
            {sales.map((sale) => {
              const cust = customers.find(c => c.id === sale.customerId);
              return (
                <div key={sale.id} className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-black text-saffron">{sale.invoiceNumber}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{sale.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm block">₹{sale.totalAmount}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{sale.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/50 flex justify-between text-slate-500 font-semibold">
                    <span>Buyer: {cust ? cust.shopName : 'Direct Buyer'}</span>
                    <span>{sale.items.reduce((acc, it) => acc + it.quantity, 0)} packs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
