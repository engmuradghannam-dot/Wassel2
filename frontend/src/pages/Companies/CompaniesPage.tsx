import { useState, FormEvent } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useCompanies } from '../../hooks/useCompanies';
import { Modal } from '../../components/common/Modal';
import { CurrencySelect } from '../../components/common/CurrencySelect';
import { Company } from '../../types';

const monthOptions = [
  { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' },
];

const emptyForm = {
  name: '', nameAr: '', legalName: '', taxId: '', commercialReg: '',
  email: '', phone: '', website: '',
  address: '', city: '', state: '', country: 'SA', zipCode: '',
  currency: 'SAR', fiscalYearStart: 1, fiscalYearEnd: 12,
};

export const CompaniesPage = () => {
  const { companies, isLoading, createCompany, updateCompany, deleteCompany, isSaving } = useCompanies();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setIsModalOpen(true); };

  const openEdit = (c: Company) => {
    setEditingId(c.id);
    setForm({
      name: c.name, nameAr: c.nameAr || '', legalName: c.legalName || '',
      taxId: c.taxId || '', commercialReg: c.commercialReg || '',
      email: c.email || '', phone: c.phone || '', website: c.website || '',
      address: c.address || '', city: c.city || '', state: c.state || '',
      country: c.country, zipCode: c.zipCode || '',
      currency: c.currency, fiscalYearStart: c.fiscalYearStart, fiscalYearEnd: c.fiscalYearEnd,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      fiscalYearStart: Number(form.fiscalYearStart),
      fiscalYearEnd: Number(form.fiscalYearEnd),
      email: form.email || undefined,
    };
    if (editingId) {
      await updateCompany({ id: editingId, payload });
    } else {
      await createCompany(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (c: Company) => {
    if (confirm(`متأكد تبي توقف تفعيل شركة "${c.name}"؟ (البيانات تبقى محفوظة)`)) {
      await deleteCompany(c.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الشركات</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          إضافة شركة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <div className="card text-center text-secondary-500 col-span-full">جاري التحميل...</div>}
        {!isLoading && companies.length === 0 && (
          <div className="card text-center text-secondary-500 col-span-full">لا يوجد شركات بعد</div>
        )}
        {companies.map((c: any) => (
          <div key={c.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-bold">{c.name}</p>
                  {c.nameAr && <p className="text-xs text-secondary-500">{c.nameAr}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="text-primary-600 hover:text-primary-800">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button onClick={() => handleDelete(c)} className="text-danger-600 hover:text-danger-800">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-secondary-600 border-t border-secondary-100 pt-3">
              <div>الرقم الضريبي: {c.taxId || '-'}</div>
              <div>العملة: {c.currency}</div>
              <div>الدولة: {c.country}</div>
              <div>المدينة: {c.city || '-'}</div>
              <div>الفروع: {c._count?.branches ?? 0}</div>
              <div>الموظفين: {c._count?.employees ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'تعديل شركة' : 'إضافة شركة'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم الشركة *</label>
              <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الاسم بالعربي</label>
              <input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الاسم القانوني الكامل</label>
            <input className="input" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الرقم الضريبي (VAT)</label>
              <input className="input" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">السجل التجاري</label>
              <input className="input" value={form.commercialReg} onChange={(e) => setForm({ ...form, commercialReg: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الجوال</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الموقع الإلكتروني</label>
            <input className="input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">العنوان</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المنطقة</label>
              <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الرمز البريدي</label>
              <input className="input" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الدولة (رمز ISO مثل SA)</label>
            <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">العملة الافتراضية</label>
            <CurrencySelect value={form.currency} onChange={(code) => setForm({ ...form, currency: code })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">بداية السنة المالية</label>
              <select className="input" value={form.fiscalYearStart} onChange={(e) => setForm({ ...form, fiscalYearStart: e.target.value })}>
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نهاية السنة المالية</label>
              <select className="input" value={form.fiscalYearEnd} onChange={(e) => setForm({ ...form, fiscalYearEnd: e.target.value })}>
                {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          {!editingId && (
            <p className="text-xs text-secondary-500 bg-secondary-50 rounded-lg p-3">
              سيتم إنشاء دليل حسابات كامل (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات) تلقائيًا لهذه الشركة عند الحفظ.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
