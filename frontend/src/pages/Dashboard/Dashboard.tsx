// MuradERP Dashboard Page
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useTranslation } from 'react-i18next';
import {
  UsersIcon,
  TruckIcon,
  CubeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { useDashboard } from '../../hooks/useDashboard';
import { useCompany } from '../../hooks/useCompany';
import { DashboardStats } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, color }: StatCardProps) => (
  <div className="card-hover">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-secondary-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-secondary-900">{value}</p>
        {trend !== undefined && (
          <div className={`mt-2 flex items-center gap-1 text-sm ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {trend >= 0 ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            )}
            <span>{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-secondary-400">{trendLabel}</span>}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const { t } = useTranslation();
  const { stats, statsLoading } = useDashboard();
  const { selectedCompany } = useCompany();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <BuildingOfficeIcon className="w-16 h-16 text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-900 mb-2">{t('dashboard.noCompany')}</h2>
        <p className="text-secondary-500">{t('dashboard.selectCompanyPrompt')}</p>
      </div>
    );
  }

  const counts: DashboardStats['counts'] = stats?.counts || {
    customers: 0, suppliers: 0, items: 0, employees: 0, invoices: 0, pendingInvoices: 0,
  };
  const financials: DashboardStats['financials'] = stats?.financials || {
    totalSales: 0, totalPurchases: 0,
  };
  const alerts: DashboardStats['alerts'] = stats?.alerts || { lowStock: 0, lowStockItems: [] };
  const recentActivity: DashboardStats['recentActivity'] = stats?.recentActivity || { invoices: [] };

  const statusLabel: Record<string, string> = {
    PAID: t('status.paid'),
    OVERDUE: t('status.overdue'),
    SUBMITTED: t('status.submitted'),
    DRAFT: t('status.draft'),
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-info">
            {selectedCompany.currency}
          </span>
          <span className="text-sm text-secondary-500">
            {t('dashboard.fiscalYear')}: {selectedCompany.fiscalYearStart} - {selectedCompany.fiscalYearEnd}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title={t('dashboard.customers')}
          value={counts.customers || 0}
          icon={UsersIcon}
          color="bg-primary-500"
          trend={12}
          trendLabel={t('dashboard.lastMonth')}
        />
        <StatCard
          title={t('dashboard.suppliers')}
          value={counts.suppliers || 0}
          icon={TruckIcon}
          color="bg-secondary-500"
        />
        <StatCard
          title={t('dashboard.items')}
          value={counts.items || 0}
          icon={CubeIcon}
          color="bg-warning-500"
        />
        <StatCard
          title={t('dashboard.employees')}
          value={counts.employees || 0}
          icon={UserGroupIcon}
          color="bg-success-500"
        />
        <StatCard
          title={t('dashboard.invoices')}
          value={counts.invoices || 0}
          icon={DocumentTextIcon}
          color="bg-primary-600"
        />
        <StatCard
          title={t('dashboard.pendingInvoices')}
          value={counts.pendingInvoices || 0}
          icon={ExclamationTriangleIcon}
          color="bg-danger-500"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">{t('dashboard.totalSales')}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-success-600">
              {formatCurrency(financials.totalSales || 0, selectedCompany.currency)}
            </span>
          </div>
          <div className="mt-4 h-2 bg-secondary-100 rounded-full overflow-hidden">
            <div className="h-full bg-success-500 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <p className="mt-2 text-sm text-secondary-500">75% {t('dashboard.ofMonthlyTarget')}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">{t('dashboard.totalPurchases')}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary-600">
              {formatCurrency(financials.totalPurchases || 0, selectedCompany.currency)}
            </span>
          </div>
          <div className="mt-4 h-2 bg-secondary-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <p className="mt-2 text-sm text-secondary-500">60% {t('dashboard.ofBudget')}</p>
        </div>
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">{t('dashboard.lowStockAlerts')}</h3>
            <span className="badge-danger">{alerts.lowStock || 0} {t('dashboard.product')}</span>
          </div>
          {alerts.lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {alerts.lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{item.item?.name}</p>
                    <p className="text-xs text-secondary-500">{t('dashboard.minLevel')}: {item.item?.reorderLevel}</p>
                  </div>
                  <span className="badge-danger">{t('dashboard.lowQuantity')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-secondary-500">{t('dashboard.noAlerts')}</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">{t('dashboard.recentInvoices')}</h3>
            <a href="/invoices" className="text-sm text-primary-600 hover:text-primary-700">
              {t('dashboard.viewAll')}
            </a>
          </div>
          {recentActivity.invoices.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {invoice.customer?.name || invoice.supplier?.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-secondary-900">
                      {formatCurrency(invoice.totalAmount || 0, selectedCompany.currency)}
                    </p>
                    <span className={`badge text-xs ${
                      invoice.status === 'PAID' ? 'badge-success' :
                      invoice.status === 'OVERDUE' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {statusLabel[invoice.status] || invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-secondary-500">{t('dashboard.noInvoices')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
