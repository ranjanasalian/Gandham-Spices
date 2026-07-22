import { useState, useEffect } from 'react';
import { api } from '../api';
import { Truck, Plus, AlertCircle, CheckCircle2, RefreshCw, Clock, ArrowRight, Search, X } from 'lucide-react';

export default function DeliveryMgmt() {
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [editorOpen, setEditorOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('2026-07-20');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const dData = await api.deliveries.getAll();
      setDeliveries(dData.sort((a,b) => b.deliveryDate.localeCompare(a.deliveryDate)));

      const cData = await api.customers.getAll();
      setCustomers(cData);

      const pData = await api.products.getAll();
      setProducts(pData);

      const bData = await api.batches.getAll();
      setBatches(bData);
    } catch (err) {
      setError('Failed to fetch shipping logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Autofill pricing when product changes
  useEffect(() => {
    if (productId) {
      const prod = products.find(p => p.id === productId);
      if (prod) {
        setWholesalePrice(prod.wholesalePrice);
      }
    }
  }, [productId, products]);

  const handleStatusChange = async (id, status) => {
    setError('');
    setSuccess('');
    try {
      await api.deliveries.update(id, { status });
      setSuccess(`Delivery status updated to ${status}.`);
      
      const dData = await api.deliveries.getAll();
      setDeliveries(dData.sort((a,b) => b.deliveryDate.localeCompare(a.deliveryDate)));
    } catch (err) {
      setError('Failed to update delivery status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerId || !productId || !quantity || !wholesalePrice || !deliveredBy) {
      setError('Please provide client, product, quantity, pricing, and driver details');
      return;
    }

    try {
      const batch = batches.find(b => b.id === batchId);
      const deliveryPayload = {
        customerId,
        productId,
        batchId,
        batchNumber: batch ? batch.batchNumber : '',
        quantity: parseInt(quantity, 10),
        wholesalePrice: parseFloat(wholesalePrice),
        deliveredBy,
        deliveryDate,
        notes
      };

      await api.deliveries.create(deliveryPayload);
      setSuccess('Shipment order recorded in database!');
      setEditorOpen(false);

      // Reset Form
      setCustomerId('');
      setProductId('');
      setBatchId('');
      setQuantity('');
      setWholesalePrice('');
      setDeliveredBy('');
      setNotes('');

      // Reload
      const dData = await api.deliveries.getAll();
      setDeliveries(dData.sort((a,b) => b.deliveryDate.localeCompare(a.deliveryDate)));
    } catch (err) {
      setError('Failed to record dispatch');
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
    <div className="space-y-6 font-body text-left">
      
      {/* ---------------- TITLE HEADER ---------------- */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6 text-saffron" />
          <span>Delivery & Dispatch Logistics</span>
        </h3>
        <button
          onClick={() => setEditorOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Dispatch</span>
        </button>
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

      {/* ---------------- FORM MODAL (ADD) ---------------- */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setEditorOpen(false)} />
          <div className="relative z-10 flex min-h-full w-full items-start justify-center p-4 text-center">
            <div className="relative my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg text-left shadow-2xl animate-fade-in-up text-xs z-10">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
              <Truck className="w-5 h-5 text-saffron" />
              <span>Configure Shipment Order</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="delivery-cust-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Target Client / Shop *</label>
                <select
                  id="delivery-cust-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                >
                  <option value="">Select client outlet</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.shopName}{c.contactName ? ` (${c.contactName})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="delivery-prod-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Spice Product *</label>
                  <select
                    id="delivery-prod-select"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="delivery-batch-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Production Batch Link</label>
                  <select
                    id="delivery-batch-select"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">Select batch number</option>
                    {batches.filter(b => b.productId === productId).map(b => (
                      <option key={b.id} value={b.id}>{b.batchNumber} (Avail: {b.remainingStock})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="delivery-qty-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Quantity Shipped *</label>
                  <input
                    id="delivery-qty-input"
                    type="number"
                    placeholder="Total packets"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="delivery-wholesale-price-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Wholesale Price (₹) *</label>
                  <input
                    id="delivery-wholesale-price-input"
                    type="number"
                    step="0.01"
                    placeholder="Wholesale rate"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="delivery-person-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Delivered By *</label>
                  <input
                    id="delivery-person-input"
                    type="text"
                    placeholder="Logistics driver name"
                    value={deliveredBy}
                    onChange={(e) => setDeliveredBy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="delivery-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Shipment Date *</label>
                  <input
                    id="delivery-date-input"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl flex justify-between items-center font-bold">
                <span className="text-slate-500">Total shipment valuation:</span>
                <span className="text-saffron text-sm">₹{((parseInt(quantity, 10) || 0) * (parseFloat(wholesalePrice) || 0)).toFixed(2)}</span>
              </div>

              <div>
                <label htmlFor="delivery-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Logistics Notes</label>
                <textarea
                  id="delivery-notes-input"
                  placeholder="Gate details, recipient phone contact..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saffron text-white rounded-xl font-bold hover:bg-orange-500"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* ---------------- DELIVERIES LOG TABLE ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
          <h4 className="font-bold text-sm text-slate-750 dark:text-slate-300">Dispatch & Delivery Records</h4>
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 pl-8 pr-8 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-saffron"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Outlet Shop</th>
                <th className="py-3 px-2">Product Name</th>
                <th className="py-3 px-2">Batch #</th>
                <th className="py-3 px-2 text-center">Quantity</th>
                <th className="py-3 px-2 text-right">Wholesale Rate</th>
                <th className="py-3 px-2 text-right">Total Dues</th>
                <th className="py-3 px-2 text-center">Driver</th>
                <th className="py-3 px-2 text-center">Logistics status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">
                    No active dispatches logged yet. Click "Log New Dispatch" to dispatch orders.
                  </td>
                </tr>
              ) : deliveries.filter(d => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  const cust = customers.find(c => c.id === d.customerId);
                  const prod = products.find(p => p.id === d.productId);
                  const custName = cust ? cust.shopName.toLowerCase() : '';
                  const prodName = prod ? prod.name.toLowerCase() : '';
                  const batch = (d.batchNumber || '').toLowerCase();
                  const driver = (d.deliveredBy || '').toLowerCase();
                  const date = (d.deliveryDate || '').toLowerCase();
                  return custName.includes(term) || prodName.includes(term) || batch.includes(term) || driver.includes(term) || date.includes(term);
                }).length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">
                    No records match your search criteria.
                  </td>
                </tr>
              ) : (
                deliveries.filter(d => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  const cust = customers.find(c => c.id === d.customerId);
                  const prod = products.find(p => p.id === d.productId);
                  const custName = cust ? cust.shopName.toLowerCase() : '';
                  const prodName = prod ? prod.name.toLowerCase() : '';
                  const batch = (d.batchNumber || '').toLowerCase();
                  const driver = (d.deliveredBy || '').toLowerCase();
                  const date = (d.deliveryDate || '').toLowerCase();
                  return custName.includes(term) || prodName.includes(term) || batch.includes(term) || driver.includes(term) || date.includes(term);
                }).map((d) => {
                const cust = customers.find(c => c.id === d.customerId);
                const prod = products.find(p => p.id === d.productId);
                return (
                  <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                    <td className="py-3 px-2 font-semibold">{d.deliveryDate}</td>
                    <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{cust ? cust.shopName : 'Direct Customer'}</td>
                    <td className="py-3 px-2 font-medium">{prod ? prod.name : 'Unknown Product'}</td>
                    <td className="py-3 px-2 font-mono font-bold text-saffron">{d.batchNumber || '—'}</td>
                    <td className="py-3 px-2 text-center font-bold">{d.quantity}</td>
                    <td className="py-3 px-2 text-right">₹{d.wholesalePrice}</td>
                    <td className="py-3 px-2 text-right font-black">₹{d.totalAmount}</td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-500">{d.deliveredBy}</td>
                    <td className="py-3 px-2 text-center">
                      <select
                        aria-label="Logistic status selection"
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          d.status === 'Delivered'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : d.status === 'Dispatched'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse'
                              : d.status === 'Cancelled'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
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
