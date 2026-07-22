import { useState, useEffect } from 'react';
import { api } from '../api';
import { Store, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Phone, MapPin, RefreshCw, DollarSign, Clock, Users, Package } from 'lucide-react';

export default function ShopCustomerMgmt() {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Shop Profile Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [contactName, setContactName] = useState('');
  const [shopName, setShopName] = useState('');
  const [customerClassification, setCustomerClassification] = useState('Retailer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [remarks, setRemarks] = useState('');

  // Dues Collection Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedShopForPayment, setSelectedShopForPayment] = useState(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionNotes, setCollectionNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const cData = await api.customers.getAll();
      setCustomers(cData);
      const sData = await api.sales.getAll();
      setSales(sData);
    } catch (err) {
      setError('Failed to fetch shop directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewClick = () => {
    setEditId(null);
    setContactName('');
    setShopName('');
    setCustomerClassification('Retailer');
    setPhoneNumber('');
    setAddress('');
    setRemarks('');
    setEditorOpen(true);
  };

  const handleEditClick = (c) => {
    setEditId(c.id);
    setContactName(c.contactName || '');
    setShopName(c.shopName || '');
    setCustomerClassification(c.customerClassification || 'Retailer');
    setPhoneNumber(c.phoneNumber || '');
    setAddress(c.address || '');
    setRemarks(c.remarks || '');
    setEditorOpen(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shopName || !contactName) {
      setError('Shop Name and Contact Person are required');
      return;
    }

    try {
      const payload = {
        contactName,
        shopName,
        customerClassification,
        phoneNumber,
        address,
        remarks
      };

      if (editId) {
        await api.customers.update(editId, payload);
        setSuccess(`Shop profile "${shopName}" updated successfully.`);
      } else {
        await api.customers.create(payload);
        setSuccess(`New outlet "${shopName}" registered in directory.`);
      }

      setEditorOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save shop profile');
    }
  };

  const handleCollectDuesClick = (c) => {
    setSelectedShopForPayment(c);
    setCollectionAmount('');
    setCollectionDate(new Date().toISOString().split('T')[0]);
    setCollectionNotes('');
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShopForPayment) return;
    setError('');
    setSuccess('');

    const amt = parseFloat(collectionAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid payment collection amount');
      return;
    }

    try {
      // Record payment towards sales entries
      await api.request(`/admin/customers/${selectedShopForPayment.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amountPaid: amt,
          paymentDate: collectionDate,
          notes: collectionNotes
        })
      });

      setSuccess(`Payment of ₹${amt.toFixed(2)} recorded for ${selectedShopForPayment.shopName}.`);
      setPaymentModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record payment collection');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the directory?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.customers.delete(id);
      setSuccess('Shop profile removed from directory.');
      loadData();
    } catch (err) {
      setError('Failed to delete shop profile');
    }
  };

  // Compute stats per shop
  const shopStats = customers.map(c => {
    const shopSales = sales.filter(s => s.customerId === c.id || s.shopName?.toLowerCase().trim() === c.shopName?.toLowerCase().trim());
    const totalPouches = shopSales.reduce((acc, s) => acc + (s.quantityGiven || 0), 0);
    const totalReceivables = shopSales.reduce((acc, s) => acc + (s.totalAmountReceivable || 0), 0);
    const totalReceived = shopSales.reduce((acc, s) => acc + (s.amountReceived || 0), 0);
    const dues = Math.max(0, parseFloat((totalReceivables - totalReceived).toFixed(2)));

    return {
      ...c,
      totalPouches,
      totalReceivables,
      totalReceived,
      outstandingDues: dues
    };
  });

  const totalRegisteredShops = shopStats.length;
  const totalPouchesAll = shopStats.reduce((acc, s) => acc + s.totalPouches, 0);
  const totalGlobalDues = shopStats.reduce((acc, s) => acc + s.outstandingDues, 0);
  const pendingAccountsCount = shopStats.filter(s => s.outstandingDues > 0).length;
  const paidAccountsCount = shopStats.filter(s => s.outstandingDues === 0).length;

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
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6 text-saffron" />
            <span>Shop & Customer Directory</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage outlet clients, contact information, and track account dues.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Shop / Outlet</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3.5 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ---------------- DIRECTORY SUMMARY METRICS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Registered Outlets</p>
          <h4 className="text-lg font-black mt-1 text-slate-800 dark:text-white flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{totalRegisteredShops}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pouches Supplied</p>
          <h4 className="text-lg font-black mt-1 text-slate-800 dark:text-white flex items-center gap-1">
            <Package className="w-4 h-4 text-orange-500" />
            <span>{totalPouchesAll}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Outstanding Dues</p>
          <h4 className="text-lg font-black mt-1 text-red-500 flex items-center gap-0.5">
            <span>₹</span><span>{totalGlobalDues.toFixed(2)}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pending Accounts</p>
          <h4 className="text-lg font-black mt-1 text-red-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{pendingAccountsCount}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Paid Up Accounts</p>
          <h4 className="text-lg font-black mt-1 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{paidAccountsCount}</span>
          </h4>
        </div>
      </div>

      {/* ---------------- REGISTER / EDIT SHOP MODAL ---------------- */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setEditorOpen(false)} />
          <div className="relative z-10 flex min-h-full w-full items-start justify-center p-4 text-center">
            <div className="relative my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg text-left shadow-2xl animate-fade-in-up text-xs z-10">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
              <Store className="w-5 h-5 text-saffron" />
              <span>{editId ? 'Modify Shop Profile' : 'Register New Shop / Outlet'}</span>
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                  <label htmlFor="contact-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Customer / Contact Person *</label>
                  <input
                    id="contact-name-input"
                    type="text"
                    placeholder="e.g. Ramesh Shetty"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cust-classification-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Customer Classification *</label>
                  <select
                    id="cust-classification-select"
                    value={customerClassification}
                    onChange={(e) => setCustomerClassification(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Direct Customer">Direct Customer</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="customer-phone-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone Number (Optional)</label>
                  <input
                    id="customer-phone-input"
                    type="text"
                    placeholder="e.g. +91 9900112233"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cust-address-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Outlet Address (Optional)</label>
                <input
                  id="cust-address-input"
                  type="text"
                  placeholder="e.g. Brahmavar, Karnataka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div>
                <label htmlFor="remarks-textarea" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Remarks / Notes (Optional)</label>
                <textarea
                  id="remarks-textarea"
                  placeholder="Notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
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
      </div>
      )}

      {/* ---------------- COLLECT DUES PAYMENT MODAL ---------------- */}
      {paymentModalOpen && selectedShopForPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setPaymentModalOpen(false)} />
          <div className="relative z-10 flex min-h-full w-full items-start justify-center p-4 text-center">
            <div className="relative my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md text-left shadow-2xl animate-fade-in-up text-xs z-10 space-y-4">
              <h3 className="text-base font-bold border-b pb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>Collect Payment from {selectedShopForPayment.shopName}</span>
              </h3>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl space-y-1">
                <p className="text-slate-500 font-semibold">Contact: <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedShopForPayment.contactName}</span></p>
                <p className="text-slate-500 font-semibold">Current Outstanding Dues: <span className="text-red-500 font-black">₹{selectedShopForPayment.outstandingDues.toFixed(2)}</span></p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label htmlFor="collection-amt-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Amount Collected (₹) *</label>
                  <input
                    id="collection-amt-input"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount collected"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="collection-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Payment Date *</label>
                  <input
                    id="collection-date-input"
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="collection-notes-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Notes / Reference (Optional)</label>
                  <input
                    id="collection-notes-input"
                    type="text"
                    placeholder="e.g. Cash / UPI payment reference"
                    value={collectionNotes}
                    onChange={(e) => setCollectionNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SHOP DIRECTORY TABLE ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden">
        <h4 className="font-bold text-sm mb-4 text-slate-750 dark:text-slate-300">Registered Shop Outlets & Dues Directory</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Shop / Outlet</th>
                <th className="py-3 px-2">Contact Person</th>
                <th className="py-3 px-2">Classification</th>
                <th className="py-3 px-2">Phone Number</th>
                <th className="py-3 px-2">Address</th>
                <th className="py-3 px-2 text-center">Pouches Bought</th>
                <th className="py-3 px-2 text-right">Total Purchases</th>
                <th className="py-3 px-2 text-right">Outstanding Dues</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shopStats.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-slate-400">
                    No shops registered yet. Click "Register New Shop / Outlet" to add client profiles.
                  </td>
                </tr>
              ) : (
                shopStats.map((c) => {
                  const hasDues = c.outstandingDues > 0;
                  return (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                      <td className="py-3 px-2 font-black text-slate-800 dark:text-white">{c.shopName}</td>
                      <td className="py-3 px-2 font-semibold text-slate-600 dark:text-slate-350">{c.contactName}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          c.customerClassification === 'Wholesaler'
                            ? 'bg-purple-500/10 text-purple-500'
                            : c.customerClassification === 'Distributor'
                              ? 'bg-blue-500/10 text-blue-500'
                              : c.customerClassification === 'Retailer'
                                ? 'bg-teal-500/10 text-teal-500'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {c.customerClassification}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">{c.phoneNumber || '—'}</td>
                      <td className="py-3 px-2 text-slate-500 max-w-[150px] truncate">{c.address || '—'}</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{c.totalPouches} packs</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-800 dark:text-white">₹{c.totalReceivables.toFixed(2)}</td>
                      <td className={`py-3 px-2 text-right font-black ${hasDues ? 'text-red-500' : 'text-slate-400'}`}>
                        ₹{c.outstandingDues.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          !hasDues ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {!hasDues ? 'Paid Up' : 'Dues Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCollectDuesClick(c)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"
                          title="Collect Dues Payment"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl transition-colors"
                          title="Edit Shop Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.shopName)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Delete Shop Profile"
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
  );
}
