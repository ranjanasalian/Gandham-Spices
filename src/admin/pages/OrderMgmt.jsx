import { useState, useEffect } from 'react';
import { api } from '../api';
import { ArrowRightLeft, ArrowRight, Clock, FileSpreadsheet, RefreshCw, ChevronRight } from 'lucide-react';

export default function OrderMgmt() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const oData = await api.orders.getAll();
      setOrders(oData);
      const cData = await api.customers.getAll();
      setCustomers(cData);
    } catch (err) {
      setError('Failed to fetch order archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pipelineStages = ['New Order', 'Processing', 'Packed', 'Dispatched', 'Delivered', 'Paid'];

  const handleStageShift = async (id, currentStage) => {
    const nextIdx = pipelineStages.indexOf(currentStage) + 1;
    if (nextIdx >= pipelineStages.length) return;

    setError('');
    setSuccess('');
    const nextStage = pipelineStages[nextIdx];
    
    try {
      await api.orders.update(id, { status: nextStage });
      setSuccess(`Order updated to: ${nextStage}`);
      loadData();
    } catch (err) {
      setError('Failed to shift order stage');
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
      
      {/* ---------------- PIPELINE TRACKER BOARD ---------------- */}
      <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-6 h-6 text-saffron" />
        <span>Order Workflow Pipeline</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageOrders = orders.filter(o => o.status === stage);
          return (
            <div
              key={stage}
              className="bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[400px] min-w-[170px]"
            >
              {/* Stage Header */}
              <div className="border-b pb-2 mb-3 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
                <span className="font-bold text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{stage}</span>
                <span className="text-[10px] bg-saffron/10 text-saffron px-2 py-0.5 rounded-full font-bold">{stageOrders.length}</span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 text-xs">
                {stageOrders.map((ord) => {
                  const cust = customers.find(c => c.id === ord.customerId);
                  const showShift = stage !== 'Paid';
                  return (
                    <div
                      key={ord.id}
                      className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-800 p-3 rounded-xl shadow-xs space-y-2 hover:shadow-sm transition-shadow text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-saffron">{ord.invoiceNumber}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{ord.orderDate.substring(5)}</span>
                      </div>
                      <div>
                        <p className="font-bold truncate" title={cust?.shopName}>{cust ? cust.shopName : 'Direct Customer'}</p>
                        {ord.notes && <p className="text-[9px] text-slate-400 dark:text-slate-400 italic mt-0.5 truncate" title={ord.notes}>{ord.notes}</p>}
                      </div>

                      {showShift && (
                        <button
                          onClick={() => handleStageShift(ord.id, ord.status)}
                          className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 px-2 bg-saffron/10 hover:bg-saffron text-saffron hover:text-white font-bold text-[10px] rounded-lg transition-colors border border-saffron/20"
                        >
                          <span>Progress</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
