import { useState, useEffect } from 'react';
import { api } from '../api';
import { Package, Edit2, Plus, AlertCircle, CheckCircle2, RefreshCw, ShoppingBag, Archive, Trash2, Search, X } from 'lucide-react';

export default function ProductMgmt() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State (Add / Edit)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Spice Blends');
  const [mrp, setMrp] = useState('');
  const [retailerMargin, setRetailerMargin] = useState('0');
  const [productionCost, setProductionCost] = useState('0');
  const [packSize, setPackSize] = useState('100g');
  const [status, setStatus] = useState('Active');

  // Custom Deletion States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const triggerDelete = (id) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    setError('');
    setSuccess('');
    try {
      await api.products.delete(itemToDelete);
      setSuccess('Product deleted successfully from catalog.');
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to delete product from catalog');
    } finally {
      setItemToDelete(null);
    }
  };

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
    setMrp(prod.mrp.toString());
    setRetailerMargin((prod.retailerMargin || 0).toString());
    setProductionCost((prod.productionCost || prod.costPrice || 0).toString());
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
    setRetailerMargin('0');
    setProductionCost('0');
    setPackSize('100g');
    setStatus('Active');
    setEditorOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !sku || !mrp || !retailerMargin || !productionCost) {
      setError('Please fill in all pricing and description fields');
      return;
    }

    try {
      const payload = {
        name,
        sku,
        category,
        mrp: parseFloat(mrp),
        retailerMargin: parseFloat(retailerMargin),
        productionCost: parseFloat(productionCost),
        packSize,
        status
      };

      if (editId) {
        await api.products.update(editId, payload);
        setSuccess('Product specifications saved.');
      } else {
        await api.products.create(payload);
        setSuccess(`Product "${name}" registered in master catalog.`);
      }

      setEditorOpen(false);
      fetchProducts();
    } catch (err) {
      setError('Failed to save product configurations');
    }
  };

  // Real-time calculations
  const mrpValue = parseFloat(mrp) || 0;
  const marginPct = parseFloat(retailerMargin) || 0;
  const prodCostValue = parseFloat(productionCost) || 0;

  const calculatedWholesale = parseFloat((mrpValue * (1 - marginPct / 100)).toFixed(2));
  const calculatedNetProfit = parseFloat((calculatedWholesale - prodCostValue).toFixed(2));
  const calculatedNetMargin = calculatedWholesale > 0 ? parseFloat(((calculatedNetProfit / calculatedWholesale) * 100).toFixed(1)) : 0;

  // Finished Goods Inventory Dashboard metrics
  const totalProduced = products.reduce((acc, p) => acc + (p.totalProduced || 0), 0);
  const totalSold = products.reduce((acc, p) => acc + (p.totalSold || 0), 0);
  const remainingStock = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);

  // Group stock by pouch size
  const stockByPouchSize = {};
  products.forEach(p => {
    const size = p.packSize || 'Unknown';
    if (!stockByPouchSize[size]) stockByPouchSize[size] = 0;
    stockByPouchSize[size] += (p.currentStock || 0);
  });

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
          <span>Finished Goods Product Master</span>
        </h3>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register Catalog Product</span>
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

      {/* ---------------- FINISHED GOODS INVENTORY METRICS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pouches Produced</p>
            <h4 className="text-xl font-black mt-1 text-slate-900 dark:text-white">{totalProduced} <span className="text-xs text-slate-400 font-medium">packs</span></h4>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pouches Sold</p>
            <h4 className="text-xl font-black mt-1 text-emerald-500">{totalSold} <span className="text-xs text-slate-400 font-medium">packs</span></h4>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining stock in hand</p>
            <h4 className="text-xl font-black mt-1 text-orange-500">{remainingStock} <span className="text-xs text-slate-400 font-medium">packs</span></h4>
          </div>
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Stock by Pouch Size */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm text-xs flex flex-wrap items-center gap-3">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Stock By Pouch Size:</span>
        {Object.entries(stockByPouchSize).map(([size, stock]) => (
          <span key={size} className="bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 px-3 py-1 rounded-full font-black text-slate-700 dark:text-slate-350">
            {size}: {stock} packs
          </span>
        ))}
        {Object.keys(stockByPouchSize).length === 0 && <span className="text-slate-400">No stock logged</span>}
      </div>

      {/* ---------------- FORM MODAL (ADD / EDIT) ---------------- */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setEditorOpen(false)} />
          <div className="relative z-10 flex min-h-full w-full items-start justify-center p-4 text-center">
            <div className="relative my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg text-left shadow-2xl animate-fade-in-up text-xs z-10">
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
                    <option value="Spice Spice Blends">Spice Blends</option>
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
                  <label htmlFor="prod-margin-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Retail Margin (%) *</label>
                  <input
                    id="prod-margin-input"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 25"
                    value={retailerMargin}
                    onChange={(e) => setRetailerMargin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="prod-cost-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Production Cost (₹) *</label>
                  <input
                    id="prod-cost-input"
                    type="number"
                    step="0.01"
                    placeholder="Production Cost"
                    value={productionCost}
                    onChange={(e) => setProductionCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              {/* Dynamic calculations values */}
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 p-3 rounded-2xl space-y-2 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Wholesale Price:</span>
                  <span className="font-bold text-indigo-500">₹{calculatedWholesale.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Profit per Pouch:</span>
                  <span className={`font-bold ${calculatedNetProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ₹{calculatedNetProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Margin (%):</span>
                  <span className="font-black text-slate-700 dark:text-slate-350">{calculatedNetMargin}%</span>
                </div>
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
      </div>
      )}

      {/* ---------------- PRODUCTS TABLE LIST ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-saffron" />
            <span>Master Spice Catalog</span>
          </h3>
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search catalog..."
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

        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Product Name</th>
                <th className="py-3 px-2">SKU</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2 text-center">Pack Size</th>
                <th className="py-3 px-2 text-right">MRP</th>
                <th className="py-3 px-2 text-right">Wholesale Price</th>
                <th className="py-3 px-2 text-right">Production Cost</th>
                <th className="py-3 px-2 text-right">Net Profit</th>
                <th className="py-3 px-2 text-center">Stock</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-10 text-slate-400">
                    No products registered. Click Add Catalog Product to start.
                  </td>
                </tr>
              ) : products.filter(p => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || p.packSize.toLowerCase().includes(term);
                }).length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-10 text-slate-400">
                    No records match your search criteria.
                  </td>
                </tr>
              ) : (
                products.filter(p => {
                  if (!searchTerm.trim()) return true;
                  const term = searchTerm.toLowerCase();
                  return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || p.packSize.toLowerCase().includes(term);
                }).map((p) => {
                  const isLow = p.currentStock < 20;
                  return (
                    <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{p.name}</td>
                      <td className="py-3 px-2 font-mono font-bold text-slate-500">{p.sku}</td>
                      <td className="py-3 px-2">{p.category}</td>
                      <td className="py-3 px-2 text-center font-semibold">{p.packSize}</td>
                      <td className="py-3 px-2 text-right font-black">₹{p.mrp}</td>
                      <td className="py-3 px-2 text-right font-bold text-indigo-500">₹{p.wholesalePrice} <span className="text-[10px] text-slate-400">({p.retailerMargin}%)</span></td>
                      <td className="py-3 px-2 text-right text-slate-500">₹{p.productionCost || p.costPrice}</td>
                      <td className="py-3 px-2 text-right font-black text-emerald-500">₹{p.netProfit} <span className="text-[10px] text-slate-400">({p.netMargin}%)</span></td>
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
                      <td className="py-3 px-2 text-center flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl transition-colors"
                          title="Edit Product Configuration"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Delete Product"
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

      {/* ---------------- CUSTOM CONFIRM DELETE MODAL ---------------- */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm z-10 shadow-2xl animate-fade-in-up text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Confirm Product Deletion</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete this product? All associated master catalog and inventory records will be permanently removed.
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
