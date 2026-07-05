import { useState } from 'react';
import { BuildingLibraryIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useCompanies } from '../../hooks/useCompanies';
import { consolidationApi } from '../../services/api';
import { Modal } from '../../components/common/Modal';

export const ConsolidationPage = () => {
  const { companies, isLoading } = useCompanies();
  const [parentId, setParentId] = useState('');
  const [group, setGroup] = useState<any>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [subsidiaryId, setSubsidiaryId] = useState('');
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const loadGroup = async (id: string) => {
    setParentId(id);
    setBalanceSheet(null);
    const res: any = await consolidationApi.getGroup(id);
    setGroup(res.data);
  };

  const handleLink = async () => {
    if (!subsidiaryId || !parentId) return;
    await consolidationApi.setParent(subsidiaryId, { parentCompanyId: parentId });
    setLinkModalOpen(false);
    setSubsidiaryId('');
    loadGroup(parentId);
  };

  const loadBalanceSheet = async () => {
    if (!parentId) return;
    setLoadingBalance(true);
    try {
      const res: any = await consolidationApi.getBalanceSheet(parentId, {});
      setBalanceSheet(res.data);
    } finally {
      setLoadingBalance(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Company Group Consolidation</h1>
      </div>

      <div className="card">
        <label className="form-label">Parent (Group Holding) Company</label>
        <select className="form-input" value={parentId} onChange={(e) => loadGroup(e.target.value)} disabled={isLoading}>
          <option value="">Select company...</option>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!parentId ? (
        <div className="card text-center py-12">
          <BuildingLibraryIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700">Select a company to view or build its group structure</h2>
        </div>
      ) : group && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Subsidiaries of {group.name}</h2>
              <button onClick={() => setLinkModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
                <LinkIcon className="w-4 h-4" /> Link Subsidiary
              </button>
            </div>
            {(!group.subsidiaries || group.subsidiaries.length === 0) ? (
              <p className="text-secondary-500 text-center py-8">No subsidiaries linked yet</p>
            ) : (
              <div className="space-y-2">
                {group.subsidiaries.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-xs text-secondary-500">{s.currency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Consolidated Balance Sheet</h2>
              <button onClick={loadBalanceSheet} disabled={loadingBalance} className="btn-secondary text-sm">
                {loadingBalance ? 'Loading...' : 'Generate'}
              </button>
            </div>
            {!balanceSheet ? (
              <p className="text-secondary-500 text-center py-8">Click "Generate" to consolidate account balances across the group (1:1 exchange rate by default)</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Account</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Consolidated Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {balanceSheet.accounts.map((a: any, i: number) => (
                      <tr key={i} className="hover:bg-secondary-50">
                        <td className="px-4 py-3 text-sm font-medium">{a.account}</td>
                        <td className="px-4 py-3 text-sm text-secondary-600">{a.accountType}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{a.totalBalance.toLocaleString()} {group.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Link Subsidiary Company">
        <div className="space-y-4">
          <div>
            <label className="form-label">Subsidiary Company</label>
            <select className="form-input" value={subsidiaryId} onChange={(e) => setSubsidiaryId(e.target.value)}>
              <option value="">Select company...</option>
              {companies.filter((c: any) => c.id !== parentId).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-secondary-500">You must be a member of both companies (or a super admin) to link them.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setLinkModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleLink} disabled={!subsidiaryId} className="btn-primary">Link</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
