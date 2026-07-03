// MuradERP Customers Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCustomers } from '../../hooks/useCustomers';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Customer } from '../../types';
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
  customerType: 'INDIVIDUAL' as const,
};

export const CustomersPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [search, setSearch] = useState('');
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, isSaving } =
    useCustomers(search);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      code: customer.code,
      name: customer.name,
      nameAr: customer.nameAr || '',
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
      taxId: customer.taxId || '',
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms,
      currency: (customer as any).currency || 'SAR',
      customerType: customer.customerType,
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
      await updateCustomer({ id: editingId, payload });
    } else {
      await createCustomer(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (customer: Customer) => {
    if (confirm(t('customers.confirmDelete', { name: customer.name }))) {
      await deleteCustomer(customer.id);
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
        <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          {t('customers.addTitle')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-2.5 text-secondary-400" />
        <input
          className="input pr-10"
          placeholder={t('customers.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">{t('customers.colCode')}</th>
              <th className="table-header-cell">{t('customers.colName')}</th>
              <th className="table-header-cell">{t('customers.colPhone')}</th>
              <th className="table-header-cell">{t('customers.colEmail')}</th>
              <th className="table-header-cell">{t('customers.colCreditLimit')}</th>
              <th className="table-header-cell">{t('customers.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={6}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && customers.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>{t('customers.emptyState')}</td></tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="table-cell">{customer.code}</td>
                <td className="table-cell font-medium">{customer.name}</td>
                <td className="table-cell">{customer.phone || '-'}</td>
                <td className="table-cell">{customer.email || '-'}</td>
                <td className="table-cell">{formatCurrency(customer.creditLimit, (customer as any).currency || 'SAR')}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(customer)} className="text-primary-600 hover:text-primary-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(customer)} className="text-danger-600 hover:text-danger-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('customers.editTitle') : t('customers.addTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('customers.fieldName')} *</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('customers.fieldNameAr')}</label>
            <input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('customers.fieldPhone')}</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('customers.fieldEmail')}</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('customers.fieldCity')}</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('customers.fieldTaxId')}</label>
              <input className="input" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('customers.fieldCreditLimit')}</label>
              <input type="number" min={0} className="input" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('customers.fieldPaymentTerms')}</label>
              <input type="number" min={0} className="input" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('customers.fieldCurrency')}</label>
            <CurrencySelect value={form.currency} onChange={(code) => setForm({ ...form, currency: code })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('customers.fieldType')}</label>
            <select className="input" value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
              <option value="INDIVIDUAL">{t('customers.typeIndividual')}</option>
              <option value="COMPANY">{t('customers.typeCompany')}</option>
              <option value="GOVERNMENT">{t('customers.typeGovernment')}</option>
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
