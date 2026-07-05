import { useState, FormEvent } from 'react';
import { PresentationChartLineIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useSalesForecast } from '../../hooks/useSalesForecast';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';

export const ForecastPage = () => {
  const { selectedCompany } = useAuthStore();
  const { forecasts, isLoading, generateForecast, isGenerating } = useSalesForecast();
  const { items } = useItems();

  const [form, setForm] = useState({ itemId: '', method: 'MOVING_AVERAGE', lookbackMonths: 6 });
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res: any = await generateForecast({
      itemId: form.itemId || undefined,
      method: form.method,
      lookbackMonths: Number(form.lookbackMonths),
    });
    setResult(res?.data);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <PresentationChartLineIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">Select a company first</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Sales Forecasting</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary-600" /> Generate Forecast
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Item (optional — leave blank for total company sales)</label>
              <select className="form-input" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
                <option value="">All items (total sales)</option>
                {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Method</label>
              <select className="form-input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="MOVING_AVERAGE">Moving Average</option>
                <option value="LINEAR_REGRESSION">Linear Regression</option>
              </select>
            </div>
            <div>
              <label className="form-label">Lookback Period (months)</label>
              <input type="number" min={2} max={36} className="form-input" value={form.lookbackMonths} onChange={(e) => setForm({ ...form, lookbackMonths: Number(e.target.value) })} />
            </div>
            <button type="submit" disabled={isGenerating} className="btn-primary w-full">
              {isGenerating ? 'Generating...' : 'Generate Forecast'}
            </button>
          </form>
        </div>

        {result && (
          <div className="card bg-gradient-to-br from-primary-50 to-success-50 border-primary-200">
            <h2 className="text-lg font-semibold mb-4">Forecast Result</h2>
            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-white rounded-lg">
                <span className="text-secondary-600">Predicted Amount (next period)</span>
                <span className="text-2xl font-bold text-primary-700">{Number(result.predictedAmount).toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between p-3 bg-white rounded-lg">
                <span className="text-secondary-600">Confidence</span>
                <span className="font-semibold">{result.confidence != null ? `${result.confidence}%` : 'N/A'}</span>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <span className="text-secondary-600 text-sm block mb-2">Historical monthly totals</span>
                <div className="flex items-end gap-1 h-20">
                  {result.historicalMonthlyTotals?.map((v: number, i: number) => {
                    const max = Math.max(...result.historicalMonthlyTotals, 1);
                    return <div key={i} className="flex-1 bg-primary-400 rounded-t" style={{ height: `${(v / max) * 100}%` }} title={v.toLocaleString()} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Forecast History</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : forecasts.length === 0 ? (
          <p className="text-secondary-500 text-center py-8">No forecasts generated yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Predicted</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Confidence</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {forecasts.map((f: any) => (
                  <tr key={f.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 text-sm">{f.item?.name || 'All items'}</td>
                    <td className="px-4 py-3 text-sm text-secondary-600">{f.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{Number(f.predictedAmount).toLocaleString()} SAR</td>
                    <td className="px-4 py-3 text-sm">{f.confidence != null ? `${Number(f.confidence)}%` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-secondary-500">{new Date(f.createdAt).toLocaleDateString()}</td>
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
