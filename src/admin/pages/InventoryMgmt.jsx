import { useState, useEffect } from 'react';
import { api } from '../api';
import { Archive, Plus, AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';

export default function InventoryMgmt() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemMinStock, setNewItemMinStock] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const rmData = await api.rawMaterials.getAll();
      setMaterials(rmData);
    } catch (err) {
      setError('Failed to load raw material inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newItemName || !newItemMinStock) {
      setError('Please provide item name and minimum level');
      return;
    }

    try {
      const item = {
        name: newItemName,
        unit: newItemUnit,
        minStockLevel: parseFloat(newItemMinStock)
      };

      await api.rawMaterials.create(item);
      setSuccess(`Raw material "${newItemName}" registered successfully.`);
      setNewItemName('');
      setNewItemMinStock('');
      
      const rmData = await api.rawMaterials.getAll();
      setMaterials(rmData);
    } catch (err) {
      setError('Failed to add new raw material type');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this raw material? All associated stock records will be removed.')) return;
    setError('');
    setSuccess('');
    try {
      await api.rawMaterials.delete(id);
      setSuccess('Raw material deleted from registry.');
      loadData();
    } catch (err) {
      setError('Failed to delete raw material type');
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
      
      {/* Notifications */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ---------------- REGISTRATION FORM ---------------- */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 mb-4 border-b pb-2">
              <Plus className="w-5 h-5 text-saffron" />
              <span>Register Raw Material</span>
            </h3>

            <form onSubmit={handleAddNewItem} className="space-y-4 text-xs">
              <div>
                <label htmlFor="new-item-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Material / Ingredient Name *</label>
                <input
                  id="new-item-name-input"
                  type="text"
                  placeholder="e.g. Red Chillies, Pepper, Pouches"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-item-unit-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Stock Unit *</label>
                  <select
                    id="new-item-unit-select"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="pcs">pcs (items)</option>
                    <option value="grams">grams</option>
                    <option value="litres">litres</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="new-item-min-stock-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Min Level Warning *</label>
                  <input
                    id="new-item-min-stock-input"
                    type="number"
                    step="0.001"
                    placeholder="e.g. 5"
                    value={newItemMinStock}
                    onChange={(e) => setNewItemMinStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-saffron to-orange-500 text-white font-bold rounded-2xl hover:shadow active:scale-[0.98]"
              >
                Register Item Type
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs text-slate-500 leading-relaxed">
            <h4 className="font-bold mb-2 text-slate-700 dark:text-slate-350">Inventory Stock Formulas</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Total Purchased</strong>: Derived from spice purchase history.</li>
              <li><strong>Total Used</strong>: Derived from logged production batches.</li>
              <li><strong>Remaining Stock</strong>: Total Purchased - Total Used.</li>
            </ul>
          </div>

        </div>

        {/* ---------------- STOCK GRID LIST ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-full min-h-[400px]">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <Archive className="w-5 h-5 text-saffron" />
            <span>Raw Materials Inventory Registry</span>
          </h3>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Material Name</th>
                  <th className="py-3 px-2 text-right">Total Purchased</th>
                  <th className="py-3 px-2 text-right">Total Used</th>
                  <th className="py-3 px-2 text-right">Remaining Stock</th>
                  <th className="py-3 px-2 text-center">Min Level</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      No raw materials registered. Add items above to start.
                    </td>
                  </tr>
                ) : (
                  materials.map((m) => {
                    const isLow = m.currentStock < m.minStockLevel;
                    return (
                      <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                        <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{m.name}</td>
                        <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-350">
                          {m.totalPurchased || 0} {m.unit}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-500 dark:text-slate-400">
                          {m.totalUsed || 0} {m.unit}
                        </td>
                        <td className="py-3 px-2 text-right font-black text-slate-800 dark:text-white">
                          {m.currentStock || 0} {m.unit}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-400 font-semibold">
                          {m.minStockLevel} {m.unit}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isLow ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {isLow ? 'LOW STOCK' : 'OK'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleDeleteItem(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors animate-fade-in"
                            title="Delete Raw Material"
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
