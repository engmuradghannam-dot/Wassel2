import { useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, CubeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useMRP, useMRPRun } from '../../hooks/useMRP';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';

export const MRPPage = () => {
  const { selectedCompany } = useAuthStore();
  const { runs, isLoading, runMRP, isRunning, convertPlannedOrder } = useMRP();
  const { suppliers } = useSuppliers();
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [convertingOrderId, setConvertingOrderId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState('');

  const { run } = useMRPRun(selectedRunId || runs[0]?.id);
  const activeRun = run || runs[0];

  const handleRunMRP = async () => {
    const res: any = await runMRP({ planningHorizonDays: 30 });
    if (res?.data?.id) setSelectedRunId(res.data.id);
  };

  const handleConvert = async () => {
    if (!convertingOrderId || !supplierId) return;
    await convertPlannedOrder({ id: convertingOrderId, supplierId });
    setConvertingOrderId(null);
    setSupplierId('');
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <CubeIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">Select a company first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Material Requirements Planning</h1>
        <button onClick={handleRunMRP} disabled={isRunning} className="btn-primary flex items-center gap-2">
          <ArrowPathIcon className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run MRP'}
        </button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Runs</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : runs.length === 0 ? (
          <p className="text-secondary-500 text-center py-8">No MRP runs yet. Click "Run MRP" to analyze stock shortages.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {runs.map((r: any) => (
              <button
                key={r.id}
                onClick={() => setSelectedRunId(r.id)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  (selectedRunId || runs[0]?.id) === r.id ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                {new Date(r.runDate).toLocaleString()} — {r.status}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeRun && (
        <>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-warning-600" />
              Exceptions ({activeRun.exceptions?.length || 0})
            </h2>
            {(!activeRun.exceptions || activeRun.exceptions.length === 0) ? (
              <p className="text-secondary-500 text-center py-6">No shortages detected. Stock levels are healthy.</p>
            ) : (
              <div className="space-y-2">
                {activeRun.exceptions.map((ex: any) => (
                  <div key={ex.id} className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{ex.item?.name}</div>
                      <div className="text-xs text-secondary-500">{ex.message}</div>
                    </div>
                    <span className="text-sm font-semibold text-warning-700">{Number(ex.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-primary-600" />
              Planned Orders ({activeRun.plannedOrders?.length || 0})
            </h2>
            {(!activeRun.plannedOrders || activeRun.plannedOrders.length === 0) ? (
              <p className="text-secondary-500 text-center py-6">No planned orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Suggested Date</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {activeRun.plannedOrders.map((po: any) => (
                      <tr key={po.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-3 text-sm font-medium">{po.item?.name}</td>
                        <td className="px-4 py-3 text-sm">{Number(po.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-secondary-600">{new Date(po.suggestedDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            po.status === 'CONVERTED' ? 'bg-success-50 text-success-700' : 'bg-secondary-100 text-secondary-700'
                          }`}>{po.status}</span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          {po.status === 'PLANNED' && (
                            <button onClick={() => setConvertingOrderId(po.id)} className="btn-secondary text-xs py-1 px-3">
                              Convert to PO
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal isOpen={!!convertingOrderId} onClose={() => setConvertingOrderId(null)} title="Convert to Purchase Order">
        <div className="space-y-4">
          <div>
            <label className="form-label">Supplier</label>
            <select className="form-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Select supplier...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setConvertingOrderId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleConvert} disabled={!supplierId} className="btn-primary">Create Purchase Order</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
