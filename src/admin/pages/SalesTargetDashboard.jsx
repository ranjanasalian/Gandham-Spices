import { useState, useEffect } from 'react';
import { api } from '../api';
import { Target, Plus, AlertCircle, CheckCircle2, DollarSign, RefreshCw, BarChart2 } from 'lucide-react';

export default function SalesTargetDashboard({ isDarkMode }) {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Target setter form
  const [period, setPeriod] = useState('2026-07');
  const [targetRevenue, setTargetRevenue] = useState('');

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const data = await api.targets.getAll();
      setTargets(data);
    } catch (err) {
      setError('Failed to fetch sales targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!targetRevenue || isNaN(targetRevenue) || parseFloat(targetRevenue) <= 0) {
      setError('Please provide a valid target revenue');
      return;
    }

    try {
      await api.targets.save(period, targetRevenue);
      setSuccess(`Target for ${period} updated successfully.`);
      setTargetRevenue('');
      fetchTargets();
    } catch (err) {
      setError('Failed to save sales target');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-saffron" />
      </div>
    );
  }

  // Active target calculations (Current month is July 2026)
  const activeTarget = targets.find(t => t.period === '2026-07') || { period: '2026-07', targetRevenue: 50000, currentRevenue: 10925 };
  const percentage = Math.round(Math.min(100, (activeTarget.currentRevenue / activeTarget.targetRevenue) * 100)) || 0;
  const remaining = Math.max(0, activeTarget.targetRevenue - activeTarget.currentRevenue);

  return (
    <div className="space-y-8 font-body text-left">
      
      {/* ---------------- ACTIVE TARGET SNAPSHOT ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm text-xs space-y-6">
        <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <Target className="w-5 h-5 text-saffron" />
            <span>Target Progress for Month ({activeTarget.period})</span>
          </h3>
          <span className="font-black text-saffron bg-saffron/10 px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">July 2026 Goal</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Goal Target Revenue</span>
            <h4 className="text-lg font-black">₹{activeTarget.targetRevenue.toFixed(2)}</h4>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Revenue Accomplished</span>
            <h4 className="text-lg font-black text-emerald-500">₹{activeTarget.currentRevenue.toFixed(2)}</h4>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Remaining Target Dues</span>
            <h4 className="text-lg font-black text-amber-500">₹{remaining.toFixed(2)}</h4>
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="space-y-2">
          <div className="flex justify-between font-bold">
            <span>Overall Progress Completion:</span>
            <span className="text-saffron">{percentage}% Achieved</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-5 rounded-full overflow-hidden p-1 border dark:border-slate-800">
            <div
              className="bg-gradient-to-r from-saffron to-orange-500 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-black text-white"
              style={{ width: `${percentage}%` }}
            >
              {percentage > 10 && `${percentage}%`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ---------------- SET TARGET FORM ---------------- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm h-fit">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 border-b pb-2">
            <Plus className="w-5 h-5 text-saffron" />
            <span>Configure Target Goal</span>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="target-period-select" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Target Period *</label>
                <select
                  id="target-period-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none"
                >
                  <option value="2026-07">2026-07 (July)</option>
                  <option value="2026-08">2026-08 (August)</option>
                  <option value="2026-09">2026-09 (September)</option>
                  <option value="2026-10">2026-10 (October)</option>
                  <option value="2026-11">2026-11 (November)</option>
                  <option value="2026-12">2026-12 (December)</option>
                </select>
              </div>
              <div>
                <label htmlFor="target-rev-input" className="block font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Revenue Goal (₹) *</label>
                <input
                  id="target-rev-input"
                  type="number"
                  placeholder="Target revenue ₹"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-saffron"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-saffron to-orange-500 text-white font-bold rounded-2xl hover:shadow active:scale-[0.98]"
            >
              Update Goal Target
            </button>
          </form>
        </div>

        {/* ---------------- HISTORICAL TARGETS LOG ---------------- */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-full min-h-[300px]">
          <h3 className="text-base font-bold flex items-center gap-2 mb-6 border-b pb-2">
            <BarChart2 className="w-5 h-5 text-saffron" />
            <span>Target Goal History Logs</span>
          </h3>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Period</th>
                  <th className="py-3 px-2 text-right">Goal Target</th>
                  <th className="py-3 px-2 text-right text-emerald-500">Accomplished</th>
                  <th className="py-3 px-2 text-center">Progress Completion</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => {
                  const pct = Math.round(Math.min(100, (t.currentRevenue / t.targetRevenue) * 100)) || 0;
                  return (
                    <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-100/5 transition-colors">
                      <td className="py-3 px-2 font-black text-slate-800 dark:text-white">{t.period}</td>
                      <td className="py-3 px-2 text-right font-semibold">₹{t.targetRevenue}</td>
                      <td className="py-3 px-2 text-right font-black text-emerald-500">₹{t.currentRevenue.toFixed(2)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${pct >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-saffron/10 text-saffron'}`}>
                          {pct}% Done
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
