import { useState, useEffect } from 'react';
import { api } from '../api';
import { Store, Plus, Edit2, AlertCircle, CheckCircle2, User, Phone, MapPin, RefreshCw } from 'lucide-react';

export default function ShopCustomerMgmt() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState('Retailer');
  const [outstandingBalance, setOutstandingBalance] = useState('0');
  const [notes, setNotes] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.customers.getAll();
      setCustomers(data);
    } catch (err) {
      setError('Failed to fetch shop profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEditClick = (c) => {
    setEditId(c.id);
    setShopName(c.shopName);
    setOwnerName(c.ownerName);
    setPhoneNumber(c.phoneNumber);
    setAddress(c.address);
    setCustomerType(c.customerType);
    setOutstandingBalance(c.outstandingBalance);
    setNotes(c.notes);
    setEditorOpen(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setShopName('');
    setOwnerName('');
    setPhoneNumber('');
    setAddress('');
    setCustomerType('Retailer');
    setOutstandingBalance('0');
    setNotes('');
    setEditorOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shopName || !ownerName || !phoneNumber || !address) {
      setError('Please provide Shop name, Owner details, Contact, and Address');
      return;
    }

    try {
      const payload = {
        shopName,
        ownerName,
        phoneNumber,
        address,
        customerType,
        outstandingBalance: parseFloat(outstandingBalance || 0),
        notes
      };

      if (editId) {
        await api.customers.update(editId, payload);
        setSuccess('Customer profile details updated.');
      } else {
        await api.customers.create(payload);
        setSuccess(`New profile for "${shopName}" registered successfully.`);
      }

      setEditorOpen(false);
      fetchCustomers();
    } catch (err) {
      setError('Failed to save profile specifications');
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
          <Store className="w-6 h-6 text-saffron" />
          <span>Shop & Customer Directory</span>
        </h3>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Buyer Profile</span>
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
              <Store className="w-5 h-5 text-saffron" />
              <span>{editId ? 'Modify Customer Profile' : 'Register Customer Profile'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shop-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Shop / Outlet Name *</label>
                  <input
                    id="shop-name-input"
                    type="text"
                    placeholder="e.g. Udupi Spice Mart"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="owner-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Owner Name *</label>
                  <input
                    id="owner-name-input"
                    type="text"
                    placeholder="e.g. Ramesh Shetty"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer-phone-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone Number *</label>
                  <input
                    id="customer-phone-input"
                    type="text"
                    placeholder="e.g. +91 9900112233"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="cust-type-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Customer Classification *</label>
                  <select
                    id="cust-type-select"
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Direct Customer">Direct Customer</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cust-address-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Outlet Address *</label>
                <input
                  id="cust-address-input"
                  type="text"
                  placeholder="e.g. Opp. Bus Stand, Brahmavar, Karnataka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div>
                <label htmlFor="cust-balance-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Outstanding Balance (₹) *</label>
                <input
                  id="cust-balance-input"
                  type="number"
                  placeholder="Ledger balance"
                  value={outstandingBalance}
                  onChange={(e) => setOutstandingBalance(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div>
                <label htmlFor="cust-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Business Notes / References</label>
                <textarea
                  id="cust-notes-input"
                  placeholder="Preferences, delivery timetables, credit limits..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-saffron focus:outline-none"
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- BUYERS TABLE LIST ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-2">Shop / Client</th>
                <th className="py-3 px-2">Owner Name</th>
                <th className="py-3 px-2">Contact</th>
                <th className="py-3 px-2">Address</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-2 text-right">Outstanding Dues</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const hasDues = c.outstandingBalance > 0;
                return (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-800 dark:text-white">{c.shopName}</td>
                    <td className="py-3 px-2 font-semibold">{c.ownerName}</td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-500">{c.phoneNumber}</td>
                    <td className="py-3 px-2 truncate max-w-[200px]" title={c.address}>{c.address}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        c.customerType === 'Wholesaler'
                          ? 'bg-purple-500/10 text-purple-500'
                          : c.customerType === 'Distributor'
                            ? 'bg-blue-500/10 text-blue-500'
                            : c.customerType === 'Retailer'
                              ? 'bg-teal-500/10 text-teal-500'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {c.customerType}
                      </span>
                    </td>
                    <td className={`py-3 px-2 text-right font-black ${hasDues ? 'text-red-500' : 'text-slate-400'}`}>
                      ₹{c.outstandingBalance}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleEditClick(c)}
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
