import { useState, FormEvent } from 'react';
import { BeakerIcon, QrCodeIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useBatches, useSerialNumbers } from '../../hooks/useInventoryTracking';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';

type Tab = 'batches' | 'serials';

const emptyBatch = { itemId: '', batchNumber: '', initialQuantity: 0, expiryDate: '' };

export const InventoryTrackingPage = () => {
  const { selectedCompany } = useAuthStore();
  const [tab, setTab] = useState<Tab>('batches');
  const [modalOpen, setModalOpen] = useState(false);

  const { items } = useItems();
  const { batches, isLoading: batchesLoading, createBatch, deleteBatch } = useBatches();
  const { serialNumbers, isLoading: serialsLoading, bulkCreate, deleteSerial } = useSerialNumbers();

  const [batchForm, setBatchForm] = useState(emptyBatch);
  const [serialForm, setSerialForm] = useState({ itemId: '', serials: '' });

  const isExpiringSoon = (date: string) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };
  const isExpired = (date: string) => date && new Date(date).getTime() < Date.now();

  const handleAddBatch = async (e: FormEvent) => {
    e.preventDefault();
    await createBatch({
      ...batchForm,
      initialQuantity: Number(batchForm.initialQuantity),
      expiryDate: batchForm.expiryDate ? new Date(batchForm.expiryDate).toISOString() : undefined,
    });
    setBatchForm(emptyBatch);
    setModalOpen(false);
  };

  const handleAddSerials = async (e: FormEvent) => {
    e.preventDefault();
    const serials = serialForm.serials.split('\n').map((s) => s.trim()).filter(Boolean);
    await bulkCreate({ itemId: serialForm.itemId, serials });
    setSerialForm({ itemId: '', serials: '' });
    setModalOpen(false);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <BeakerIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">Select a company first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Batch & Serial Number Tracking</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Add
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 border-b border-secondary-200 mb-4">
          <button onClick={() => setTab('batches')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${tab === 'batches' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500'}`}>
            <BeakerIcon className="w-4 h-4" /> Batches
          </button>
          <button onClick={() => setTab('serials')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${tab === 'serials' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500'}`}>
            <QrCodeIcon className="w-4 h-4" /> Serial Numbers
          </button>
        </div>

        {tab === 'batches' && (
          batchesLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Batch #</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Qty Remaining</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {batches.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-secondary-500">No batches registered</td></tr>}
                  {batches.map((b: any) => (
                    <tr key={b.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 text-sm font-medium font-mono">{b.batchNumber}</td>
                      <td className="px-4 py-3 text-sm">{b.item?.name}</td>
                      <td className="px-4 py-3 text-sm">{Number(b.currentQuantity).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        {b.expiryDate ? (
                          <span className={`flex items-center gap-1 ${isExpired(b.expiryDate) ? 'text-danger-600' : isExpiringSoon(b.expiryDate) ? 'text-warning-600' : 'text-secondary-600'}`}>
                            {(isExpired(b.expiryDate) || isExpiringSoon(b.expiryDate)) && <ExclamationTriangleIcon className="w-4 h-4" />}
                            {new Date(b.expiryDate).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium">{b.status}</span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button onClick={() => deleteBatch(b.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'serials' && (
          serialsLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Serial No</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {serialNumbers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-secondary-500">No serial numbers registered</td></tr>}
                  {serialNumbers.map((s: any) => (
                    <tr key={s.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 text-sm font-mono">{s.serialNo}</td>
                      <td className="px-4 py-3 text-sm">{s.item?.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.status === 'AVAILABLE' ? 'bg-success-50 text-success-700' :
                          s.status === 'SOLD' ? 'bg-secondary-100 text-secondary-700' :
                          s.status === 'DEFECTIVE' ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button onClick={() => deleteSerial(s.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={tab === 'batches' ? 'Register Batch' : 'Register Serial Numbers'}>
        {tab === 'batches' ? (
          <form onSubmit={handleAddBatch} className="space-y-4">
            <div>
              <label className="form-label">Item</label>
              <select className="form-input" required value={batchForm.itemId} onChange={(e) => setBatchForm({ ...batchForm, itemId: e.target.value })}>
                <option value="">Select item...</option>
                {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Batch Number</label>
              <input className="form-input" required value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Initial Quantity</label>
                <input type="number" className="form-input" required value={batchForm.initialQuantity} onChange={(e) => setBatchForm({ ...batchForm, initialQuantity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddSerials} className="space-y-4">
            <div>
              <label className="form-label">Item</label>
              <select className="form-input" required value={serialForm.itemId} onChange={(e) => setSerialForm({ ...serialForm, itemId: e.target.value })}>
                <option value="">Select item...</option>
                {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Serial Numbers (one per line)</label>
              <textarea className="form-input font-mono" rows={6} required placeholder="SN-0001&#10;SN-0002&#10;SN-0003" value={serialForm.serials} onChange={(e) => setSerialForm({ ...serialForm, serials: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Register</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
