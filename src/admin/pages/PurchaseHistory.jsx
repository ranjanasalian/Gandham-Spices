import { useState, useEffect } from 'react';
import { api } from '../api';
import { ShoppingBag, Plus, AlertCircle, CheckCircle2, RefreshCw, Trash2, Edit2 } from 'lucide-react';

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form & Editing States
  const [editId, setEditId] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [rawMaterialId, setRawMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');

  // Custom Deletion States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  const handleEditClick = (p) => {
    setEditId(p.id);
    setPurchaseDate(p.purchaseDate);
    setRawMaterialId(p.rawMaterialId);
    setQuantity(p.quantity.toString());
    setTotalCost(p.totalCost.toString());
    setSupplierName(p.supplierName || '');
    setNotes(p.notes || '');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setPurchaseDate('');
    setRawMaterialId('');
    setQuantity('');
    setTotalCost('');
    setSupplierName('');
    setNotes('');
    setError('');
    setSuccess('');
  };

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

      if (editId) {
        await api.ingredientPurchases.update(editId, payload);
        setSuccess('Purchase record updated successfully.');
      } else {
        await api.ingredientPurchases.create(payload);
        setSuccess('Purchase recorded successfully. Raw material stock updated.');
      }
      
      // Reset Form
      setPurchaseDate('');
      setRawMaterialId('');
      setQuantity('');
      setTotalCost('');
      setSupplierName('');
      setNotes('');
      setEditId(null);
      
      // Reload UI state without page refresh
      const pData = await api.ingredientPurchases.getAll();
      setPurchases(pData.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)));
    } catch (err) {
      setError(err.message || 'Failed to save purchase entry');
    }
  };

  const triggerDelete = (id) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    setError('');
    setSuccess('');
    try {
      await api.ingredientPurchases.delete(itemToDelete);
      setSuccess('Purchase record deleted successfully.');
      loadData();
    } catch (err) {
      setError('Failed to delete purchase record');
    } finally {
      setItemToDelete(null);
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
            <span>{editId ? 'Modify Purchase Record' : 'Add Purchase Record'}</span>
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

            <div className="space-y-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-saffron to-orange-500 text-white font-bold rounded-2xl hover:shadow active:scale-[0.98]"
              >
                {editId ? 'Save Changes' : 'Record Ingredient Purchase'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 font-bold rounded-xl transition-all animate-fade-in"
                >
                  Cancel Edit
                </button>
              )}
            </div>
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
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
                        <td className="py-3 px-2 font-black text-slate-700 dark:text-slate-350">
                          {rm ? rm.name : 'Unknown Ingredient'}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {p.quantity} {rm ? rm.unit : ''}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-emerald-500">₹{p.totalCost}</td>
                        <td className="py-3 px-2">
                          <div className="font-semibold text-slate-700 dark:text-slate-350">{p.supplierName || '—'}</div>
                          <div className="text-[10px] text-slate-400">{p.notes}</div>
                        </td>
                        <td className="py-3 px-2 text-center flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl transition-colors"
                            title="Edit Purchase Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Delete Purchase Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ---------------- CUSTOM CONFIRM DELETE MODAL ---------------- */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm z-10 shadow-2xl animate-fade-in-up text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Confirm Deletion</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete this purchase record? This will adjust ingredient stock levels and revert associated expenses.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
