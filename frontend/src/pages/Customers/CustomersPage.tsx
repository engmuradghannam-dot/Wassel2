// MuradERP Customers Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useCustomers } from '../../hooks/useCustomers';
import { useAccounts } from '../../hooks/useAccounting';
import { usePriceLists } from '../../hooks/usePriceLists';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CurrencySelect } from '../../components/common/CurrencySelect';

type Tab = 'general' | 'address' | 'tax' | 'financial' | 'sales' | 'classification';

const emptyForm: any = {
  code: '', name: '', nameAr: '', searchTerm: '', title: '', legalForm: '', industry: '', language: 'ar',
  email: '', phone: '', mobile: '', fax: '', website: '',
  address: '', buildingNumber: '', street: '', district: '', additionalNumber: '', poBox: '',
  city: '', state: '', region: '', country: 'SA', zipCode: '',
  taxId: '', vatRegistrationDate: '', taxClassification: 'STANDARD_RATED', commercialReg: '', crExpiryDate: '',
  creditLimit: 0, paymentTerms: 30, currency: 'SAR', paymentMethod: '', riskCategory: '',
  dunningBlock: false, paymentBlock: false, reconciliationAccountId: '',
  salesPersonId: '', salesTerritory: '', shippingCondition: '', deliveryPriority: 5, incoterm: '',
  defaultPriceListId: '', completeDeliveryRequired: false,
  customerType: 'INDIVIDUAL', customerGroup: '', customerClassification: '', isBlacklisted: false,
};

const tabs: { key: Tab; label: string }[] = [
  { key: 'general', label: 'عام' },
  { key: 'address', label: 'العنوان الوطني' },
  { key: 'tax', label: 'الضرائب والسجل' },
  { key: 'financial', label: 'الائتمان والمالية' },
  { key: 'sales', label: 'منطقة المبيعات' },
  { key: 'classification', label: 'التصنيف' },
];

export const CustomersPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [search, setSearch] = useState('');
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, isSaving } =
    useCustomers(search);
  const { accounts } = useAccounts();
  const { priceLists } = usePriceLists();
  const { users } = useUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('general');
  const [form, setForm] = useState<any>(emptyForm);

  const set = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTab('general');
    setIsModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({ ...emptyForm, ...customer, vatRegistrationDate: customer.vatRegistrationDate?.slice(0, 10) || '', crExpiryDate: customer.crExpiryDate?.slice(0, 10) || '' });
    setTab('general');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      code: form.code || undefined,
      creditLimit: Number(form.creditLimit),
      paymentTerms: Number(form.paymentTerms),
      deliveryPriority: Number(form.deliveryPriority),
      vatRegistrationDate: form.vatRegistrationDate ? new Date(form.vatRegistrationDate).toISOString() : undefined,
      crExpiryDate: form.crExpiryDate ? new Date(form.crExpiryDate).toISOString() : undefined,
      paymentMethod: form.paymentMethod || undefined,
      riskCategory: form.riskCategory || undefined,
      shippingCondition: form.shippingCondition || undefined,
      incoterm: form.incoterm || undefined,
      customerClassification: form.customerClassification || undefined,
      salesPersonId: form.salesPersonId || undefined,
      reconciliationAccountId: form.reconciliationAccountId || undefined,
      defaultPriceListId: form.defaultPriceListId || undefined,
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
              <th className="table-header-cell">التصنيف</th>
              <th className="table-header-cell">{t('customers.colCreditLimit')}</th>
              <th className="table-header-cell">{t('customers.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={7}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && customers.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={7}>{t('customers.emptyState')}</td></tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="table-cell">{customer.code}</td>
                <td className="table-cell font-medium">
                  {customer.name}
                  {customer.isBlacklisted && <ShieldExclamationIcon className="inline w-4 h-4 text-danger-600 ms-1" title="محظور" />}
                </td>
                <td className="table-cell">{customer.phone || '-'}</td>
                <td className="table-cell">{customer.email || '-'}</td>
                <td className="table-cell">
                  {customer.customerClassification && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                      {customer.customerClassification}
                    </span>
                  )}
                </td>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('customers.editTitle') : t('customers.addTitle')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-1 border-b border-secondary-200 mb-4 -mt-2">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === tb.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-700'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('customers.fieldName')} *</label>
                  <input required className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('customers.fieldNameAr')}</label>
                  <input className="input" value={form.nameAr} onChange={(e) => set({ nameAr: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">اسم البحث المختصر</label>
                  <input className="input" value={form.searchTerm} onChange={(e) => set({ searchTerm: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الشكل القانوني</label>
                  <input className="input" placeholder="ذ.م.م، مؤسسة فردية..." value={form.legalForm} onChange={(e) => set({ legalForm: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">القطاع</label>
                  <input className="input" value={form.industry} onChange={(e) => set({ industry: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('customers.fieldPhone')}</label>
                  <input className="input" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('customers.fieldEmail')}</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => set({ email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">جوال</label>
                  <input className="input" value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الموقع الإلكتروني</label>
                  <input className="input" value={form.website} onChange={(e) => set({ website: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('customers.fieldType')}</label>
                <select className="input" value={form.customerType} onChange={(e) => set({ customerType: e.target.value })}>
                  <option value="INDIVIDUAL">{t('customers.typeIndividual')}</option>
                  <option value="COMPANY">{t('customers.typeCompany')}</option>
                  <option value="GOVERNMENT">{t('customers.typeGovernment')}</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary-500 bg-secondary-50 rounded-lg p-3">حقول العنوان الوطني السعودي (بجانب رقم المبنى، الرقم الإضافي المكون من 4 أرقام يحدد الوحدة بدقة).</p>
              <div>
                <label className="block text-sm font-medium mb-1">{t('customers.fieldCity')}</label>
                <input className="input" value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الحي</label>
                  <input className="input" value={form.district} onChange={(e) => set({ district: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الشارع</label>
                  <input className="input" value={form.street} onChange={(e) => set({ street: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم المبنى</label>
                  <input className="input" value={form.buildingNumber} onChange={(e) => set({ buildingNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الرقم الإضافي</label>
                  <input className="input" maxLength={4} value={form.additionalNumber} onChange={(e) => set({ additionalNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الرمز البريدي</label>
                  <input className="input" value={form.zipCode} onChange={(e) => set({ zipCode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">صندوق البريد</label>
                  <input className="input" value={form.poBox} onChange={(e) => set({ poBox: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المنطقة</label>
                  <input className="input" placeholder="منطقة الرياض..." value={form.region} onChange={(e) => set({ region: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الدولة (ISO)</label>
                  <input className="input" value={form.country} onChange={(e) => set({ country: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">العنوان التفصيلي</label>
                <textarea className="input" rows={2} value={form.address} onChange={(e) => set({ address: e.target.value })} />
              </div>
            </div>
          )}

          {tab === 'tax' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('customers.fieldTaxId')}</label>
                <input className="input" value={form.taxId} onChange={(e) => set({ taxId: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ التسجيل الضريبي</label>
                  <input type="date" className="input" value={form.vatRegistrationDate} onChange={(e) => set({ vatRegistrationDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تصنيف الضريبة</label>
                  <select className="input" value={form.taxClassification} onChange={(e) => set({ taxClassification: e.target.value })}>
                    <option value="STANDARD_RATED">خاضع للنسبة الأساسية</option>
                    <option value="ZERO_RATED">نسبة صفرية</option>
                    <option value="EXEMPT">معفى</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">السجل التجاري</label>
                  <input className="input" value={form.commercialReg} onChange={(e) => set({ commercialReg: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ انتهاء السجل التجاري</label>
                  <input type="date" className="input" value={form.crExpiryDate} onChange={(e) => set({ crExpiryDate: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('customers.fieldCreditLimit')}</label>
                  <input type="number" min={0} className="input" value={form.creditLimit} onChange={(e) => set({ creditLimit: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('customers.fieldPaymentTerms')}</label>
                  <input type="number" min={0} className="input" value={form.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('customers.fieldCurrency')}</label>
                <CurrencySelect value={form.currency} onChange={(code) => set({ currency: code })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
                  <select className="input" value={form.paymentMethod} onChange={(e) => set({ paymentMethod: e.target.value })}>
                    <option value="">-</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHEQUE">شيك</option>
                    <option value="CASH">نقدي</option>
                    <option value="CARD">بطاقة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">فئة المخاطر الائتمانية</label>
                  <select className="input" value={form.riskCategory} onChange={(e) => set({ riskCategory: e.target.value })}>
                    <option value="">-</option>
                    <option value="LOW">منخفضة</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="HIGH">عالية</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">حساب التسوية (Reconciliation Account)</label>
                <select className="input" value={form.reconciliationAccountId} onChange={(e) => set({ reconciliationAccountId: e.target.value })}>
                  <option value="">-</option>
                  {accounts.filter((a: any) => !a.isGroup).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.dunningBlock} onChange={(e) => set({ dunningBlock: e.target.checked })} />
                  حظر التذكير بالسداد (Dunning Block)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.paymentBlock} onChange={(e) => set({ paymentBlock: e.target.checked })} />
                  حظر الدفع
                </label>
              </div>
            </div>
          )}

          {tab === 'sales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">مندوب المبيعات</label>
                  <select className="input" value={form.salesPersonId} onChange={(e) => set({ salesPersonId: e.target.value })}>
                    <option value="">-</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">منطقة المبيعات</label>
                  <input className="input" value={form.salesTerritory} onChange={(e) => set({ salesTerritory: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">شرط الشحن</label>
                  <select className="input" value={form.shippingCondition} onChange={(e) => set({ shippingCondition: e.target.value })}>
                    <option value="">-</option>
                    <option value="STANDARD">عادي</option>
                    <option value="EXPRESS">سريع</option>
                    <option value="FREIGHT_COLLECT">الشحن على المستلم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">أولوية التسليم (1 أعلى)</label>
                  <input type="number" min={1} max={10} className="input" value={form.deliveryPriority} onChange={(e) => set({ deliveryPriority: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Incoterm</label>
                  <select className="input" value={form.incoterm} onChange={(e) => set({ incoterm: e.target.value })}>
                    <option value="">-</option>
                    {['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'].map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">قائمة الأسعار الافتراضية</label>
                  <select className="input" value={form.defaultPriceListId} onChange={(e) => set({ defaultPriceListId: e.target.value })}>
                    <option value="">-</option>
                    {priceLists.map((pl: any) => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.completeDeliveryRequired} onChange={(e) => set({ completeDeliveryRequired: e.target.checked })} />
                يتطلب تسليم كامل (بدون تسليم جزئي)
              </label>
            </div>
          )}

          {tab === 'classification' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">مجموعة العملاء</label>
                  <input className="input" value={form.customerGroup} onChange={(e) => set({ customerGroup: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">تصنيف ABC</label>
                  <select className="input" value={form.customerClassification} onChange={(e) => set({ customerClassification: e.target.value })}>
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-danger-700">
                <input type="checkbox" checked={form.isBlacklisted} onChange={(e) => set({ isBlacklisted: e.target.checked })} />
                محظور (Blacklisted) — يمنع التعامل مع هذا العميل
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-secondary-100">
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
