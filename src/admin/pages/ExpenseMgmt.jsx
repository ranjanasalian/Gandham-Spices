import { useState, useEffect } from 'react';
import { api } from '../api';
import { Wallet, Plus, AlertCircle, CheckCircle2, DollarSign, RefreshCw, Trash2, PieChart } from 'lucide-react';

export default function ExpenseMgmt() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Miscellaneous');
  const [date, setDate] = useState('2026-07-20');
  const [description, setDescription] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.expenses.getAll();
      setExpenses(data.sort((a,b) => b.date.localeCompare(a.date)));
    } catch (err) {
      setError('Failed to fetch expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || !date || !description) {
      setError('Please provide amount, date, and description details');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(amount),
        category,
        date,
        description
      };

      await api.expenses.create(payload);
      setSuccess('Expense record logged successfully.');
      
      // Reset Form
      setAmount('');
      setDescription('');
      
      // Reload
      fetchExpenses();
    } catch (err) {
      setError('Failed to log expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    setError('');
    setSuccess('');
    try {
      await api.expenses.delete(id);
      setSuccess('Expense record removed.');
      fetchExpenses();
    } catch (err) {
      setError('Failed to delete expense record');
    }
  };

  // Calculations
  const calculateTotal = () => {
    return expenses.reduce((acc, e) => acc + e.amount, 0);
  };

  // Group by category helper
  const categoryBreakdown = () => {
    const map = {};
    expenses.forEach(e => {
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += e.amount;
    });
    return Object.entries(map).sort((a,b) => b[1] - a[1]);
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
      
      {/* ---------------- OVERVIEW CARDS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Expense card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Gross business expenses</p>
            <h3 className="text-2xl font-black mt-1 text-red-500">₹{calculateTotal().toFixed(2)}</h3>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">{expenses.length} ledger transactions logged</span>
          </div>
          <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Category breakdown summary */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-3">
          <h4 className="font-bold flex items-center gap-1.5 border-b pb-1.5 dark:border-slate-800">
            <PieChart className="w-4 h-4 text-saffron" />
            <span>Operational Cost Breakdown</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryBreakdown().map(([cat, total]) => (
              <div key={cat} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-800 rounded-xl">
                <span className="text-slate-400 font-semibold uppercase text-[9px] block tracking-wide">{cat}</span>
                <span className="font-black text-xs block mt-0.5">₹{total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ---------------- EXPENSE LOGGER FORM ---------------- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Plus className="w-5 h-5 text-saffron" />
            <span>Record Business Expense</span>
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
              <label htmlFor="expense-amount-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Expense Amount (₹) *</label>
              <input
                id="expense-amount-input"
                type="number"
                step="0.01"
                placeholder="Total cost"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expense-category-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Cost Category *</label>
                <select
                  id="expense-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                >
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Printing">Printing</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Labour">Labour</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label htmlFor="expense-date-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Bill Date *</label>
                <input
                  id="expense-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expense-desc-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Description *</label>
              <textarea
                id="expense-desc-input"
                placeholder="Explain the purchase or bill..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-saffron to-orange-500 text-white font-bold rounded-2xl hover:shadow active:scale-[0.98]"
            >
              Log Expense
            </button>
          </form>
        </div>

        {/* ---------------- EXPENSE LOG TABLE ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-full min-h-[400px]">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <Wallet className="w-5 h-5 text-saffron" />
            <span>Business Expenses Log</span>
          </h3>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                    <td className="py-3 px-2 font-semibold">{e.date}</td>
                    <td className="py-3 px-2">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg font-bold text-[10px] uppercase text-slate-500">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium max-w-[200px] truncate" title={e.description}>{e.description}</td>
                    <td className="py-3 px-2 text-right font-black text-slate-800 dark:text-white">₹{e.amount}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
