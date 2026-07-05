import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { useAuthStore } from '../../store/authStore';
import { ClockIcon, UserIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const ActivityLogsPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [filter, setFilter] = useState({ entityType: '', action: '' });
  const { logs, isLoading } = useActivityLogs(filter);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-success-600 bg-success-50';
    if (action.includes('UPDATE')) return 'text-primary-600 bg-primary-50';
    if (action.includes('DELETE')) return 'text-danger-600 bg-danger-50';
    if (action.includes('APPROVE')) return 'text-warning-600 bg-warning-50';
    return 'text-secondary-600 bg-secondary-50';
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <DocumentTextIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">{t('activityLogs.selectCompany')}</h2>
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
        <h1 className="text-2xl font-bold text-secondary-900">{t('activityLogs.title')}</h1>
        <div className="flex items-center gap-3">
          <select
            value={filter.entityType}
            onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
            className="form-input w-40"
          >
            <option value="">{t('activityLogs.allTypes')}</option>
            <option value="CUSTOMER">{t('activityLogs.customer')}</option>
            <option value="SUPPLIER">{t('activityLogs.supplier')}</option>
            <option value="INVOICE">{t('activityLogs.invoice')}</option>
            <option value="PURCHASE_ORDER">{t('activityLogs.purchaseOrder')}</option>
            <option value="EMPLOYEE">{t('activityLogs.employee')}</option>
          </select>
          <button onClick={() => setFilter({ entityType: '', action: '' })} className="btn-secondary flex items-center gap-2">
            <ArrowPathIcon className="w-4 h-4" />
            {t('common.reset')}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('activityLogs.time')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('activityLogs.user')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('activityLogs.action')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('activityLogs.entity')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('activityLogs.details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-secondary-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-700">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-secondary-400" />
                      {log.user?.firstName} {log.user?.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-600">
                    {log.entityType} {log.entityId && <span className="text-xs text-secondary-400">({log.entityId.slice(0, 8)}...)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-500 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
