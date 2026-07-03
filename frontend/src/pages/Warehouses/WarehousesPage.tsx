import { useState, FormEvent } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useWarehouses, useStockLevels } from '../../hooks/useWarehouses';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Warehouse } from '../../types';

const emptyForm = { name: '', nameAr: '', address: '', city: '', isDefault: false, allowNegative: false };

export const WarehousesPage = () => {
  const { selectedCompany } = useAuthStore();
  const { warehouses, isLoading, createWarehouse, deleteWarehouse, isSaving } = useWarehouses();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const { stockLevels, isLoading: stockLoading } = useStockLevels(selectedWarehouseId || undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createWarehouse(form);
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const handleDelete = async (wh: Warehouse) => {
    if (confirm(`متأكد تبي تحذف "${wh.name}"؟`)) {
      await deleteWarehouse(wh.id);
    }
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المستودعات</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 ml-1" />
          إضافة مستودع
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">الكود</th>
              <th className="table-header-cell">الاسم</th>
              <th className="table-header-cell">المدينة</th>
              <th className="table-header-cell">افتراضي</th>
              <th className="table-header-cell">إجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
            {!isLoading && warehouses.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد مستودعات بعد</td></tr>
            )}
            {warehouses.map((wh) => (
              <tr key={wh.id}>
                <td className="table-cell">{wh.code}</td>
                <td className="table-cell font-medium">{wh.name}</td>
                <td className="table-cell">{wh.city || '-'}</td>
                <td className="table-cell">{wh.isDefault ? <span className="badge-info">افتراضي</span> : '-'}</td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(wh)} className="text-danger-600 hover:text-danger-800">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">أرصدة المخزون</h2>
          <select className="input max-w-xs" value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}>
            <option value="">كل المستودعات</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">المنتج</th>
                <th className="table-header-cell">المستودع</th>
                <th className="table-header-cell">الكمية المتاحة</th>
                <th className="table-header-cell">متوسط التكلفة</th>
                <th className="table-header-cell">القيمة الإجمالية</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {stockLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
              {!stockLoading && stockLevels.length === 0 && (
                <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد أرصدة مخزون بعد</td></tr>
              )}
              {stockLevels.map((bin: any) => (
                <tr key={bin.id}>
                  <td className="table-cell font-medium">{bin.item?.name}</td>
                  <td className="table-cell">{bin.warehouse?.name}</td>
                  <td className="table-cell">{Number(bin.availableQty).toLocaleString()} {bin.item?.unitOfMeasure}</td>
                  <td className="table-cell">{Number(bin.avgCost).toFixed(2)}</td>
                  <td className="table-cell">{Number(bin.totalValue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة مستودع">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم *</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الاسم بالعربي</label>
            <input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">العنوان</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            مستودع افتراضي
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allowNegative} onChange={(e) => setForm({ ...form, allowNegative: e.target.checked })} />
            السماح برصيد سالب
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
