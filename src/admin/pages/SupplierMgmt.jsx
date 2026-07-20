import { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, Plus, Edit2, AlertCircle, CheckCircle2, Phone, MapPin, ListFilter, RefreshCw } from 'lucide-react';

export default function SupplierMgmt() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ingredientsSupplied, setIngredientsSupplied] = useState('');
  const [outstandingPayments, setOutstandingPayments] = useState('0');

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await api.suppliers.getAll();
      setSuppliers(data);
    } catch (err) {
      setError('Failed to fetch supplier registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEditClick = (s) => {
    setEditId(s.id);
    setName(s.name);
    setContactNumber(s.contactNumber);
    setAddress(s.address);
    setIngredientsSupplied(s.ingredientsSupplied);
    setOutstandingPayments(s.outstandingPayments);
    setEditorOpen(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setName('');
    setContactNumber('');
    setAddress('');
    setIngredientsSupplied('');
    setOutstandingPayments('0');
    setEditorOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !contactNumber || !address || !ingredientsSupplied) {
      setError('Please fill in supplier name, contact, address, and ingredients details');
      return;
    }

    try {
      const payload = {
        name,
        contactNumber,
        address,
        ingredientsSupplied,
        outstandingPayments: parseFloat(outstandingPayments || 0)
      };

      if (editId) {
        await api.suppliers.update(editId, payload);
        setSuccess('Supplier profile details modified.');
      } else {
        await api.suppliers.create(payload);
        setSuccess(`New supplier profile "${name}" registered.`);
      }

      setEditorOpen(false);
      fetchSuppliers();
    } catch (err) {
      setError('Failed to save supplier details');
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
          <Users className="w-6 h-6 text-saffron" />
          <span>Supplier Directory</span>
        </h3>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor Profile</span>
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
              <Users className="w-5 h-5 text-saffron" />
              <span>{editId ? 'Modify Supplier Profile' : 'Configure Supplier Profile'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vendor-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Supplier Name *</label>
                  <input
                    id="vendor-name-input"
                    type="text"
                    placeholder="e.g. Malabar Spices Co."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="vendor-phone-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Contact Number *</label>
                  <input
                    id="vendor-phone-input"
                    type="text"
                    placeholder="e.g. +91 9845012345"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendor-address-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Supplier Address *</label>
                <input
                  id="vendor-address-input"
                  type="text"
                  placeholder="e.g. NH 66, Brahmavar, Karnataka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div>
                <label htmlFor="vendor-materials-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Ingredients Supplied *</label>
                <input
                  id="vendor-materials-input"
                  type="text"
                  placeholder="e.g. Red Chillies, Pepper, Pouches..."
                  value={ingredientsSupplied}
                  onChange={(e) => setIngredientsSupplied(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div>
                <label htmlFor="vendor-dues-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Outstanding Balance Owed (₹) *</label>
                <input
                  id="vendor-dues-input"
                  type="number"
                  placeholder="Ledger balance"
                  value={outstandingPayments}
                  onChange={(e) => setOutstandingPayments(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
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
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- SUPPLIERS LIST GRID ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">{s.name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Offers: {s.ingredientsSupplied}</p>
              </div>
              <button
                onClick={() => handleEditClick(s)}
                className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex gap-2 items-center text-slate-500">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-semibold">{s.contactNumber}</span>
              </div>
              <div className="flex gap-2 items-center text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={s.address}>{s.address}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/40 p-2.5 rounded-xl font-bold mt-2">
                <span className="text-slate-500">Outstanding Dues Owed:</span>
                <span className={`font-black ${s.outstandingPayments > 0 ? 'text-red-500' : 'text-slate-400'}`}>₹{s.outstandingPayments}</span>
              </div>
            </div>

            {/* Supplier purchase history logs */}
            {s.purchaseHistory && s.purchaseHistory.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Purchase History Logs</p>
                <div className="space-y-1 text-[11px] leading-relaxed max-h-24 overflow-y-auto pr-1">
                  {s.purchaseHistory.map((h, i) => (
                    <div key={i} className="flex justify-between p-1 bg-slate-50 dark:bg-slate-800/20 rounded">
                      <span className="text-slate-400">{h.date} - {h.item}</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">₹{h.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
