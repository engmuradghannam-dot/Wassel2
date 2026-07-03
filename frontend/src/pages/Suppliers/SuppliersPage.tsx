// MuradERP Suppliers Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Supplier } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CurrencySelect } from '../../components/common/CurrencySelect';

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  email: '',
  phone: '',
  city: '',
  taxId: '',
  creditLimit: 0,
  paymentTerms: 30,
  currency: 'SAR',
  supplierType: 'COMPANY' as const,
};

export const SuppliersPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [search, setSearch] = useState('');
  const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier, isSaving } =
    useSuppliers(search);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({
      code: supplier.code,
      name: supplier.name,
      nameAr: supplier.nameAr || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      city: supplier.city || '',
      taxId: supplier.taxId || '',
      creditLimit: supplier.creditLimit,
      paymentTerms: supplier.paymentTerms,
      currency: (supplier as any).currency || 'SAR',
      supplierType: supplier.supplierType,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      creditLimit: Number(form.creditLimit),
      paymentTerms: Number(form.paymentTerms),
    };
    if (editingId) {
      await updateSupplier({ id: editingId, payload });
    } else {
      await createSupplier(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (confirm(t('suppliers.confirmDelete', { name: supplier.name }))) {
      await deleteSupplier(supplier.id);
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
        <h1 className="text-2xl font-bold">{t('suppliers.title')}</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          {t('suppliers.addTitle')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-2.5 text-secondary-400" />
        <input
          className="input pr-10"
          placeholder={t('suppliers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">{t('suppliers.colCode')}</th>
              <th className="table-header-cell">{t('suppliers.colName')}</th>
              <th className="table-header-cell">{t('suppliers.colPhone')}</th>
              <th className="table-header-cell">{t('suppliers.colEmail')}</th>
              <th className="table-header-cell">{t('suppliers.colCreditLimit')}</th>
              <th className="table-header-cell">{t('suppliers.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={6}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && suppliers.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>{t('suppliers.emptyState')}</td></tr>
            )}
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="table-cell">{supplier.code}</td>
                <td className="table-cell font-medium">{supplier.name}</td>
                <td className="table-cell">{supplier.phone || '-'}</td>
                <td className="table-cell">{supplier.email || '-'}</td>
                <td className="table-cell">{formatCurrency(supplier.creditLimit, (supplier as any).currency || 'SAR')}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(supplier)} className="text-primary-600 hover:text-primary-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(supplier)} className="text-danger-600 hover:text-danger-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('suppliers.editTitle') : t('suppliers.addTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('suppliers.fieldName')} *</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('suppliers.fieldNameAr')}</label>
            <input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('suppliers.fieldPhone')}</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('suppliers.fieldEmail')}</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('suppliers.fieldCity')}</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('suppliers.fieldTaxId')}</label>
              <input className="input" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('suppliers.fieldCreditLimit')}</label>
              <input type="number" min={0} className="input" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('suppliers.fieldPaymentTerms')}</label>
              <input type="number" min={0} className="input" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('suppliers.fieldCurrency')}</label>
            <CurrencySelect value={form.currency} onChange={(code) => setForm({ ...form, currency: code })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('suppliers.fieldType')}</label>
            <select className="input" value={form.supplierType} onChange={(e) => setForm({ ...form, supplierType: e.target.value })}>
              <option value="COMPANY">{t('suppliers.typeCompany')}</option>
              <option value="INDIVIDUAL">{t('suppliers.typeIndividual')}</option>
              <option value="IMPORTER">{t('suppliers.typeImporter')}</option>
            </select>
          </div>
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
