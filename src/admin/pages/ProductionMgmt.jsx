import { useState, useEffect } from 'react';
import { api } from '../api';
import { Factory, Calendar, DollarSign, Package, AlertCircle, Plus, CheckCircle2, Loader, RefreshCw, Trash2, Edit2, Search, X } from 'lucide-react';

export default function ProductionMgmt() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form & Editing States
  const [editId, setEditId] = useState(null);
  const [productId, setProductId] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [bestBeforeDate, setBestBeforeDate] = useState('');
  const [quantityProduced, setQuantityProduced] = useState('');
  const [packSize, setPackSize] = useState('100g');
  const [packetsProduced, setPacketsProduced] = useState('');
  const [manufacturingCost, setManufacturingCost] = useState('');
  const [notes, setNotes] = useState('');

  // Custom Deletion States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const bData = await api.batches.getAll();
      setBatches(bData.sort((a,b) => b.manufacturingDate.localeCompare(a.manufacturingDate)));

      const pData = await api.products.getAll();
      setProducts(pData.filter(p => p.status === 'Active'));

      const rData = await api.recipes.getAll();
      setRecipes(rData);
    } catch (err) {
      setError('Failed to fetch production logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: Get pouch size in grams from pack size string
  const getPouchSizeGrams = (sizeStr) => {
    if (!sizeStr) return 100; // default to 100g
    const clean = sizeStr.toLowerCase().replace(/\s+/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return 100;
    if (clean.endsWith('kg')) return num * 1000;
    return num; // assume grams
  };

  const handleProductChange = (val) => {
    setProductId(val);
    if (!val) {
      setRecipeId('');
      return;
    }
    const prod = products.find(p => p.id === val);
    if (prod) {
      const defaultPackSize = prod.packSize || '100g';
      setPackSize(defaultPackSize);
      if (quantityProduced) {
        const weightKg = parseFloat(quantityProduced);
        const pouchGrams = getPouchSizeGrams(defaultPackSize);
        const costPerPack = parseFloat(prod.productionCost || prod.costPrice || 0);
        if (!isNaN(weightKg) && weightKg > 0 && pouchGrams > 0) {
          const estimatedPouches = Math.floor((weightKg * 1000) / pouchGrams);
          setManufacturingCost((estimatedPouches * costPerPack).toFixed(2));
        }
      }
    }
    const matchingRecipe = recipes.find(r => r.productId === val);
    setRecipeId(matchingRecipe ? matchingRecipe.id : '');
  };

  const handleWeightChange = (val) => {
    setQuantityProduced(val);
    const prod = products.find(p => p.id === productId);
    if (prod && val) {
      const weightKg = parseFloat(val);
      const pouchGrams = getPouchSizeGrams(packSize);
      const costPerPack = parseFloat(prod.productionCost || prod.costPrice || 0);
      if (!isNaN(weightKg) && weightKg > 0 && pouchGrams > 0) {
        const estimatedPouches = Math.floor((weightKg * 1000) / pouchGrams);
        setManufacturingCost((estimatedPouches * costPerPack).toFixed(2));
      }
    }
  };

  const handlePackSizeChange = (val) => {
    setPackSize(val);
    const prod = products.find(p => p.id === productId);
    if (prod && quantityProduced && val) {
      const weightKg = parseFloat(quantityProduced);
      const pouchGrams = getPouchSizeGrams(val);
      const costPerPack = parseFloat(prod.productionCost || prod.costPrice || 0);
      if (!isNaN(weightKg) && weightKg > 0 && pouchGrams > 0) {
        const estimatedPouches = Math.floor((weightKg * 1000) / pouchGrams);
        setManufacturingCost((estimatedPouches * costPerPack).toFixed(2));
      }
    }
  };

  const handlePacketsProducedChange = (val) => {
    setPacketsProduced(val);
  };

  const handleEditClick = (b) => {
    setEditId(b.id);
    setProductId(b.productId);
    setRecipeId(b.recipeId || '');
    setBatchNumber(b.batchNumber);
    setBatchCode(b.batchCode);
    setManufacturingDate(b.manufacturingDate);
    setBestBeforeDate(b.bestBeforeDate || '');
    setQuantityProduced(b.quantityProduced ? b.quantityProduced.toString() : '');
    setPackSize(b.packSize);
    setPacketsProduced(b.packetsProduced.toString());
    setManufacturingCost(b.manufacturingCost.toString());
    setNotes(b.notes || '');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setProductId('');
    setRecipeId('');
    setBatchNumber('');
    setBatchCode('');
    setManufacturingDate('');
    setBestBeforeDate('');
    setQuantityProduced('');
    setPacketsProduced('');
    setManufacturingCost('');
    setNotes('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productId) {
      setError('Please select a Product');
      return;
    }
    if (!manufacturingDate) {
      setError('Please select a Manufacturing Date');
      return;
    }
    if (!batchNumber || !batchCode) {
      setError('Please provide both Batch Number and Batch Code');
      return;
    }
    if (!packetsProduced || parseInt(packetsProduced, 10) <= 0) {
      setError('Please provide a valid quantity of packets produced');
      return;
    }
    if (!manufacturingCost || parseFloat(manufacturingCost) < 0) {
      setError('Please provide a valid manufacturing cost');
      return;
    }

    setSubmitting(true);
    try {
      const batchData = {
        productId,
        recipeId,
        batchNumber,
        batchCode,
        manufacturingDate,
        bestBeforeDate,
        quantityProduced: parseFloat(quantityProduced || 0),
        packSize,
        packetsProduced: parseInt(packetsProduced, 10),
        manufacturingCost: parseFloat(manufacturingCost),
        notes
      };

      if (editId) {
        await api.batches.update(editId, batchData);
        setSuccess('Production batch updated successfully.');
      } else {
        await api.batches.create(batchData);
        setSuccess('Production batch recorded successfully! Ingredients deducted.');
      }
      
      // Reset Form
      setBatchNumber('');
      setBatchCode('');
      setManufacturingDate('');
      setBestBeforeDate('');
      setQuantityProduced('');
      setPacketsProduced('');
      setManufacturingCost('');
      setNotes('');
      setEditId(null);
      
      // Reload Table
      const updatedBatches = await api.batches.getAll();
      setBatches(updatedBatches.sort((a,b) => b.manufacturingDate.localeCompare(a.manufacturingDate)));
    } catch (err) {
      setError(err.message || 'Failed to record batch. Check ingredient stock shortages.');
    } finally {
      setSubmitting(false);
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
      await api.batches.delete(itemToDelete);
      setSuccess('Production batch log removed.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete batch log');
    } finally {
      setItemToDelete(null);
    }
  };

  const getProductWholesalePrice = (prod) => {
    if (!prod) return 0;
    const mrp = parseFloat(prod.mrp) || 0;
    const margin = parseFloat(prod.retailerMargin) || 0;
    return mrp * (1 - margin / 100);
  };

  const selectedProduct = products.find(p => p.id === productId);
  const mrpPerPouch = selectedProduct ? parseFloat(selectedProduct.mrp || 0) : 0;
  const prodCostPerPouch = selectedProduct ? parseFloat(selectedProduct.productionCost || selectedProduct.costPrice || 0) : 0;
  const wholesalePerPouch = selectedProduct ? getProductWholesalePrice(selectedProduct) : 0;

  const weightKgForEst = parseFloat(quantityProduced) || 0;
  const pouchGramsForEst = getPouchSizeGrams(packSize);
  const estimatedPouches = pouchGramsForEst > 0 ? Math.floor((weightKgForEst * 1000) / pouchGramsForEst) : 0;

  const qtyProducedVal = parseInt(packetsProduced, 10) || 0;
  const totalCostOfPouchesMrp = qtyProducedVal * mrpPerPouch;
  const totalCostOfPouchesProd = qtyProducedVal * prodCostPerPouch;
  const totalWholesaleValue = qtyProducedVal * wholesalePerPouch;

  const calculatedCostPerPacket = () => {
    const packs = parseInt(packetsProduced, 10);
    const cost = parseFloat(manufacturingCost);
    if (!isNaN(packs) && packs > 0 && !isNaN(cost) && cost >= 0) {
      return (cost / packs).toFixed(2);
    }
    return '0.00';
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ---------------- LOG / EDIT PRODUCTION FORM ---------------- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Factory className="w-5 h-5 text-saffron" />
            <span>{editId ? 'Modify Production Batch' : 'Log Production Batch'}</span>
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
              <label htmlFor="finished-product-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Finished Product *</label>
              <select
                id="finished-product-select"
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
              >
                <option value="">Select manufactured product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="batch-number-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Batch Number *</label>
                <input
                  id="batch-number-input"
                  type="text"
                  placeholder="e.g. Batch 1"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="batch-code-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Batch Code / ID *</label>
                <input
                  id="batch-code-input"
                  type="text"
                  placeholder="e.g. BiryaniB01"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mfg-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">MFG Date *</label>
                <input
                  id="mfg-date-input"
                  type="date"
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="best-before-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Best Before Date (Optional)</label>
                <input
                  id="best-before-date-input"
                  type="date"
                  value={bestBeforeDate}
                  onChange={(e) => setBestBeforeDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="qty-produced-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Batch weight (kg) (Opt.)</label>
                <input
                  id="qty-produced-input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10.0"
                  value={quantityProduced}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="pack-size-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Pouch Size *</label>
                <select
                  id="pack-size-select"
                  value={packSize}
                  onChange={(e) => handlePackSizeChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                >
                  <option value="50g">50g</option>
                  <option value="100g">100g</option>
                  <option value="250g">250g</option>
                  <option value="500g">500g</option>
                  <option value="1kg">1kg</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="packets-produced-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Quantity Produced *</label>
                <input
                  id="packets-produced-input"
                  type="number"
                  placeholder="Total pouches count"
                  value={packetsProduced}
                  onChange={(e) => handlePacketsProducedChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="mfg-cost-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Production Cost *</label>
                <input
                  id="mfg-cost-input"
                  type="number"
                  placeholder="Total batch cost ₹"
                  value={manufacturingCost}
                  onChange={(e) => setManufacturingCost(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Pouch Cost (MRP):</span>
                <span className="font-black text-saffron text-sm">₹{mrpPerPouch.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
                <span className="font-semibold text-slate-500">Estimated Pouches:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{estimatedPouches} packs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Total Cost of Pouches (MRP):</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">₹{totalCostOfPouchesMrp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Total Cost of Pouches (Prod. Cost):</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">₹{totalCostOfPouchesProd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Total Wholesale Value:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">₹{totalWholesaleValue.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="production-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes</label>
              <textarea
                id="production-notes-input"
                placeholder="Remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-saffron to-orange-500 hover:from-orange-500 hover:to-terracotta text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Deducting stock inventory...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{editId ? 'Save Configuration' : 'Log Production Batch'}</span>
                  </>
                )}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 font-bold rounded-2xl text-xs transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>

          </form>
        </div>

        {/* ---------------- PRODUCTION HISTORY LOG ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col min-h-[450px] overflow-hidden max-w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-saffron" />
              <span>Complete Production History</span>
            </h3>
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search batches..."
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

          <div className="w-full max-w-full overflow-x-auto max-h-[400px] overflow-y-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Batch #</th>
                  <th className="py-3 px-2">Batch Code</th>
                  <th className="py-3 px-2">Product Name</th>
                  <th className="py-3 px-2 text-center">Pouch Size</th>
                  <th className="py-3 px-2">Mfg Date</th>
                  <th className="py-3 px-2 text-right">Quantity</th>
                  <th className="py-3 px-2 text-right">Cost</th>
                  <th className="py-3 px-2 text-center">Remaining Stock</th>
                  <th className="py-3 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-slate-400">No production batches recorded yet.</td>
                  </tr>
                ) : batches.filter(batch => {
                    if (!searchTerm.trim()) return true;
                    const term = searchTerm.toLowerCase();
                    const prod = products.find(p => p.id === batch.productId);
                    const prodName = prod ? prod.name.toLowerCase() : '';
                    const bNum = (batch.batchNumber || '').toLowerCase();
                    const bCode = (batch.batchCode || '').toLowerCase();
                    const date = (batch.manufacturingDate || '').toLowerCase();
                    return prodName.includes(term) || bNum.includes(term) || bCode.includes(term) || date.includes(term);
                  }).length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-slate-400">No records match your search criteria.</td>
                  </tr>
                ) : (
                  batches.filter(batch => {
                    if (!searchTerm.trim()) return true;
                    const term = searchTerm.toLowerCase();
                    const prod = products.find(p => p.id === batch.productId);
                    const prodName = prod ? prod.name.toLowerCase() : '';
                    const bNum = (batch.batchNumber || '').toLowerCase();
                    const bCode = (batch.batchCode || '').toLowerCase();
                    const date = (batch.manufacturingDate || '').toLowerCase();
                    return prodName.includes(term) || bNum.includes(term) || bCode.includes(term) || date.includes(term);
                  }).map((batch) => {
                    const prod = products.find(p => p.id === batch.productId);
                    return (
                      <tr key={batch.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-2 font-black text-saffron">{batch.batchNumber}</td>
                        <td className="py-3 px-2 font-semibold text-slate-500">{batch.batchCode || batch.batchNumber}</td>
                        <td className="py-3 px-2 font-bold">{prod ? prod.name : 'Unknown Product'}</td>
                        <td className="py-3 px-2 text-center font-semibold">{batch.packSize}</td>
                        <td className="py-3 px-2">{batch.manufacturingDate}</td>
                        <td className="py-3 px-2 text-right font-black">{batch.packetsProduced} packs</td>
                        <td className="py-3 px-2 text-right font-semibold">₹{batch.manufacturingCost} <span className="text-[10px] text-slate-450 font-medium">(₹{batch.costPerPacket}/ea)</span></td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${batch.remainingStock === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-saffron/10 text-saffron'}`}>
                            {batch.remainingStock} packs
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(batch)}
                            className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl transition-colors"
                            title="Edit Production Log"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(batch.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Delete Production Log"
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
                Are you sure you want to delete this production batch log? The finished goods stock will be decremented and raw materials will adjust.
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
