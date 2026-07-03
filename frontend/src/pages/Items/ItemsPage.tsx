// MuradERP Items Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Item } from '../../types';
import { formatCurrency } from '../../utils/currency';

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  itemGroup: '',
  unitOfMeasure: 'PCS',
  standardCost: 0,
  sellingPrice: 0,
  reorderLevel: 0,
  taxRate: 15,
  isStockItem: true,
};

export const ItemsPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [search, setSearch] = useState('');
  const { items, isLoading, createItem, updateItem, deleteItem, isSaving } = useItems(search);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      nameAr: item.nameAr || '',
      itemGroup: item.itemGroup || '',
      unitOfMeasure: item.unitOfMeasure,
      standardCost: item.standardCost,
      sellingPrice: item.sellingPrice,
      reorderLevel: item.reorderLevel,
      taxRate: item.taxRate,
      isStockItem: item.isStockItem,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      standardCost: Number(form.standardCost),
      sellingPrice: Number(form.sellingPrice),
      reorderLevel: Number(form.reorderLevel),
      taxRate: Number(form.taxRate),
    };
    if (editingId) {
      await updateItem({ id: editingId, payload });
    } else {
      await createItem(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (item: Item) => {
    if (confirm(t('items.confirmDelete', { name: item.name }))) {
      await deleteItem(item.id);
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
        <h1 className="text-2xl font-bold">{t('items.title')}</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          {t('items.addTitle')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-2.5 text-secondary-400" />
        <input
          className="input pr-10"
          placeholder={t('items.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">{t('items.colCode')}</th>
              <th className="table-header-cell">{t('items.colName')}</th>
              <th className="table-header-cell">{t('items.colUnit')}</th>
              <th className="table-header-cell">{t('items.colCost')}</th>
              <th className="table-header-cell">{t('items.colPrice')}</th>
              <th className="table-header-cell">{t('items.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={6}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>{t('items.emptyState')}</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="table-cell">{item.code}</td>
                <td className="table-cell font-medium">{item.name}</td>
                <td className="table-cell">{item.unitOfMeasure}</td>
                <td className="table-cell">{formatCurrency(item.standardCost, selectedCompany.currency)}</td>
                <td className="table-cell">{formatCurrency(item.sellingPrice, selectedCompany.currency)}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="text-danger-600 hover:text-danger-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('items.editTitle') : t('items.addTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.fieldName')} *</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.fieldNameAr')}</label>
            <input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('items.fieldCategory')}</label>
              <input className="input" value={form.itemGroup} onChange={(e) => setForm({ ...form, itemGroup: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('items.fieldUnit')}</label>
              <input className="input" value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('items.fieldPurchaseCost')}</label>
              <input type="number" min={0} step="0.01" className="input" value={form.standardCost} onChange={(e) => setForm({ ...form, standardCost: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('items.fieldSellingPrice')}</label>
              <input type="number" min={0} step="0.01" className="input" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('items.fieldReorderLevel')}</label>
              <input type="number" min={0} className="input" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('items.fieldTaxRate')}</label>
              <input type="number" min={0} max={100} className="input" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isStockItem} onChange={(e) => setForm({ ...form, isStockItem: e.target.checked })} />
            {t('items.stockItemLabel')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
