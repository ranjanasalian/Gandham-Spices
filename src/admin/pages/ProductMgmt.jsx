import { useState, useEffect } from 'react';
import { api } from '../api';
import { Package, Edit2, Plus, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ProductMgmt() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State (Add / Edit)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Spice Blends');
  const [mrp, setMrp] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [packSize, setPackSize] = useState('100g');
  const [status, setStatus] = useState('Active');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch finished product catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (prod) => {
    setEditId(prod.id);
    setName(prod.name);
    setSku(prod.sku);
    setCategory(prod.category);
    setMrp(prod.mrp);
    setWholesalePrice(prod.wholesalePrice);
    setCostPrice(prod.costPrice);
    setCurrentStock(prod.currentStock);
    setPackSize(prod.packSize);
    setStatus(prod.status);
    setEditorOpen(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setName('');
    setSku('');
    setCategory('Spice Blends');
    setMrp('');
    setWholesalePrice('');
    setCostPrice('');
    setCurrentStock('0');
    setPackSize('100g');
    setStatus('Active');
    setEditorOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !sku || !mrp || !wholesalePrice || !costPrice) {
      setError('Please fill in all pricing and description fields');
      return;
    }

    try {
      const payload = {
        name,
        sku,
        category,
        mrp: parseFloat(mrp),
        wholesalePrice: parseFloat(wholesalePrice),
        costPrice: parseFloat(costPrice),
        currentStock: parseInt(currentStock, 10),
        packSize,
        status
      };

      if (editId) {
        await api.products.update(editId, payload);
        setSuccess('Product details updated successfully.');
      } else {
        await api.products.create(payload);
        setSuccess(`Product "${name}" added to registry.`);
      }

      setEditorOpen(false);
      fetchProducts();
    } catch (err) {
      setError('Failed to save product configurations');
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
          <Package className="w-6 h-6 text-saffron" />
          <span>Finished Products Catalog</span>
        </h3>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Catalog Product</span>
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

      {/* ---------------- FORM MODAL (ADD / EDIT) ---------------- */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg z-10 shadow-2xl animate-fade-in-up text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-saffron" />
              <span>{editId ? 'Modify Product Specifications' : 'Add Product to Registry'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Product Name *</label>
                  <input
                    id="prod-name-input"
                    type="text"
                    placeholder="e.g. Biryani Marination Mix"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="prod-sku-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">SKU Code *</label>
                  <input
                    id="prod-sku-input"
                    type="text"
                    placeholder="e.g. GS-BM01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-category-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Category *</label>
                  <select
                    id="prod-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="Spice Blends">Spice Blends</option>
                    <option value="Spice Powders">Spice Powders</option>
                    <option value="Masalas">Masalas</option>
                    <option value="Whole Spices">Whole Spices</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prod-pack-size-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Default Pack Size *</label>
                  <select
                    id="prod-pack-size-select"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="50g">50g</option>
                    <option value="100g">100g</option>
                    <option value="250g">250g</option>
                    <option value="500g">500g</option>
                    <option value="1kg">1kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="prod-mrp-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">MRP Price (₹) *</label>
                  <input
                    id="prod-mrp-input"
                    type="number"
                    step="0.01"
                    placeholder="MRP"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="prod-wholesale-price-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Wholesale Price (₹) *</label>
                  <input
                    id="prod-wholesale-price-input"
                    type="number"
                    step="0.01"
                    placeholder="Wholesale"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="prod-cost-price-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Cost Price (₹) *</label>
                  <input
                    id="prod-cost-price-input"
                    type="number"
                    step="0.01"
                    placeholder="Cost"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-stock-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Current Stock (packets) *</label>
                  <input
                    id="prod-stock-input"
                    type="number"
                    placeholder="Stock count"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="prod-status-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Registry Status *</label>
                  <select
                    id="prod-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl flex justify-between items-center font-bold">
                <span className="text-slate-500">Profit margin:</span>
                <span className="text-emerald-500 text-sm">₹{((parseFloat(mrp) || 0) - (parseFloat(costPrice) || 0)).toFixed(2)} per packet</span>
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
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- PRODUCTS TABLE LIST ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Product Name</th>
                <th className="py-3 px-2">SKU</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2 text-center">Pack Size</th>
                <th className="py-3 px-2 text-right">MRP</th>
                <th className="py-3 px-2 text-right">Wholesale</th>
                <th className="py-3 px-2 text-right">Cost Price</th>
                <th className="py-3 px-2 text-center">Stock</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.currentStock < 20;
                return (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{p.name}</td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-500">{p.sku}</td>
                    <td className="py-3 px-2">{p.category}</td>
                    <td className="py-3 px-2 text-center font-semibold">{p.packSize}</td>
                    <td className="py-3 px-2 text-right font-black">₹{p.mrp}</td>
                    <td className="py-3 px-2 text-right font-bold text-indigo-500">₹{p.wholesalePrice}</td>
                    <td className="py-3 px-2 text-right text-slate-500">₹{p.costPrice}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`font-black ${isLow ? 'text-red-500 font-extrabold animate-pulse' : ''}`}>
                        {p.currentStock} packs
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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
