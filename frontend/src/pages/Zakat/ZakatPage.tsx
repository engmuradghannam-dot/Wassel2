import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useZakat } from '../../hooks/useZakat';
import { useAuthStore } from '../../store/authStore';
import { CalculatorIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export const ZakatPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const { history, isLoading, calculateZakat } = useZakat();
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    hijriYear: '',
    cash: 0,
    inventory: 0,
    receivables: 0,
    investments: 0,
    goldSilver: 0,
    debts: 0,
    nisabThreshold: 85000,
    zakatRate: 0.025,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await calculateZakat(form);
    setResult(res.data);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <CalculatorIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">{t('zakat.selectCompany')}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">{t('zakat.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <CalculatorIcon className="w-5 h-5 text-primary-600" />
            {t('zakat.calculator')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('zakat.year')}</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.hijriYear')}</label>
                <input type="text" value={form.hijriYear} onChange={(e) => setForm({ ...form, hijriYear: e.target.value })} className="form-input" placeholder="1446" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('zakat.cash')} (SAR)</label>
                <input type="number" value={form.cash} onChange={(e) => setForm({ ...form, cash: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.inventory')} (SAR)</label>
                <input type="number" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.receivables')} (SAR)</label>
                <input type="number" value={form.receivables} onChange={(e) => setForm({ ...form, receivables: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.investments')} (SAR)</label>
                <input type="number" value={form.investments} onChange={(e) => setForm({ ...form, investments: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.goldSilver')} (SAR)</label>
                <input type="number" value={form.goldSilver} onChange={(e) => setForm({ ...form, goldSilver: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.debts')} (SAR)</label>
                <input type="number" value={form.debts} onChange={(e) => setForm({ ...form, debts: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('zakat.nisabThreshold')} (SAR)</label>
                <input type="number" value={form.nisabThreshold} onChange={(e) => setForm({ ...form, nisabThreshold: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
              <div>
                <label className="form-label">{t('zakat.zakatRate')} (%)</label>
                <input type="number" step="0.001" value={form.zakatRate} onChange={(e) => setForm({ ...form, zakatRate: parseFloat(e.target.value) || 0 })} className="form-input" />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              {t('zakat.calculate')}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="card bg-gradient-to-br from-primary-50 to-success-50 border-primary-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-success-600" />
              {t('zakat.result')}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-secondary-600">{t('zakat.totalAssets')}</span>
                <span className="font-semibold">{result.breakdown.totalAssets.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-secondary-600">{t('zakat.debts')}</span>
                <span className="font-semibold text-danger-600">- {result.breakdown.debts.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-secondary-600">{t('zakat.netAssets')}</span>
                <span className="font-semibold">{result.breakdown.netAssets.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-secondary-600">{t('zakat.nisabApplicable')}</span>
                <span className={`font-semibold ${result.nisabApplicable ? 'text-success-600' : 'text-danger-600'}`}>
                  {result.nisabApplicable ? t('common.yes') : t('common.no')}
                </span>
              </div>
              <div className="flex justify-between p-4 bg-success-100 rounded-lg border border-success-200">
                <span className="font-semibold text-success-800">{t('zakat.zakatAmount')}</span>
                <span className="text-2xl font-bold text-success-700">{result.zakatAmount.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-primary-600" />
          {t('zakat.history')}
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-secondary-500 text-center py-8">{t('zakat.noHistory')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('zakat.year')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('zakat.totalAssets')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('zakat.netAssets')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('zakat.zakatAmount')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {history.map((item: any) => (
                  <tr key={item.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{item.year}</td>
                    <td className="px-4 py-3 text-sm">{item.totalAssets.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-sm">{item.netAssets.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success-600">{item.zakatAmount.toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-sm text-secondary-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
