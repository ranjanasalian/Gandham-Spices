import { useState, useEffect } from 'react';
import { api } from '../api';
import { Store, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, User, Phone, MapPin, RefreshCw, DollarSign, Package, Clock, Users } from 'lucide-react';

export default function ShopCustomerMgmt() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [date, setDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [shopName, setShopName] = useState('');
  const [customerClassification, setCustomerClassification] = useState('Retailer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [productId, setProductId] = useState('');
  const [quantityGiven, setQuantityGiven] = useState('');
  const [amountReceived, setAmountReceived] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [paymentDate, setPaymentDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const cData = await api.customers.getAll();
      setCustomers(cData);
      const pData = await api.products.getAll();
      setProducts(pData);
    } catch (err) {
      setError('Failed to fetch ledger information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewClick = () => {
    setEditId(null);
    setDate('');
    setContactName('');
    setShopName('');
    setCustomerClassification('Retailer');
    setPhoneNumber('');
    setAddress('');
    setProductId('');
    setQuantityGiven('');
    setAmountReceived('0');
    setPaymentStatus('Pending');
    setPaymentDate('');
    setRemarks('');
    setEditorOpen(true);
  };

  const handleEditClick = (c) => {
    setEditId(c.id);
    setDate(c.date || '');
    setContactName(c.contactName || '');
    setShopName(c.shopName || '');
    setCustomerClassification(c.customerClassification || 'Retailer');
    setPhoneNumber(c.phoneNumber || '');
    setAddress(c.address || '');
    setProductId(c.productId || '');
    setQuantityGiven((c.quantityGiven || 0).toString());
    setAmountReceived((c.amountReceived || 0).toString());
    setPaymentStatus(c.paymentStatus || 'Pending');
    setPaymentDate(c.paymentDate || '');
    setRemarks(c.remarks || '');
    setEditorOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!date) {
      setError('Please select a Transaction Date');
      return;
    }
    if (!contactName || !shopName) {
      setError('Contact Name and Shop Name are required');
      return;
    }
    if (!productId) {
      setError('Please select a Product');
      return;
    }
    if (!quantityGiven || parseInt(quantityGiven, 10) <= 0) {
      setError('Please provide a valid quantity of pouches supplied');
      return;
    }

    try {
      const payload = {
        date,
        contactName,
        shopName,
        customerClassification,
        phoneNumber,
        address,
        productId,
        quantityGiven: parseInt(quantityGiven, 10),
        amountReceived: parseFloat(amountReceived || 0),
        paymentStatus,
        paymentDate,
        remarks
      };

      if (editId) {
        await api.customers.update(editId, payload);
        setSuccess('Customer supply transaction saved.');
      } else {
        await api.customers.create(payload);
        setSuccess(`Supply recorded to "${shopName}" successfully.`);
      }

      setEditorOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer supply transaction? This will reverse inventory counts.')) return;
    setError('');
    setSuccess('');
    try {
      await api.customers.delete(id);
      setSuccess('Transaction deleted successfully.');
      loadData();
    } catch (err) {
      setError('Failed to delete customer supply transaction');
    }
  };

  // Real-time pricing calculations
  const selectedProduct = products.find(p => p.id === productId);
  const wholesalePriceVal = selectedProduct ? selectedProduct.wholesalePrice : 0;
  const packSizeVal = selectedProduct ? selectedProduct.packSize : '—';
  
  const calculatedReceivable = parseFloat((wholesalePriceVal * (parseInt(quantityGiven, 10) || 0)).toFixed(2));
  const calculatedBalance = parseFloat((calculatedReceivable - (parseFloat(amountReceived) || 0)).toFixed(2));

  // Auto update status based on balance
  useEffect(() => {
    if (calculatedBalance <= 0 && calculatedReceivable > 0) {
      setPaymentStatus('Paid');
    } else {
      setPaymentStatus('Pending');
    }
  }, [calculatedBalance, calculatedReceivable]);

  // Dashboard calculation aggregates
  const uniqueShops = Array.from(new Set(customers.map(c => c.shopName?.toLowerCase().trim()).filter(Boolean)));
  const totalCustomers = uniqueShops.length;
  
  const totalPouchesSupplied = customers.reduce((acc, c) => acc + (c.quantityGiven || 0), 0);
  
  const totalRevenueReceived = customers.reduce((acc, c) => {
    if (c.paymentStatus === 'Paid') {
      return acc + (c.totalAmountReceivable || 0);
    } else {
      return acc + (c.amountReceived || 0);
    }
  }, 0);

  const totalOutstandingAmount = customers.reduce((acc, c) => acc + (c.balanceAmount || 0), 0);

  const pendingShops = new Set(
    customers.filter(c => c.paymentStatus === 'Pending').map(c => c.shopName?.toLowerCase().trim()).filter(Boolean)
  );
  const numPendingCustomers = pendingShops.size;

  let numPaidCustomers = 0;
  uniqueShops.forEach(shop => {
    const shopEntries = customers.filter(c => c.shopName?.toLowerCase().trim() === shop);
    const hasPending = shopEntries.some(c => c.paymentStatus === 'Pending');
    if (!hasPending && shopEntries.length > 0) {
      numPaidCustomers++;
    }
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
          <Store className="w-6 h-6 text-saffron" />
          <span>Shop & Customer Management Ledger</span>
        </h3>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Supply Transaction</span>
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

      {/* ---------------- DASHBOARD SUMMARY METRICS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Shops</p>
          <h4 className="text-lg font-black mt-1 text-slate-800 dark:text-white flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span>{totalCustomers}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pouches Supplied</p>
          <h4 className="text-lg font-black mt-1 text-slate-800 dark:text-white flex items-center gap-1">
            <Package className="w-4 h-4 text-orange-500" />
            <span>{totalPouchesSupplied}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</p>
          <h4 className="text-lg font-black mt-1 text-emerald-500 flex items-center gap-0.5">
            <span>₹</span><span>{totalRevenueReceived.toFixed(2)}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Dues</p>
          <h4 className="text-lg font-black mt-1 text-red-500 flex items-center gap-0.5">
            <span>₹</span><span>{totalOutstandingAmount.toFixed(2)}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pending Accounts</p>
          <h4 className="text-lg font-black mt-1 text-red-400 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{numPendingCustomers}</span>
          </h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Paid Accounts</p>
          <h4 className="text-lg font-black mt-1 text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{numPaidCustomers}</span>
          </h4>
        </div>
      </div>

      {/* ---------------- FORM MODAL (ADD / EDIT) ---------------- */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-0" onClick={() => setEditorOpen(false)} />
          <div className="relative z-10 flex min-h-full w-full items-start justify-center p-4 text-center">
            <div className="relative my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg text-left shadow-2xl animate-fade-in-up text-xs z-10">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
              <Store className="w-5 h-5 text-saffron" />
              <span>{editId ? 'Modify Supply Record' : 'Record Supply Transaction'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sales-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Supply Date *</label>
                  <input
                    id="sales-date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
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
              </div>

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
                  <label htmlFor="contact-name-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Customer / Contact Name *</label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sales-product-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Product Supplied *</label>
                  <select
                    id="sales-product-select"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  >
                    <option value="">Select product item</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pouch-size-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Pouch Size</label>
                  <input
                    id="pouch-size-input"
                    type="text"
                    value={packSizeVal}
                    readOnly
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-slate-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Quantity Supplied (pouches) *</label>
                  <input
                    id="quantity-input"
                    type="number"
                    placeholder="e.g. 50"
                    value={quantityGiven}
                    onChange={(e) => setQuantityGiven(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
                <div>
                  <label htmlFor="amount-received-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Amount Received (₹)</label>
                  <input
                    id="amount-received-input"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                  />
                </div>
              </div>

              {/* Real-time pricing computations */}
              <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-800 p-3 rounded-2xl space-y-2 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">Wholesale Price (per pouch):</span>
                  <span className="text-slate-800 dark:text-slate-350">₹{wholesalePriceVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Receivable:</span>
                  <span className="font-bold text-indigo-500">₹{calculatedReceivable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t dark:border-slate-800 pt-1.5 text-sm">
                  <span className="text-slate-500">Outstanding Balance Dues:</span>
                  <span className={`font-black ${calculatedBalance > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    ₹{calculatedBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="payment-status-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Payment Status</label>
                  <select
                    id="payment-status-select"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                    disabled={calculatedBalance <= 0}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="payment-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Payment Clearance Date (Optional)</label>
                  <input
                    id="payment-date-input"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="remarks-textarea" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Remarks (Optional)</label>
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
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saffron text-white rounded-xl font-bold hover:bg-orange-500"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* ---------------- TRANSACTION LEDGER TABLE LIST ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm overflow-hidden">
        <h4 className="font-bold text-sm mb-4 text-slate-750 dark:text-slate-300">Shop Supply & Outstanding Ledger Feed</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Shop / Outlet</th>
                <th className="py-3 px-2">Contact Person</th>
                <th className="py-3 px-2">Classification</th>
                <th className="py-3 px-2">Product Name</th>
                <th className="py-3 px-2 text-center">Pouch Size</th>
                <th className="py-3 px-2 text-center">Qty Supplied</th>
                <th className="py-3 px-2 text-right">Wholesale Rate</th>
                <th className="py-3 px-2 text-right">Receivable</th>
                <th className="py-3 px-2 text-right">Received</th>
                <th className="py-3 px-2 text-right">Balance Due</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center py-10 text-slate-400">
                    No transactions recorded. Record a supply transaction above to start tracking.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const hasDues = c.balanceAmount > 0;
                  return (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                      <td className="py-3 px-2 text-slate-500 font-semibold">{c.date}</td>
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
                      <td className="py-3 px-2 font-bold">{c.productName}</td>
                      <td className="py-3 px-2 text-center text-slate-500 font-semibold">{c.packSize}</td>
                      <td className="py-3 px-2 text-center font-black text-slate-700 dark:text-slate-300">{c.quantityGiven} pouches</td>
                      <td className="py-3 px-2 text-right font-medium text-slate-500">₹{c.wholesalePrice}</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-800 dark:text-white">₹{c.totalAmountReceivable}</td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-500">₹{c.amountReceived}</td>
                      <td className={`py-3 px-2 text-right font-black ${hasDues ? 'text-red-500' : 'text-slate-400'}`}>
                        ₹{c.balanceAmount}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {c.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="p-1.5 text-slate-400 hover:text-saffron hover:bg-saffron/10 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
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
