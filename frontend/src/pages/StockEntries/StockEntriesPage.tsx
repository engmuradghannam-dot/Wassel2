import { useState, FormEvent } from 'react';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useStockEntries } from '../../hooks/useStockEntries';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { StockEntry } from '../../types';

type Line = { itemId: string; quantity: number; unitCost: number };

const typeLabel: Record<string, string> = {
  RECEIPT: 'استلام', ISSUE: 'صرف', TRANSFER: 'تحويل',
  ADJUSTMENT: 'تسوية', RETURN: 'مرتجع', MANUFACTURE: 'تصنيع',
};

const statusBadge: Record<string, string> = {
  DRAFT: 'badge-warning', SUBMITTED: 'badge-success', CANCELLED: 'badge-danger',
};

export const StockEntriesPage = () => {
  const { selectedCompany } = useAuthStore();
  const { stockEntries, isLoading, createStockEntry, submitStockEntry, cancelStockEntry, isSaving } = useStockEntries();
  const { warehouses } = useWarehouses();
  const { items } = useItems();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('RECEIPT');
  const [warehouseId, setWarehouseId] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<Line[]>([{ itemId: '', quantity: 1, unitCost: 0 }]);

  const resetForm = () => {
    setEntryType('RECEIPT');
    setWarehouseId('');
    setEntryDate(new Date().toISOString().slice(0, 16));
    setReference('');
    setLines([{ itemId: '', quantity: 1, unitCost: 0 }]);
  };

  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { itemId: '', quantity: 1, unitCost: 0 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0 || !warehouseId) return;
    await createStockEntry({
      entryType,
      warehouseId,
      entryDate: new Date(entryDate).toISOString(),
      reference,
      items: validLines,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleSubmitEntry = async (entry: StockEntry) => {
    if (confirm(`اعتماد الحركة ${entry.entryNumber}؟ سيتم تحديث أرصدة المخزون فعليًا.`)) {
      await submitStockEntry(entry.id);
    }
  };

  const handleCancel = async (entry: StockEntry) => {
    if (confirm(`إلغاء الحركة ${entry.entryNumber}؟`)) {
      await cancelStockEntry(entry.id);
    }
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">حركات المخزون</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 ml-1" />
          حركة جديدة
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">رقم الحركة</th>
              <th className="table-header-cell">النوع</th>
              <th className="table-header-cell">المستودع</th>
              <th className="table-header-cell">التاريخ</th>
              <th className="table-header-cell">الحالة</th>
              <th className="table-header-cell">إجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={6}>جاري التحميل...</td></tr>}
            {!isLoading && stockEntries.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>لا يوجد حركات بعد</td></tr>
            )}
            {stockEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="table-cell font-medium">{entry.entryNumber}</td>
                <td className="table-cell">{typeLabel[entry.entryType]}</td>
                <td className="table-cell">{entry.warehouse?.name || '-'}</td>
                <td className="table-cell">{new Date(entry.entryDate).toLocaleDateString('ar-SA')}</td>
                <td className="table-cell"><span className={statusBadge[entry.status]}>{entry.status}</span></td>
                <td className="table-cell">
                  {entry.status === 'DRAFT' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitEntry(entry)} className="text-success-600 hover:text-success-800" title="اعتماد">
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleCancel(entry)} className="text-danger-600 hover:text-danger-800" title="إلغاء">
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="حركة مخزون جديدة">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">نوع الحركة</label>
              <select className="input" value={entryType} onChange={(e) => setEntryType(e.target.value)}>
                {Object.entries(typeLabel).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المستودع *</label>
              <select required className="input" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">اختر مستودع</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">التاريخ</label>
              <input type="datetime-local" className="input" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">مرجع</label>
              <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">الأصناف</label>
              <button type="button" onClick={addLine} className="text-primary-600 text-sm hover:underline">+ إضافة صنف</button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="input col-span-6"
                    value={line.itemId}
                    onChange={(e) => updateLine(i, { itemId: e.target.value })}
                  >
                    <option value="">اختر منتج</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" min={0.01} step="0.01" placeholder="الكمية"
                    className="input col-span-3"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  />
                  <input
                    type="number" min={0} step="0.01" placeholder="التكلفة"
                    className="input col-span-2"
                    value={line.unitCost}
                    onChange={(e) => updateLine(i, { unitCost: Number(e.target.value) })}
                  />
                  <button type="button" onClick={() => removeLine(i)} className="col-span-1 text-danger-500">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
