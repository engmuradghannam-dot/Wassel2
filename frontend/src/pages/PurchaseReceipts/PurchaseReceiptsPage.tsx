import { useState, FormEvent } from 'react';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { purchaseReceiptApi } from '../../services/api';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';

type Line = { itemId: string; quantity: number; unitCost: number };

export const PurchaseReceiptsPage = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;
  const { suppliers } = useSuppliers();
  const { warehouses } = useWarehouses();
  const { items } = useItems();

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-receipts', companyId],
    queryFn: () => purchaseReceiptApi.getAll({ companyId }),
    enabled: !!companyId,
  });
  const receipts = (data?.data as any[]) || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchase-receipts', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => purchaseReceiptApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء إيصال الاستلام'); invalidate(); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'تعذر الإنشاء'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => purchaseReceiptApi.submit(id),
    onSuccess: () => { toast.success('تم استلام البضاعة وتحديث المخزون'); invalidate(); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'تعذر الاعتماد'),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [landedCost, setLandedCost] = useState(0);
  const [lines, setLines] = useState<Line[]>([{ itemId: '', quantity: 1, unitCost: 0 }]);

  const resetForm = () => {
    setSupplierId(''); setWarehouseId(''); setLandedCost(0);
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
    if (validLines.length === 0 || !supplierId || !warehouseId) return;
    await createMutation.mutateAsync({
      receiptDate: new Date().toISOString(),
      supplierId, warehouseId, landedCost,
      items: validLines,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleSubmitReceipt = async (receipt: any) => {
    if (confirm(`استلام البضاعة ${receipt.receiptNumber}؟ سيتم تحديث المخزون فعليًا.`)) {
      await submitMutation.mutateAsync(receipt.id);
    }
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إيصالات الاستلام</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 ml-1" />
          إيصال جديد
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">رقم الإيصال</th>
              <th className="table-header-cell">المورد</th>
              <th className="table-header-cell">المستودع</th>
              <th className="table-header-cell">الحالة</th>
              <th className="table-header-cell">إجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
            {!isLoading && receipts.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد إيصالات بعد</td></tr>
            )}
            {receipts.map((r) => (
              <tr key={r.id}>
                <td className="table-cell font-medium">{r.receiptNumber}</td>
                <td className="table-cell">{r.supplier?.name}</td>
                <td className="table-cell">{r.warehouse?.name}</td>
                <td className="table-cell">
                  <span className={r.status === 'SUBMITTED' ? 'badge-success' : 'badge-warning'}>{r.status}</span>
                </td>
                <td className="table-cell">
                  {r.status === 'DRAFT' && (
                    <button onClick={() => handleSubmitReceipt(r)} className="text-success-600 hover:text-success-800" title="استلام">
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إيصال استلام جديد">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">المورد *</label>
              <select required className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">اختر مورد</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المستودع *</label>
              <select required className="input" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">اختر مستودع</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">الأصناف المستلمة</label>
              <button type="button" onClick={addLine} className="text-primary-600 text-sm hover:underline">+ إضافة صنف</button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select className="input col-span-6" value={line.itemId} onChange={(e) => updateLine(i, { itemId: e.target.value })}>
                    <option value="">اختر منتج</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input type="number" min={0.01} step="0.01" placeholder="الكمية" className="input col-span-3"
                    value={line.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                  <input type="number" min={0} step="0.01" placeholder="تكلفة الوحدة" className="input col-span-2"
                    value={line.unitCost} onChange={(e) => updateLine(i, { unitCost: Number(e.target.value) })} />
                  <button type="button" onClick={() => removeLine(i)} className="col-span-1 text-danger-500">×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">تكاليف إضافية (شحن/جمارك) — تُوزّع تلقائيًا على الأصناف</label>
            <input type="number" min={0} step="0.01" className="input" value={landedCost} onChange={(e) => setLandedCost(Number(e.target.value))} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
