// MuradERP Suppliers Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ShieldExclamationIcon, StarIcon } from '@heroicons/react/24/outline';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAccounts } from '../../hooks/useAccounting';
import { usePriceLists } from '../../hooks/usePriceLists';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Supplier } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { CurrencySelect } from '../../components/common/CurrencySelect';

type Tab = 'general' | 'address' | 'tax' | 'financial' | 'purchasing' | 'evaluation';

const emptyForm: any = {
  code: '', name: '', nameAr: '', searchTerm: '', legalForm: '', industry: '', language: 'ar',
  email: '', phone: '', mobile: '', fax: '', website: '',
  address: '', buildingNumber: '', street: '', district: '', additionalNumber: '', poBox: '',
  city: '', state: '', region: '', country: 'SA', zipCode: '',
  taxId: '', vatRegistrationDate: '', withholdingTaxApplicable: false, withholdingTaxRate: '',
  commercialReg: '', crExpiryDate: '',
  creditLimit: 0, paymentTerms: 30, currency: 'SAR', paymentMethod: '', reconciliationAccountId: '', paymentBlock: false,
  buyerId: '', minimumOrderValue: '', leadTimeDays: '', incoterm: '', defaultPriceListId: '',
  qualityRating: '', deliveryRating: '', priceRating: '', isApprovedVendor: true, vendorClassification: '',
  supplierType: 'COMPANY', supplierGroup: '', isBlacklisted: false,
};

const tabs: { key: Tab; label: string }[] = [
  { key: 'general', label: 'عام' },
  { key: 'address', label: 'العنوان الوطني' },
  { key: 'tax', label: 'الضرائب والسجل' },
  { key: 'financial', label: 'الائتمان والمالية' },
  { key: 'purchasing', label: 'بيانات المشتريات' },
  { key: 'evaluation', label: 'تقييم المورد' },
];

export const SuppliersPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [search, setSearch] = useState('');
  const { suppliers, isLoading, createSupplier, updateSupplier, deleteSupplier, isSaving } =
    useSuppliers(search);
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

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({ ...emptyForm, ...supplier, vatRegistrationDate: supplier.vatRegistrationDate?.slice(0, 10) || '', crExpiryDate: supplier.crExpiryDate?.slice(0, 10) || '' });
    setTab('general');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      creditLimit: Number(form.creditLimit),
      paymentTerms: Number(form.paymentTerms),
      withholdingTaxRate: form.withholdingTaxRate ? Number(form.withholdingTaxRate) : undefined,
      minimumOrderValue: form.minimumOrderValue ? Number(form.minimumOrderValue) : undefined,
      leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
      qualityRating: form.qualityRating ? Number(form.qualityRating) : undefined,
      deliveryRating: form.deliveryRating ? Number(form.deliveryRating) : undefined,
      priceRating: form.priceRating ? Number(form.priceRating) : undefined,
      vatRegistrationDate: form.vatRegistrationDate ? new Date(form.vatRegistrationDate).toISOString() : undefined,
      crExpiryDate: form.crExpiryDate ? new Date(form.crExpiryDate).toISOString() : undefined,
      paymentMethod: form.paymentMethod || undefined,
      incoterm: form.incoterm || undefined,
      vendorClassification: form.vendorClassification || undefined,
      buyerId: form.buyerId || undefined,
      reconciliationAccountId: form.reconciliationAccountId || undefined,
      defaultPriceListId: form.defaultPriceListId || undefined,
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
              <th className="table-header-cell">التصنيف</th>
              <th className="table-header-cell">{t('suppliers.colCreditLimit')}</th>
              <th className="table-header-cell">{t('suppliers.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={7}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && suppliers.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={7}>{t('suppliers.emptyState')}</td></tr>
            )}
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="table-cell">{supplier.code}</td>
                <td className="table-cell font-medium">
                  {supplier.name}
                  {supplier.isBlacklisted && <ShieldExclamationIcon className="inline w-4 h-4 text-danger-600 ms-1" title="محظور" />}
                  {supplier.isApprovedVendor === false && <span className="text-xs text-warning-600 ms-1">(غير معتمد)</span>}
                </td>
                <td className="table-cell">{supplier.phone || '-'}</td>
                <td className="table-cell">{supplier.email || '-'}</td>
                <td className="table-cell">
                  {supplier.vendorClassification && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                      {supplier.vendorClassification}
                    </span>
                  )}
                </td>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('suppliers.editTitle') : t('suppliers.addTitle')} size="xl">
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
                  <label className="block text-sm font-medium mb-1">{t('suppliers.fieldName')} *</label>
                  <input required className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('suppliers.fieldNameAr')}</label>
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
                  <input className="input" value={form.legalForm} onChange={(e) => set({ legalForm: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">القطاع</label>
                  <input className="input" value={form.industry} onChange={(e) => set({ industry: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('suppliers.fieldPhone')}</label>
                  <input className="input" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('suppliers.fieldEmail')}</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => set({ email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('suppliers.fieldType')}</label>
                <select className="input" value={form.supplierType} onChange={(e) => set({ supplierType: e.target.value })}>
                  <option value="COMPANY">{t('suppliers.typeCompany')}</option>
                  <option value="INDIVIDUAL">{t('suppliers.typeIndividual')}</option>
                  <option value="IMPORTER">{t('suppliers.typeImporter')}</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary-500 bg-secondary-50 rounded-lg p-3">حقول العنوان الوطني السعودي.</p>
              <div>
                <label className="block text-sm font-medium mb-1">{t('suppliers.fieldCity')}</label>
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
              <div>
                <label className="block text-sm font-medium mb-1">المنطقة</label>
                <input className="input" value={form.region} onChange={(e) => set({ region: e.target.value })} />
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
                <label className="block text-sm font-medium mb-1">{t('suppliers.fieldTaxId')}</label>
                <input className="input" value={form.taxId} onChange={(e) => set({ taxId: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ التسجيل الضريبي</label>
                  <input type="date" className="input" value={form.vatRegistrationDate} onChange={(e) => set({ vatRegistrationDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السجل التجاري</label>
                  <input className="input" value={form.commercialReg} onChange={(e) => set({ commercialReg: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.withholdingTaxApplicable} onChange={(e) => set({ withholdingTaxApplicable: e.target.checked })} />
                  خاضع لضريبة الاستقطاع
                </label>
                {form.withholdingTaxApplicable && (
                  <div>
                    <label className="block text-sm font-medium mb-1">نسبة الاستقطاع (%)</label>
                    <input type="number" step="0.5" className="input" value={form.withholdingTaxRate} onChange={(e) => set({ withholdingTaxRate: e.target.value })} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ انتهاء السجل التجاري</label>
                <input type="date" className="input" value={form.crExpiryDate} onChange={(e) => set({ crExpiryDate: e.target.value })} />
              </div>
            </div>
          )}

          {tab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('suppliers.fieldCreditLimit')}</label>
                  <input type="number" min={0} className="input" value={form.creditLimit} onChange={(e) => set({ creditLimit: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('suppliers.fieldPaymentTerms')}</label>
                  <input type="number" min={0} className="input" value={form.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('suppliers.fieldCurrency')}</label>
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
                  <label className="block text-sm font-medium mb-1">حساب التسوية</label>
                  <select className="input" value={form.reconciliationAccountId} onChange={(e) => set({ reconciliationAccountId: e.target.value })}>
                    <option value="">-</option>
                    {accounts.filter((a: any) => !a.isGroup).map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.paymentBlock} onChange={(e) => set({ paymentBlock: e.target.checked })} />
                حظر الدفع
              </label>
            </div>
          )}

          {tab === 'purchasing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المشتري المسؤول</label>
                  <select className="input" value={form.buyerId} onChange={(e) => set({ buyerId: e.target.value })}>
                    <option value="">-</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مدة التوريد (أيام)</label>
                  <input type="number" min={0} className="input" value={form.leadTimeDays} onChange={(e) => set({ leadTimeDays: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الحد الأدنى لقيمة الطلب</label>
                  <input type="number" min={0} className="input" value={form.minimumOrderValue} onChange={(e) => set({ minimumOrderValue: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Incoterm</label>
                  <select className="input" value={form.incoterm} onChange={(e) => set({ incoterm: e.target.value })}>
                    <option value="">-</option>
                    {['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'].map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
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
          )}

          {tab === 'evaluation' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary-500 bg-secondary-50 rounded-lg p-3">تقييم من 0 إلى 5 لكل معيار.</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><StarIcon className="w-4 h-4" /> الجودة</label>
                  <input type="number" min={0} max={5} step="0.1" className="input" value={form.qualityRating} onChange={(e) => set({ qualityRating: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><StarIcon className="w-4 h-4" /> التسليم</label>
                  <input type="number" min={0} max={5} step="0.1" className="input" value={form.deliveryRating} onChange={(e) => set({ deliveryRating: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><StarIcon className="w-4 h-4" /> السعر</label>
                  <input type="number" min={0} max={5} step="0.1" className="input" value={form.priceRating} onChange={(e) => set({ priceRating: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">تصنيف ABC</label>
                  <select className="input" value={form.vendorClassification} onChange={(e) => set({ vendorClassification: e.target.value })}>
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مجموعة الموردين</label>
                  <input className="input" value={form.supplierGroup} onChange={(e) => set({ supplierGroup: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isApprovedVendor} onChange={(e) => set({ isApprovedVendor: e.target.checked })} />
                  مورد معتمد
                </label>
                <label className="flex items-center gap-2 text-sm text-danger-700">
                  <input type="checkbox" checked={form.isBlacklisted} onChange={(e) => set({ isBlacklisted: e.target.checked })} />
                  محظور (Blacklisted)
                </label>
              </div>
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
