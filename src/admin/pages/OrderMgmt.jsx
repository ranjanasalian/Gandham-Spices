import { useState, useEffect } from 'react';
import { api } from '../api';
import { ArrowRightLeft, ArrowRight, Clock, FileSpreadsheet, RefreshCw, ChevronRight, Plus, X, Package, CheckCircle2, AlertCircle, Truck } from 'lucide-react';

export default function OrderMgmt() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Order Creation Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Processing');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const oData = await api.orders.getAll();
      setOrders(oData);
      const cData = await api.customers.getAll();
      setCustomers(cData);
      const pData = await api.products.getAll();
      setProducts(pData);
    } catch (err) {
      setError('Failed to fetch order archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pipelineStages = ['New Order', 'Processing', 'Packed', 'Dispatched', 'Delivered', 'Paid'];

  const handleStageShift = async (id, currentStage) => {
    const nextIdx = pipelineStages.indexOf(currentStage) + 1;
    if (nextIdx >= pipelineStages.length) return;

    setError('');
    setSuccess('');
    const nextStage = pipelineStages[nextIdx];
    
    try {
      await api.orders.update(id, { status: nextStage });
      setSuccess(`Order updated to: ${nextStage} (synced with Delivery Management)`);
      loadData();
    } catch (err) {
      setError('Failed to shift order stage');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerId || !productId || !quantity) {
      setError('Please select customer, product, and quantity');
      return;
    }

    try {
      const prod = products.find(p => p.id === productId);
      await api.orders.create({
        customerId,
        productId,
        quantity: parseInt(quantity, 10),
        wholesalePrice: prod ? prod.wholesalePrice : 0,
        orderDate,
        status,
        notes
      });

      setSuccess('Order created and automatically synced to Delivery Management!');
      setModalOpen(false);
      setCustomerId('');
      setProductId('');
      setQuantity('10');
      setNotes('');
      loadData();
    } catch (err) {
      setError('Failed to create order');
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
      
      {/* ---------------- ALERTS ---------------- */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ---------------- PIPELINE HEADER & ACTIONS ---------------- */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-saffron" />
            <span>Order & Delivery Workflow Pipeline</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Integrated live with Delivery Management. Any order created or updated here automatically syncs with dispatches.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Order / Scheduled Dispatch</span>
        </button>
      </div>

      {/* ---------------- PIPELINE TRACKER BOARD ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageOrders = orders.filter(o => o.status === stage);
          return (
            <div
              key={stage}
              className="bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[420px] min-w-[170px]"
            >
              {/* Stage Header */}
              <div className="border-b pb-2 mb-3 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
                <span className="font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{stage}</span>
                <span className="text-[10px] bg-saffron/10 text-saffron px-2 py-0.5 rounded-full font-bold">{stageOrders.length}</span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 text-xs">
                {stageOrders.map((ord) => {
                  const cust = customers.find(c => c.id === ord.customerId);
                  const showShift = stage !== 'Paid';
                  return (
                    <div
                      key={ord.id}
                      className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-800 p-3 rounded-xl shadow-xs space-y-2 hover:shadow-sm transition-shadow text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-saffron">{ord.invoiceNumber}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{ord.orderDate ? ord.orderDate.substring(5) : ''}</span>
                      </div>
                      <div>
                        <p className="font-bold truncate" title={cust ? cust.shopName : ord.shopName}>{cust ? cust.shopName : (ord.shopName || 'Direct Customer')}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{ord.productName || 'Masala Packets'} x {ord.quantity || 0}</p>
                        {ord.totalAmount > 0 && <p className="text-[10px] text-emerald-600 font-bold">₹{ord.totalAmount.toFixed(2)}</p>}
                        {ord.notes && <p className="text-[9px] text-slate-400 italic mt-0.5 truncate" title={ord.notes}>{ord.notes}</p>}
                      </div>

                      {showShift && (
                        <button
                          onClick={() => handleStageShift(ord.id, ord.status)}
                          className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 px-2 bg-saffron/10 hover:bg-saffron text-saffron hover:text-white font-bold text-[10px] rounded-lg transition-colors border border-saffron/20 cursor-pointer"
                        >
                          <span>Progress</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- NEW ORDER MODAL ---------------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-saffron" />
                  <span>Create New Order & Dispatch</span>
                </h4>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Customer / Retail Shop *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-saffron"
                    required
                  >
                    <option value="">Select Retailer / Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.shopName} ({c.contactName})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Product Item *</label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-saffron"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Quantity (Packs) *</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-saffron"
                      placeholder="e.g. 20"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Dispatch / Order Date *</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-saffron"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Initial Order Pipeline Stage</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-saffron"
                    >
                      {pipelineStages.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Dispatch Notes / Instructions</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-saffron"
                    placeholder="e.g. Deliver before 4 PM to Lokesh Store"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-saffron hover:bg-orange-500 text-white font-bold rounded-xl shadow"
                  >
                    Save & Sync Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
