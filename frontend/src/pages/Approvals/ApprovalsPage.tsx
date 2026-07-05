import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApprovals } from '../../hooks/useApprovals';
import { useAuthStore } from '../../store/authStore';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export const ApprovalsPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const { workflows, pending, isLoading, processApproval } = useApprovals();
  const [activeTab, setActiveTab] = useState<'pending' | 'workflows'>('pending');

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    await processApproval({ id, data: { action, comment: '' } });
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <DocumentTextIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">{t('approvals.selectCompany')}</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">{t('approvals.title')}</h1>
        <div className="flex items-center gap-2 bg-secondary-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'pending' ? 'bg-white text-primary-700 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            {t('approvals.pending')} ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'workflows' ? 'bg-white text-primary-700 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            {t('approvals.workflows')}
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="card">
          {pending.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-16 h-16 mx-auto text-success-300 mb-4" />
              <h3 className="text-lg font-medium text-secondary-600">{t('approvals.noPending')}</h3>
              <p className="text-secondary-400">{t('approvals.allCaughtUp')}</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {pending.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-secondary-50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <ClockIcon className="w-5 h-5 text-warning-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900">{item.title}</p>
                    <p className="text-sm text-secondary-500 mt-1">{item.message}</p>
                    <p className="text-xs text-secondary-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(item.id, 'APPROVE')}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-success-700 bg-success-50 hover:bg-success-100 rounded-lg transition-colors"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      {t('common.approve')}
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'REJECT')}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-danger-700 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      {t('common.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="card">
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
              <h3 className="text-lg font-medium text-secondary-600">{t('approvals.noWorkflows')}</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('approvals.name')}</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('approvals.documentType')}</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('approvals.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {workflows.map((wf: any) => (
                    <tr key={wf.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-secondary-900">{wf.name}</td>
                      <td className="px-4 py-3 text-sm text-secondary-600">{wf.documentType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          wf.isActive ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-600'
                        }`}>
                          {wf.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
