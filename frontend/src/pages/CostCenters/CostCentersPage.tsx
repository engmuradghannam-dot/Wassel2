import { useState, FormEvent } from 'react';
import { ChartPieIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCostCenters } from '../../hooks/useCostCenters';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { costCenterApi } from '../../services/api';

const emptyForm = { code: '', name: '', isGroup: false, parentId: '' };

export const CostCentersPage = () => {
  const { selectedCompany } = useAuthStore();
  const { costCenters, isLoading, createCostCenter, deleteCostCenter } = useCostCenters();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [reportFor, setReportFor] = useState<any>(null);
  const [report, setReport] = useState<any>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createCostCenter({ ...form, parentId: form.parentId || undefined });
    setForm(emptyForm);
    setModalOpen(false);
  };

  const viewReport = async (cc: any) => {
    setReportFor(cc);
    const res: any = await costCenterApi.getReport(cc.id);
    setReport(res.data);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <ChartPieIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">Select a company first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Cost Centers</h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Add Cost Center
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Entries</th>
                  <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {costCenters.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-secondary-500">No cost centers yet</td></tr>}
                {costCenters.map((cc: any) => (
                  <tr key={cc.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{cc.code}</td>
                    <td className="px-4 py-3 text-sm">{cc.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs">{cc.isGroup ? 'Group' : 'Detail'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{cc._count?.journalEntryLines || 0}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => viewReport(cc)} className="btn-secondary text-xs py-1 px-3">Report</button>
                        <button onClick={() => deleteCostCenter(cc.id)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Cost Center">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Code</label>
              <input className="form-input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Name</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">Parent Cost Center</label>
            <select className="form-input" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">None (top level)</option>
              {costCenters.filter((c: any) => c.isGroup).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isGroup} onChange={(e) => setForm({ ...form, isGroup: e.target.checked })} />
            This is a group (can have children, no direct postings)
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!reportFor} onClose={() => { setReportFor(null); setReport(null); }} title={`Report: ${reportFor?.name || ''}`}>
        {!report ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between p-4 bg-primary-50 rounded-lg">
              <span className="font-medium">Total Posted Amount</span>
              <span className="text-xl font-bold text-primary-700">{report.totalAmount.toLocaleString()} SAR</span>
            </div>
            <p className="text-sm text-secondary-500">{report.entryCount} journal entry lines</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
