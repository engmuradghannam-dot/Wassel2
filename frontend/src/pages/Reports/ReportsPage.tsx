import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReport } from '../../hooks/useReports';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';

type ReportTab = 'trialBalance' | 'profitAndLoss' | 'balanceSheet' | 'stock' | 'sales' | 'payroll';

const tabs: { key: ReportTab; label: string }[] = [
  { key: 'trialBalance', label: 'ميزان المراجعة' },
  { key: 'profitAndLoss', label: 'الأرباح والخسائر' },
  { key: 'balanceSheet', label: 'الميزانية العمومية' },
  { key: 'stock', label: 'تقرير المخزون' },
  { key: 'sales', label: 'تقرير المبيعات' },
  { key: 'payroll', label: 'تقرير الرواتب' },
];

export const ReportsPage = () => {
  const { selectedCompany } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: ReportTab[] = ['trialBalance', 'profitAndLoss', 'balanceSheet', 'stock', 'sales', 'payroll'];
  const paramTab = searchParams.get('tab') as ReportTab | null;
  const initialTab = paramTab && validTabs.includes(paramTab) ? paramTab : 'trialBalance';
  const [tab, setTabState] = useState<ReportTab>(initialTab);
  const setTab = (t: ReportTab) => {
    setTabState(t);
    setSearchParams({ tab: t });
  };
  const { data, isLoading } = useReport(tab);

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  const currency = selectedCompany.currency;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التقارير</h1>

      <div className="flex gap-2 border-b border-secondary-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${tab === t.key ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="card text-center text-secondary-500">جاري التحميل...</div>}

      {!isLoading && tab === 'trialBalance' && data && (
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">الكود</th>
                <th className="table-header-cell">الحساب</th>
                <th className="table-header-cell">مدين</th>
                <th className="table-header-cell">دائن</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {data.rows.map((r: any) => (
                <tr key={r.code}>
                  <td className="table-cell">{r.code}</td>
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell">{r.debit ? formatCurrency(r.debit, currency) : '-'}</td>
                  <td className="table-cell">{r.credit ? formatCurrency(r.credit, currency) : '-'}</td>
                </tr>
              ))}
              <tr className="font-bold bg-secondary-50">
                <td className="table-cell" colSpan={2}>الإجمالي</td>
                <td className="table-cell">{formatCurrency(data.totalDebit, currency)}</td>
                <td className="table-cell">{formatCurrency(data.totalCredit, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && tab === 'profitAndLoss' && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-bold mb-3">الإيرادات</h3>
            {data.income.map((r: any) => (
              <div key={r.code} className="flex justify-between text-sm py-1 border-b border-secondary-100">
                <span>{r.name}</span><span>{formatCurrency(r.amount, currency)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2">
              <span>إجمالي الإيرادات</span><span>{formatCurrency(data.totalIncome, currency)}</span>
            </div>
          </div>
          <div className="card">
            <h3 className="font-bold mb-3">المصروفات</h3>
            {data.expense.map((r: any) => (
              <div key={r.code} className="flex justify-between text-sm py-1 border-b border-secondary-100">
                <span>{r.name}</span><span>{formatCurrency(r.amount, currency)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2">
              <span>إجمالي المصروفات</span><span>{formatCurrency(data.totalExpense, currency)}</span>
            </div>
          </div>
          <div className={`card md:col-span-2 ${data.netProfit >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
            <div className="flex justify-between font-bold text-lg">
              <span>{data.netProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</span>
              <span>{formatCurrency(Math.abs(data.netProfit), currency)}</span>
            </div>
          </div>
        </div>
      )}

      {!isLoading && tab === 'balanceSheet' && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="font-bold mb-3">الأصول</h3>
              {data.assets.map((r: any) => (
                <div key={r.code} className="flex justify-between text-sm py-1 border-b border-secondary-100">
                  <span>{r.name}</span><span>{formatCurrency(r.amount, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2"><span>الإجمالي</span><span>{formatCurrency(data.totalAssets, currency)}</span></div>
            </div>
            <div className="card">
              <h3 className="font-bold mb-3">الخصوم</h3>
              {data.liabilities.map((r: any) => (
                <div key={r.code} className="flex justify-between text-sm py-1 border-b border-secondary-100">
                  <span>{r.name}</span><span>{formatCurrency(r.amount, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2"><span>الإجمالي</span><span>{formatCurrency(data.totalLiabilities, currency)}</span></div>
            </div>
            <div className="card">
              <h3 className="font-bold mb-3">حقوق الملكية</h3>
              {data.equity.map((r: any) => (
                <div key={r.code} className="flex justify-between text-sm py-1 border-b border-secondary-100">
                  <span>{r.name}</span><span>{formatCurrency(r.amount, currency)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2"><span>الإجمالي</span><span>{formatCurrency(data.totalEquity, currency)}</span></div>
            </div>
          </div>
          <div className={`card ${data.balanced ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
            {data.balanced ? 'الميزانية متوازنة ✓ (الأصول = الخصوم + حقوق الملكية)' : 'تنبيه: الميزانية غير متوازنة'}
          </div>
        </div>
      )}

      {!isLoading && tab === 'stock' && data && (
        <div className="space-y-4">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">المنتج</th>
                  <th className="table-header-cell">المستودع</th>
                  <th className="table-header-cell">الكمية</th>
                  <th className="table-header-cell">القيمة</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data.rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="table-cell font-medium">{r.item?.name}</td>
                    <td className="table-cell">{r.warehouse?.name}</td>
                    <td className="table-cell">{Number(r.availableQty).toLocaleString()}</td>
                    <td className="table-cell">{formatCurrency(Number(r.totalValue), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card font-bold flex justify-between">
            <span>إجمالي قيمة المخزون</span><span>{formatCurrency(data.totalValue, currency)}</span>
          </div>
        </div>
      )}

      {!isLoading && tab === 'sales' && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card"><p className="text-sm text-secondary-500">إجمالي المبيعات</p><p className="text-xl font-bold">{formatCurrency(data.totalSales, currency)}</p></div>
            <div className="card"><p className="text-sm text-secondary-500">المحصّل</p><p className="text-xl font-bold text-success-600">{formatCurrency(data.totalPaid, currency)}</p></div>
            <div className="card"><p className="text-sm text-secondary-500">المستحق</p><p className="text-xl font-bold text-danger-600">{formatCurrency(data.totalOutstanding, currency)}</p></div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">رقم الفاتورة</th>
                  <th className="table-header-cell">العميل</th>
                  <th className="table-header-cell">الإجمالي</th>
                  <th className="table-header-cell">المستحق</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data.rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="table-cell font-medium">{r.invoiceNumber}</td>
                    <td className="table-cell">{r.customer?.name || '-'}</td>
                    <td className="table-cell">{formatCurrency(Number(r.totalAmount), currency)}</td>
                    <td className="table-cell">{formatCurrency(Number(r.balanceDue), currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && tab === 'payroll' && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card"><p className="text-sm text-secondary-500">إجمالي صافي الرواتب</p><p className="text-xl font-bold">{formatCurrency(data.totalNet, currency)}</p></div>
            <div className="card"><p className="text-sm text-secondary-500">إجمالي التأمينات (GOSI)</p><p className="text-xl font-bold">{formatCurrency(data.totalGosi, currency)}</p></div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">الموظف</th>
                  <th className="table-header-cell">صافي الراتب</th>
                  <th className="table-header-cell">الحالة</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data.rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="table-cell font-medium">{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td className="table-cell">{formatCurrency(Number(r.netSalary), currency)}</td>
                    <td className="table-cell">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
