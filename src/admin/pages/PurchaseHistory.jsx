import { useState, useEffect } from 'react';
import { api } from '../api';
import { ShoppingBag, Plus, AlertCircle, CheckCircle2, DollarSign, RefreshCw, Trash2, PieChart } from 'lucide-react';

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [purchaseDate, setPurchaseDate] = useState('');
  const [rawMaterialId, setRawMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const pData = await api.ingredientPurchases.getAll();
      setPurchases(pData.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)));
      
      const rmData = await api.rawMaterials.getAll();
      setRawMaterials(rmData);
    } catch (err) {
      setError('Failed to fetch purchase ledger');
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

    if (!purchaseDate) {
      setError('Please select a Purchase Date');
      return;
    }
    if (!rawMaterialId) {
      setError('Please select an Ingredient');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please provide a valid quantity');
      return;
    }
    if (!totalCost || parseFloat(totalCost) <= 0) {
      setError('Please provide a valid total purchase cost');
      return;
    }

    try {
      const payload = {
        purchaseDate,
        rawMaterialId,
        quantity: parseFloat(quantity),
        totalCost: parseFloat(totalCost),
        supplierName,
        notes
      };

      await api.ingredientPurchases.create(payload);
      setSuccess('Purchase recorded successfully. Raw material stock updated.');
      
      // Reset Form
      setRawMaterialId('');
      setQuantity('');
      setTotalCost('');
      setSupplierName('');
      setNotes('');
      
      // Reload
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record purchase entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase record? This will adjust ingredient stock.')) return;
    setError('');
    setSuccess('');
    try {
      await api.ingredientPurchases.delete(id);
      setSuccess('Purchase record deleted.');
      loadData();
    } catch (err) {
      setError('Failed to delete purchase record');
    }
  };

  const calculateTotal = () => {
    return purchases.reduce((acc, p) => acc + p.totalCost, 0);
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
      
      {/* ---------------- OVERVIEW CARDS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Cost Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Total Raw Ingredient Investment</p>
            <h3 className="text-2xl font-black mt-1 text-saffron">₹{calculateTotal().toFixed(2)}</h3>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">{purchases.length} transactions recorded</span>
          </div>
          <div className="p-3.5 bg-saffron/10 text-saffron rounded-2xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm text-xs text-slate-500 dark:text-slate-400 font-medium">
          <p className="leading-relaxed">
            Record all raw spice and packaging purchases from the day you started your business. 
            All purchases will dynamically calculate the current stock in the <strong className="text-saffron">Raw Materials Inventory</strong> module.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ---------------- PURCHASE LOGGER FORM ---------------- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Plus className="w-5 h-5 text-saffron" />
            <span>Add Purchase Record</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

            <div>
              <label htmlFor="purchase-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Purchase Date *</label>
              <input
                id="purchase-date-input"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="purchase-material-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Select Ingredient / Pouch *</label>
              <select
                id="purchase-material-select"
                value={rawMaterialId}
                onChange={(e) => setRawMaterialId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
              >
                <option value="">Select ingredient type</option>
                {rawMaterials.map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchase-quantity-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Quantity Purchased *</label>
                <input
                  id="purchase-quantity-input"
                  type="number"
                  step="0.001"
                  placeholder="e.g. 5.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>
              <div>
                <label htmlFor="purchase-cost-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Total Purchase Cost (₹) *</label>
                <input
                  id="purchase-cost-input"
                  type="number"
                  step="0.01"
                  placeholder="Total price paid"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>
            </div>

            <div>
              <label htmlFor="purchase-supplier-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Supplier / Shop Name (Optional)</label>
              <input
                id="purchase-supplier-input"
                type="text"
                placeholder="e.g. APMC Market, City Spices Shop"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
              />
            </div>

            <div>
              <label htmlFor="purchase-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes (Optional)</label>
              <textarea
                id="purchase-notes-input"
                placeholder="Remarks, invoice details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-saffron to-orange-500 text-white font-bold rounded-2xl hover:shadow active:scale-[0.98]"
            >
              Record Ingredient Purchase
            </button>
          </form>
        </div>

        {/* ---------------- PURCHASE HISTORY LEDGER TABLE ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-full min-h-[400px]">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <ShoppingBag className="w-5 h-5 text-saffron" />
            <span>Purchased Spices Ledger</span>
          </h3>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Purchase Date</th>
                  <th className="py-3 px-2">Ingredient</th>
                  <th className="py-3 px-2 text-right">Quantity</th>
                  <th className="py-3 px-2 text-right">Total Cost</th>
                  <th className="py-3 px-2">Supplier / Notes</th>
                  <th className="py-3 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      No spice purchases logged. Enter data to start stock inventory.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => {
                    const rm = rawMaterials.find(m => m.id === p.rawMaterialId);
                    return (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                        <td className="py-3 px-2 font-semibold">{p.purchaseDate}</td>
                        <td className="py-3 px-2 font-black text-slate-700 dark:text-slate-300">
                          {rm ? rm.name : 'Unknown Ingredient'}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {p.quantity} {rm ? rm.unit : ''}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-emerald-500">₹{p.totalCost}</td>
                        <td className="py-3 px-2">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{p.supplierName || '—'}</div>
                          <div className="text-[10px] text-slate-400">{p.notes}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
