import { useState, useEffect } from 'react';
import { api } from '../api';
import { FlaskConical, Plus, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Trash2, Edit2, ListPlus, X, HelpCircle, ArrowRight } from 'lucide-react';

export default function RecipeTracker() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  // Form Editor Modal state (Add & Edit)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [productId, setProductId] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('1'); // Default base yield is 1 kg of powder
  const [recipeIngredients, setRecipeIngredients] = useState([
    { rawMaterialId: '', quantity: '', unit: 'kg' }
  ]);

  // Delete Confirmation Modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const rData = await api.recipes.getAll();
      setRecipes(rData);

      const pData = await api.products.getAll();
      setProducts(pData);

      const rmData = await api.rawMaterials.getAll();
      setRawMaterials(rmData);
    } catch (err) {
      setError('Failed to fetch recipes database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditId(null);
    setRecipeName('');
    setProductId('');
    setYieldQuantity('1');
    setRecipeIngredients([{ rawMaterialId: '', quantity: '', unit: 'kg' }]);
    setError('');
    setSuccess('');
    setEditorOpen(true);
  };

  const handleEditClick = (recipe) => {
    setEditId(recipe.id);
    setRecipeName(recipe.name || '');
    setProductId(recipe.productId || '');
    setYieldQuantity(recipe.yieldQuantity ? recipe.yieldQuantity.toString() : '1');
    setRecipeIngredients(
      (recipe.ingredients || []).map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        quantity: ing.quantity.toString(),
        unit: ing.unit || 'kg'
      }))
    );
    setError('');
    setSuccess('');
    setEditorOpen(true);
  };

  const handleDeleteClick = (recipe) => {
    setRecipeToDelete(recipe);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    try {
      await api.recipes.delete(recipeToDelete.id);
      setSuccess(`Recipe "${recipeToDelete.name}" deleted successfully!`);
      setDeleteConfirmOpen(false);
      setRecipeToDelete(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete recipe');
    }
  };

  const handleAddIngredientRow = () => {
    setRecipeIngredients(prev => [...prev, { rawMaterialId: '', quantity: '', unit: 'kg' }]);
  };

  const handleRemoveIngredientRow = (idx) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx, field, val) => {
    setRecipeIngredients(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      if (field === 'rawMaterialId') {
        const rm = rawMaterials.find(r => r.id === val);
        if (rm) copy[idx].unit = rm.unit === 'grams' ? 'grams' : 'kg';
      }
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!recipeName || !productId || recipeIngredients.some(ing => !ing.rawMaterialId || !ing.quantity)) {
      setError('Please fill in all recipe fields and ingredient lines');
      return;
    }

    try {
      const recipePayload = {
        name: recipeName,
        productId,
        yieldQuantity: parseFloat(yieldQuantity) || 1,
        notes: '',
        ingredients: recipeIngredients.map(ing => ({
          rawMaterialId: ing.rawMaterialId,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit
        }))
      };

      if (editId) {
        await api.recipes.update(editId, recipePayload);
        setSuccess('Recipe blueprint updated successfully!');
      } else {
        await api.recipes.createFixed(recipePayload);
        setSuccess('Recipe configuration created successfully!');
      }

      setEditorOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save recipe blueprint');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <FlaskConical className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body text-left">
      
      {/* ---------------- ACTIONS & HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <FlaskConical className="w-6 h-6 text-saffron" />
            <span>Master Recipe Blueprint Manager</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define ingredient proportions for finished products. Raw ingredient stock automatically reduces upon logging production batches.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Recipe Formula</span>
        </button>
      </div>

      {/* ---------------- INSTRUCTIONAL BANNER ---------------- */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-saffron flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-200">How Automatic Inventory Deduction Works:</p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • Each recipe defines the exact ingredient breakdown for **1 kg of finished spice powder yield**.  
            • When you create a production batch in **Production Management**, the system calculates used ingredient quantities (e.g., 9g of coriander per kg) and deducts them from your **Raw Material Inventory**.  
            • Combining multiple purchases of the same ingredient adds up your total available stock automatically!
          </p>
        </div>
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

      {/* ---------------- FORM MODAL (NEW / EDIT RECIPE) ---------------- */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setEditorOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto z-10 shadow-2xl animate-fade-in-up text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <FlaskConical className="w-5 h-5 text-saffron" />
                <span>{editId ? 'Edit Master Recipe Blueprint' : 'Configure Spice Formula Blueprint'}</span>
              </h3>
              <button onClick={() => setEditorOpen(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recipe-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Recipe Name *</label>
                  <input
                    id="recipe-name-input"
                    type="text"
                    placeholder="e.g. Temple-Style Rasam Powder"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="product-link-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Linked Finished Product *</label>
                  <select
                    id="product-link-select"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
                  >
                    <option value="">Select linked product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.packSize || '50g'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Ingredients Breakdown (For 1 kg powder yield) *</label>
                <div className="space-y-2">
                  {recipeIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <select
                        aria-label="Raw material ingredient select"
                        value={ing.rawMaterialId}
                        onChange={(e) => handleIngredientChange(idx, 'rawMaterialId', e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl focus:outline-none"
                      >
                        <option value="">Select ingredient</option>
                        {rawMaterials.map(rm => (
                          <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                        ))}
                      </select>
                      <input
                        aria-label="Raw material quantity input"
                        type="number"
                        step="0.001"
                        placeholder="Quantity"
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                        className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-center focus:outline-none"
                      />
                      <select
                        aria-label="Raw material unit select"
                        value={ing.unit}
                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                        className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2 rounded-xl focus:outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="grams">grams</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="mt-3 flex items-center gap-1 bg-saffron/10 text-saffron px-3 py-1.5 rounded-xl font-bold hover:bg-saffron/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient Line</span>
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white text-slate-600 dark:text-slate-350 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saffron text-white rounded-xl font-bold hover:bg-orange-500 shadow-md"
                >
                  {editId ? 'Update Blueprint' : 'Save Blueprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DELETE CONFIRMATION MODAL ---------------- */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl z-10 space-y-4 animate-fade-in-up text-left">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 rounded-2xl bg-red-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Delete Recipe Blueprint?</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{recipeToDelete?.name}"</strong>? This will permanently remove this recipe blueprint formulation.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Yes, Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- RECIPE CARDS INDEX ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((recipe) => {
          const product = products.find(p => p.id === recipe.productId);
          const expanded = expandedRecipe === recipe.id;

          return (
            <div
              key={recipe.id}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-200 ${expanded ? 'ring-2 ring-saffron/30' : ''}`}
            >
              <div className="p-5 flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-800 dark:text-white">{recipe.name}</h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(recipe)}
                        className="p-1.5 hover:bg-saffron/10 text-slate-400 hover:text-saffron rounded-xl transition-all"
                        title="Edit Recipe"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(recipe)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                        title="Delete Recipe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase bg-slate-100 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full w-fit">
                    Product: {product ? product.name : 'Unlinked'}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedRecipe(expanded ? null : recipe.id)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-saffron transition-all"
                >
                  {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {expanded && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4 animate-fade-in-up">
                  {/* Ingredients Table */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <ListPlus className="w-3.5 h-3.5 text-saffron" />
                      <span>Formula ingredient ratios (For 1 kg powder yield)</span>
                    </h5>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-semibold border-b border-inherit">
                          <tr>
                            <th className="py-2 px-3">Raw Material</th>
                            <th className="py-2 px-3 text-right">Deduction ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(recipe.ingredients || []).map((ing, i) => {
                            const rm = rawMaterials.find(m => m.id === ing.rawMaterialId);
                            return (
                              <tr key={i} className="border-b border-slate-50 dark:border-slate-800 last:border-b-0">
                                <td className="py-2.5 px-3 font-semibold">{rm ? rm.name : 'Unknown Material'}</td>
                                <td className="py-2.5 px-3 text-right font-black">{ing.quantity} {ing.unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
