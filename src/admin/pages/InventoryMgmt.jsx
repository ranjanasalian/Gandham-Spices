import { useState, useEffect } from 'react';
import { api } from '../api';
import { Archive, Plus, AlertTriangle, AlertCircle, CheckCircle2, DollarSign, RefreshCw, ShoppingCart, Loader } from 'lucide-react';

export default function InventoryMgmt() {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Purchase Form State
  const [rawMaterialId, setRawMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('2026-07-20');

  // Add New Item State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemMinStock, setNewItemMinStock] = useState('5');

  const loadData = async () => {
    setLoading(true);
    try {
      const rmData = await api.rawMaterials.getAll();
      setMaterials(rmData);
      const sData = await api.suppliers.getAll();
      setSuppliers(sData);
    } catch (err) {
      setError('Failed to load raw material inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!rawMaterialId || !quantity || !purchasePrice || !supplierId || !purchaseDate) {
      setError('Please fill in all purchase fields');
      return;
    }

    setPurchasing(true);
    try {
      const purchaseDetails = {
        rawMaterialId,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        supplierId,
        purchaseDate
      };

      await api.rawMaterials.purchase(purchaseDetails);
      setSuccess('Purchase recorded successfully! Stock increased and expense registered.');
      
      // Reset Form
      setRawMaterialId('');
      setQuantity('');
      setPurchasePrice('');
      
      // Reload Data
      const rmData = await api.rawMaterials.getAll();
      setMaterials(rmData);
    } catch (err) {
      setError(err.message || 'Failed to log purchase details');
    } finally {
      setPurchasing(false);
    }
  };

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
        currentStock: 0,
        unit: newItemUnit,
        purchasePrice: 0,
        minStockLevel: parseFloat(newItemMinStock),
        purchaseDate: '',
        supplierId: ''
      };

      await api.rawMaterials.create(item);
      setSuccess(`Raw material "${newItemName}" added to registry.`);
      setShowAddForm(false);
      setNewItemName('');
      
      const rmData = await api.rawMaterials.getAll();
      setMaterials(rmData);
    } catch (err) {
      setError('Failed to add new raw material type');
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
        
        {/* ---------------- STOCK LOGGER / ACTIONS ---------------- */}
        <div className="space-y-6">
          
          {/* Purchase Log Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold flex items-center gap-2 mb-4 border-b pb-2">
              <ShoppingCart className="w-5 h-5 text-saffron" />
              <span>Log Stock Purchase</span>
            </h3>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="material-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Select Raw Material *</label>
                <select
                  id="material-select"
                  value={rawMaterialId}
                  onChange={(e) => setRawMaterialId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                >
                  <option value="">Choose item to restock</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="purchase-qty-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Quantity Bought *</label>
                  <input
                    id="purchase-qty-input"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="unit-price-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Price per unit (₹) *</label>
                  <input
                    id="unit-price-input"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 180"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="supplier-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Supplier / Vendor *</label>
                <select
                  id="supplier-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                >
                  <option value="">Select vendor</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="purchase-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Purchase Date *</label>
                <input
                  id="purchase-date-input"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>

              <div className="bg-slate-150 dark:bg-slate-800 p-3 rounded-xl flex justify-between items-center font-bold">
                <span className="text-slate-500">Auto expense:</span>
                <span className="text-saffron text-sm">₹{((parseFloat(quantity) || 0) * (parseFloat(purchasePrice) || 0)).toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={purchasing}
                className="w-full flex justify-center items-center gap-2 py-3 bg-gradient-to-r from-saffron to-orange-500 hover:from-orange-500 hover:to-terracotta text-white font-bold rounded-2xl shadow active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                {purchasing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Saving transactions...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Purchase & Restock</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Add New Type Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Hide Add Item panel' : 'Add New Inventory Type'}</span>
            </button>

            {showAddForm && (
              <form onSubmit={handleAddNewItem} className="mt-4 space-y-4 text-xs animate-fade-in-up">
                <div>
                  <label htmlFor="new-item-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Item Name *</label>
                  <input
                    id="new-item-name-input"
                    type="text"
                    placeholder="e.g. Cardamom Seeds"
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
                    <label htmlFor="new-item-min-stock-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Min level *</label>
                    <input
                      id="new-item-min-stock-input"
                      type="number"
                      placeholder="e.g. 5"
                      value={newItemMinStock}
                      onChange={(e) => setNewItemMinStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-saffron hover:bg-orange-500 text-white font-bold rounded-xl"
                >
                  Register Item Type
                </button>
              </form>
            )}
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
                  <th className="py-3 px-2 text-center">Current Stock</th>
                  <th className="py-3 px-2 text-center">Min Level</th>
                  <th className="py-3 px-2 text-right">Last Price</th>
                  <th className="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const isLow = m.currentStock < m.minStockLevel;
                  return (
                    <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{m.name}</td>
                      <td className="py-3 px-2 text-center font-black text-slate-600 dark:text-slate-300">
                        {m.currentStock} {m.unit}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400 font-semibold">
                        {m.minStockLevel} {m.unit}
                      </td>
                      <td className="py-3 px-2 text-right font-bold">
                        {m.purchasePrice > 0 ? `₹${m.purchasePrice}/${m.unit}` : '—'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          isLow ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {isLow ? 'LOW STOCK' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
