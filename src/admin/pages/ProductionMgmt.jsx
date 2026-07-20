import { useState, useEffect } from 'react';
import { api } from '../api';
import { Factory, Calendar, DollarSign, Package, AlertCircle, Plus, Eye, CheckCircle2, Loader, RefreshCw } from 'lucide-react';

export default function ProductionMgmt() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [productId, setProductId] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('2026-07-20');
  const [bestBeforeDate, setBestBeforeDate] = useState('2027-01-20');
  const [quantityProduced, setQuantityProduced] = useState('');
  const [packSize, setPackSize] = useState('100g');
  const [packetsProduced, setPacketsProduced] = useState('');
  const [manufacturingCost, setManufacturingCost] = useState('');
  const [notes, setNotes] = useState('');

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

  // Sync recipe when product changes
  useEffect(() => {
    if (productId) {
      const matchingRecipe = recipes.find(r => r.productId === productId);
      if (matchingRecipe) {
        setRecipeId(matchingRecipe.id);
        const prod = products.find(p => p.id === productId);
        if (prod) {
          setPackSize(prod.packSize);
        }
      } else {
        setRecipeId('');
      }
    }
  }, [productId, recipes, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productId || !recipeId || !quantityProduced || !packetsProduced || !manufacturingCost) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const batchData = {
        productId,
        recipeId,
        manufacturingDate,
        bestBeforeDate,
        quantityProduced: parseFloat(quantityProduced),
        packSize,
        packetsProduced: parseInt(packetsProduced, 10),
        manufacturingCost: parseFloat(manufacturingCost),
        notes
      };

      await api.batches.create(batchData);
      setSuccess('Production batch recorded successfully! Stock updated.');
      
      // Reset Form
      setQuantityProduced('');
      setPacketsProduced('');
      setManufacturingCost('');
      setNotes('');
      
      // Reload Table
      const updatedBatches = await api.batches.getAll();
      setBatches(updatedBatches.sort((a,b) => b.manufacturingDate.localeCompare(a.manufacturingDate)));
    } catch (err) {
      setError(err.message || 'Failed to record batch. Check raw material stock.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cost split calculation helper
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
    <div className="space-y-8 font-body">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ---------------- BATCH RECORDER FORM ---------------- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
            <Factory className="w-5 h-5 text-saffron" />
            <span>Record Production Batch</span>
          </h3>

          <form className="space-y-4 text-left text-xs" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 p-3.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="product-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Finished Product *</label>
              <select
                id="product-select"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
              >
                <option value="">Select product to manufacture</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="recipe-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Recipe Formula *</label>
              <select
                id="recipe-select"
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
              >
                <option value="">Select formula blueprint</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
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
                <label htmlFor="best-before-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Best Before Date *</label>
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
                <label htmlFor="qty-produced-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Qty Produced (kg) *</label>
                <input
                  id="qty-produced-input"
                  type="number"
                  step="0.01"
                  placeholder="Total batch weight"
                  value={quantityProduced}
                  onChange={(e) => setQuantityProduced(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="pack-size-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Pack Size *</label>
                <select
                  id="pack-size-select"
                  value={packSize}
                  onChange={(e) => setPackSize(e.target.value)}
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
                <label htmlFor="packets-produced-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Packets Produced *</label>
                <input
                  id="packets-produced-input"
                  type="number"
                  placeholder="Total pack count"
                  value={packetsProduced}
                  onChange={(e) => setPacketsProduced(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="mfg-cost-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Mfg Cost (Total ₹) *</label>
                <input
                  id="mfg-cost-input"
                  type="number"
                  placeholder="Production expense"
                  value={manufacturingCost}
                  onChange={(e) => setManufacturingCost(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Calculated Cost Per Packet:</span>
              <span className="font-black text-saffron text-sm">₹{calculatedCostPerPacket()}</span>
            </div>

            <div>
              <label htmlFor="production-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Production Notes</label>
              <textarea
                id="production-notes-input"
                placeholder="Special roasting conditions, temperature settings, assistants involved..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-saffron to-orange-500 hover:from-orange-500 hover:to-terracotta text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Deducting inventory...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Log Production Batch</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* ---------------- PRODUCTION HISTORY LOG ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col min-h-[450px]">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
            <Package className="w-5 h-5 text-saffron" />
            <span>Complete Production History</span>
          </h3>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Batch #</th>
                  <th className="py-3 px-2">Product Name</th>
                  <th className="py-3 px-2">Mfg Date</th>
                  <th className="py-3 px-2">Packets</th>
                  <th className="py-3 px-2">Cost/Pack</th>
                  <th className="py-3 px-2">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500 dark:text-slate-400">No batches recorded in database yet.</td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const prod = products.find(p => p.id === batch.productId);
                    return (
                      <tr key={batch.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-2 font-black text-saffron">{batch.batchNumber}</td>
                        <td className="py-3 px-2 font-semibold">{prod ? prod.name : 'Unknown Product'}</td>
                        <td className="py-3 px-2">{batch.manufacturingDate}</td>
                        <td className="py-3 px-2 font-bold">{batch.packetsProduced}</td>
                        <td className="py-3 px-2">₹{batch.costPerPacket}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-lg font-bold ${batch.remainingStock === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-saffron/10 text-saffron'}`}>
                            {batch.remainingStock} left
                          </span>
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
