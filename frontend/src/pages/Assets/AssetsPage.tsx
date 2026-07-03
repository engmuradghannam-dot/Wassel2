// MuradERP Fixed Assets Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, ArrowTrendingDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAssets } from '../../hooks/useAssets';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Asset } from '../../types';
import { formatCurrency } from '../../utils/currency';

const emptyForm = {
  assetName: '',
  assetCategory: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseAmount: 0,
  depreciationMethod: 'STRAIGHT_LINE' as const,
  usefulLife: 5,
  salvageValue: 0,
  location: '',
  custodian: '',
};

export const AssetsPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const { assets, isLoading, createAsset, depreciateAsset, disposeAsset, isSaving } = useAssets();

  const statusBadge: Record<string, string> = {
    ACTIVE: 'badge-success',
    UNDER_MAINTENANCE: 'badge-warning',
    DISPOSED: 'badge-danger',
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: t('assets.statusActive'),
    UNDER_MAINTENANCE: t('assets.statusMaintenance'),
    DISPOSED: t('assets.statusDisposed'),
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createAsset({
      ...form,
      purchaseDate: new Date(form.purchaseDate).toISOString(),
      purchaseAmount: Number(form.purchaseAmount),
      usefulLife: Number(form.usefulLife),
      salvageValue: Number(form.salvageValue),
    });
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const handleDepreciate = async (asset: Asset) => {
    if (confirm(t('assets.depreciateConfirm', { name: asset.assetName }))) {
      await depreciateAsset(asset.id);
    }
  };

  const handleDispose = async (asset: Asset) => {
    if (confirm(t('assets.disposeConfirm', { name: asset.assetName }))) {
      await disposeAsset({
        id: asset.id,
        data: { disposalDate: new Date().toISOString(), disposalValue: asset.netBookValue },
      });
    }
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center text-secondary-500">
        {t('common.selectCompany')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('assets.title')}</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 ml-1" />
          {t('assets.addAsset')}
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">{t('assets.colNumber')}</th>
              <th className="table-header-cell">{t('assets.colName')}</th>
              <th className="table-header-cell">{t('assets.colCategory')}</th>
              <th className="table-header-cell">{t('assets.colPurchaseAmount')}</th>
              <th className="table-header-cell">{t('assets.colNetBookValue')}</th>
              <th className="table-header-cell">{t('assets.colStatus')}</th>
              <th className="table-header-cell">{t('assets.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={7}>{t('common.loading')}</td></tr>}
            {!isLoading && assets.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={7}>{t('assets.emptyState')}</td></tr>
            )}
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="table-cell">{asset.assetNumber}</td>
                <td className="table-cell font-medium">{asset.assetName}</td>
                <td className="table-cell">{asset.assetCategory}</td>
                <td className="table-cell">{formatCurrency(asset.purchaseAmount, selectedCompany.currency)}</td>
                <td className="table-cell">{formatCurrency(asset.netBookValue, selectedCompany.currency)}</td>
                <td className="table-cell">
                  <span className={statusBadge[asset.status]}>{statusLabel[asset.status]}</span>
                </td>
                <td className="table-cell">
                  {asset.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleDepreciate(asset)} className="text-primary-600 hover:text-primary-800" title={t('assets.depreciateAction')}>
                        <ArrowTrendingDownIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDispose(asset)} className="text-danger-600 hover:text-danger-800" title={t('assets.disposeAction')}>
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('assets.modalTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('assets.fieldAssetName')} *</label>
            <input required className="input" value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('assets.fieldCategory')} *</label>
            <input required className="input" placeholder={t('assets.categoryPlaceholder')} value={form.assetCategory} onChange={(e) => setForm({ ...form, assetCategory: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('assets.fieldPurchaseDate')}</label>
              <input type="date" className="input" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('assets.fieldPurchaseAmount')} *</label>
              <input required type="number" min={0} step="0.01" className="input" value={form.purchaseAmount} onChange={(e) => setForm({ ...form, purchaseAmount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('assets.fieldUsefulLife')}</label>
              <input type="number" min={1} className="input" value={form.usefulLife} onChange={(e) => setForm({ ...form, usefulLife: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('assets.fieldSalvageValue')}</label>
              <input type="number" min={0} step="0.01" className="input" value={form.salvageValue} onChange={(e) => setForm({ ...form, salvageValue: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('assets.fieldDepreciationMethod')}</label>
            <select className="input" value={form.depreciationMethod} onChange={(e) => setForm({ ...form, depreciationMethod: e.target.value })}>
              <option value="STRAIGHT_LINE">{t('assets.methodStraightLine')}</option>
              <option value="DECLINING_BALANCE">{t('assets.methodDecliningBalance')}</option>
              <option value="UNITS_OF_PRODUCTION">{t('assets.methodUnitsOfProduction')}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('assets.fieldLocation')}</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('assets.fieldCustodian')}</label>
              <input className="input" value={form.custodian} onChange={(e) => setForm({ ...form, custodian: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? t('common.saving') : t('common.save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
