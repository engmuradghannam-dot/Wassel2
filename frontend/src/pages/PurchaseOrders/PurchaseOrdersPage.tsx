import { useState, FormEvent, useMemo } from 'react';
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { PurchaseOrder } from '../../types';
import { formatCurrency } from '../../utils/currency';

type Line = { itemId: string; quantity: number; unitPrice: number; discountPercent: number };

const statusBadge: Record<string, string> = {
  DRAFT: 'badge-warning', SUBMITTED: 'badge-info', CONFIRMED: 'badge-info',
  PARTIALLY_FULFILLED: 'badge-info', FULFILLED: 'badge-success', CANCELLED: 'badge-danger',
};

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const PurchaseOrdersPage = () => {
  const { selectedCompany } = useAuthStore();
  const { purchaseOrders, isLoading, createPurchaseOrder, submitPurchaseOrder, cancelPurchaseOrder, isSaving } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { items } = useItems();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(() => todayPlus(0));
  const [deliveryDate, setDeliveryDate] = useState(() => todayPlus(14));
  const [lines, setLines] = useState<Line[]>([{ itemId: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);

  const resetForm = () => {
    setSupplierId('');
    setOrderDate(todayPlus(0));
    setDeliveryDate(todayPlus(14));
    setLines([{ itemId: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);
  };

  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { itemId: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const totals = useMemo(() => {
    let subtotal = 0, tax = 0;
    for (const line of lines) {
      const item = items.find((it) => it.id === line.itemId);
      const lineSubtotal = line.quantity * line.unitPrice;
      const discount = lineSubtotal * (line.discountPercent / 100);
      const taxable = lineSubtotal - discount;
      const taxRate = item?.taxRate ?? 15;
      subtotal += taxable;
      tax += taxable * (taxRate / 100);
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [lines, items]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0 || !supplierId) return;
    await createPurchaseOrder({
      supplierId,
      orderDate: new Date(orderDate).toISOString(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      items: validLines,
    });
    resetForm();
    setIsModalOpen(false);
  };

  const handleSubmitOrder = async (order: PurchaseOrder) => {
    if (confirm(`اعتماد أمر الشراء ${order.orderNumber}؟`)) await submitPurchaseOrder(order.id);
  };
  const handleCancel = async (order: PurchaseOrder) => {
    if (confirm(`إلغاء أمر الشراء ${order.orderNumber}؟`)) await cancelPurchaseOrder(order.id);
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">أوامر الشراء</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 ml-1" />
          أمر شراء جديد
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">رقم الأمر</th>
              <th className="table-header-cell">المورد</th>
              <th className="table-header-cell">التاريخ</th>
              <th className="table-header-cell">الإجمالي</th>
              <th className="table-header-cell">الحالة</th>
              <th className="table-header-cell">إجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={6}>جاري التحميل...</td></tr>}
            {!isLoading && purchaseOrders.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>لا يوجد أوامر شراء بعد</td></tr>
            )}
            {purchaseOrders.map((order) => (
              <tr key={order.id}>
                <td className="table-cell font-medium">{order.orderNumber}</td>
                <td className="table-cell">{(order as any).supplier?.name || '-'}</td>
                <td className="table-cell">{new Date(order.orderDate).toLocaleDateString('ar-SA')}</td>
                <td className="table-cell">{formatCurrency(order.totalAmount, selectedCompany.currency)}</td>
                <td className="table-cell"><span className={statusBadge[order.status]}>{order.status}</span></td>
                <td className="table-cell">
                  {order.status === 'DRAFT' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitOrder(order)} className="text-success-600 hover:text-success-800" title="اعتماد">
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleCancel(order)} className="text-danger-600 hover:text-danger-800" title="إلغاء">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="أمر شراء جديد">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">المورد *</label>
            <select required className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">اختر مورد</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الأمر</label>
              <input type="date" className="input" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ التسليم المتوقع</label>
              <input type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">البنود</label>
              <button type="button" onClick={addLine} className="text-primary-600 text-sm hover:underline">+ إضافة بند</button>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="input col-span-5"
                    value={line.itemId}
                    onChange={(e) => {
                      const item = items.find((it) => it.id === e.target.value);
                      updateLine(i, { itemId: e.target.value, unitPrice: item ? item.standardCost : 0 });
                    }}
                  >
                    <option value="">اختر منتج</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input type="number" min={0.01} step="0.01" placeholder="الكمية" className="input col-span-2"
                    value={line.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                  <input type="number" min={0} step="0.01" placeholder="السعر" className="input col-span-2"
                    value={line.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} />
                  <input type="number" min={0} max={100} placeholder="خصم %" className="input col-span-2"
                    value={line.discountPercent} onChange={(e) => updateLine(i, { discountPercent: Number(e.target.value) })} />
                  <button type="button" onClick={() => removeLine(i)} className="col-span-1 text-danger-500 hover:text-danger-700">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-secondary-50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>المجموع الفرعي</span><span>{formatCurrency(totals.subtotal, selectedCompany.currency)}</span></div>
            <div className="flex justify-between"><span>الضريبة</span><span>{formatCurrency(totals.tax, selectedCompany.currency)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-secondary-200">
              <span>الإجمالي</span><span>{formatCurrency(totals.total, selectedCompany.currency)}</span>
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
