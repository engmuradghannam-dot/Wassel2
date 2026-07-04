import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useBOMs, useWorkOrders } from '../../hooks/useManufacturing';
import { useItems } from '../../hooks/useItems';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';

type Tab = 'bom' | 'workOrders' | 'jobCards';
type RM = { itemId: string; quantity: number; rate: number };

export const ManufacturingPage = () => {
  const { selectedCompany } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: Tab[] = ['bom', 'workOrders', 'jobCards'];
  const paramTab = searchParams.get('tab') as Tab | null;
  const [tab, setTabState] = useState<Tab>(paramTab && validTabs.includes(paramTab) ? paramTab : 'bom');
  const setTab = (t: Tab) => { setTabState(t); setSearchParams({ tab: t }); };

  const { boms, isLoading: bomsLoading, createBOM, isSaving: bomSaving } = useBOMs();
  const { workOrders, isLoading: woLoading, createWorkOrder, completeWorkOrder, isSaving: woSaving } = useWorkOrders();
  const { items } = useItems();
  const { warehouses } = useWarehouses();

  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [bomItemId, setBomItemId] = useState('');
  const [bomQuantity, setBomQuantity] = useState(1);
  const [rawMaterials, setRawMaterials] = useState<RM[]>([{ itemId: '', quantity: 1, rate: 0 }]);

  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [woForm, setWoForm] = useState({ bomId: '', quantity: 1, plannedStartDate: new Date().toISOString().slice(0, 10), plannedEndDate: new Date().toISOString().slice(0, 10), warehouseId: '', fgWarehouseId: '' });

  const updateRm = (i: number, patch: Partial<RM>) => setRawMaterials((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRm = () => setRawMaterials((prev) => [...prev, { itemId: '', quantity: 1, rate: 0 }]);
  const removeRm = (i: number) => setRawMaterials((prev) => prev.filter((_, idx) => idx !== i));

  const handleBomSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validRm = rawMaterials.filter((r) => r.itemId && r.quantity > 0);
    if (!bomItemId || validRm.length === 0) return;
    await createBOM({ itemId: bomItemId, quantity: bomQuantity, rawMaterials: validRm });
    setBomItemId(''); setBomQuantity(1); setRawMaterials([{ itemId: '', quantity: 1, rate: 0 }]);
    setIsBomModalOpen(false);
  };

  const handleWoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createWorkOrder({
      ...woForm,
      plannedStartDate: new Date(woForm.plannedStartDate).toISOString(),
      plannedEndDate: new Date(woForm.plannedEndDate).toISOString(),
    });
    setIsWoModalOpen(false);
  };

  const handleComplete = async (wo: any) => {
    if (confirm(`إكمال أمر الإنتاج ${wo.workOrderNumber}؟ سيتم استهلاك المواد الخام وإضافة المنتج التام للمخزون.`)) {
      await completeWorkOrder(wo.id);
    }
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التصنيع</h1>

      <div className="flex gap-2 border-b border-secondary-200">
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'bom' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('bom')}>قوائم المواد (BOM)</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'workOrders' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('workOrders')}>أوامر الإنتاج</button>
      </div>

      {tab === 'bom' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setIsBomModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />قائمة مواد جديدة</button></div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr>
                <th className="table-header-cell">الرقم</th><th className="table-header-cell">المنتج النهائي</th>
                <th className="table-header-cell">الكمية</th><th className="table-header-cell">عدد المواد الخام</th>
              </tr></thead>
              <tbody className="table-body">
                {bomsLoading && <tr><td className="table-cell" colSpan={4}>جاري التحميل...</td></tr>}
                {!bomsLoading && boms.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={4}>لا يوجد قوائم مواد بعد</td></tr>}
                {boms.map((b: any) => (
                  <tr key={b.id}>
                    <td className="table-cell">{b.bomNumber}</td>
                    <td className="table-cell font-medium">{b.item?.name}</td>
                    <td className="table-cell">{Number(b.quantity)}</td>
                    <td className="table-cell">{b.rawMaterials?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'workOrders' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setIsWoModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />أمر إنتاج جديد</button></div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr>
                <th className="table-header-cell">الرقم</th><th className="table-header-cell">المنتج</th>
                <th className="table-header-cell">الكمية</th><th className="table-header-cell">الحالة</th><th className="table-header-cell">إجراءات</th>
              </tr></thead>
              <tbody className="table-body">
                {woLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
                {!woLoading && workOrders.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد أوامر إنتاج بعد</td></tr>}
                {workOrders.map((wo: any) => (
                  <tr key={wo.id}>
                    <td className="table-cell">{wo.workOrderNumber}</td>
                    <td className="table-cell font-medium">{wo.bom?.item?.name}</td>
                    <td className="table-cell">{Number(wo.quantity)}</td>
                    <td className="table-cell"><span className={wo.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}>{wo.status}</span></td>
                    <td className="table-cell">
                      {wo.status !== 'COMPLETED' && (
                        <button onClick={() => handleComplete(wo)} className="text-success-600 hover:text-success-800" title="إكمال">
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isBomModalOpen} onClose={() => setIsBomModalOpen(false)} title="قائمة مواد جديدة">
        <form onSubmit={handleBomSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">المنتج النهائي *</label>
              <select required className="input" value={bomItemId} onChange={(e) => setBomItemId(e.target.value)}>
                <option value="">اختر منتج</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الكمية المنتجة بهذه القائمة</label>
              <input type="number" min={0.01} step="0.01" className="input" value={bomQuantity} onChange={(e) => setBomQuantity(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">المواد الخام</label>
              <button type="button" onClick={addRm} className="text-primary-600 text-sm hover:underline">+ إضافة مادة</button>
            </div>
            <div className="space-y-2">
              {rawMaterials.map((rm, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select className="input col-span-6" value={rm.itemId} onChange={(e) => updateRm(i, { itemId: e.target.value })}>
                    <option value="">اختر مادة خام</option>
                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input type="number" min={0.01} step="0.01" placeholder="الكمية" className="input col-span-2" value={rm.quantity} onChange={(e) => updateRm(i, { quantity: Number(e.target.value) })} />
                  <input type="number" min={0} step="0.01" placeholder="التكلفة" className="input col-span-3" value={rm.rate} onChange={(e) => updateRm(i, { rate: Number(e.target.value) })} />
                  <button type="button" onClick={() => removeRm(i)} className="col-span-1 text-danger-500">×</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsBomModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={bomSaving} className="btn-primary">{bomSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isWoModalOpen} onClose={() => setIsWoModalOpen(false)} title="أمر إنتاج جديد">
        <form onSubmit={handleWoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">قائمة المواد (BOM) *</label>
            <select required className="input" value={woForm.bomId} onChange={(e) => setWoForm({ ...woForm, bomId: e.target.value })}>
              <option value="">اختر قائمة مواد</option>
              {boms.map((b: any) => <option key={b.id} value={b.id}>{b.bomNumber} - {b.item?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الكمية المطلوب إنتاجها</label>
            <input type="number" min={0.01} step="0.01" className="input" value={woForm.quantity} onChange={(e) => setWoForm({ ...woForm, quantity: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">تاريخ البدء المخطط</label><input type="date" className="input" value={woForm.plannedStartDate} onChange={(e) => setWoForm({ ...woForm, plannedStartDate: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">تاريخ الانتهاء المخطط</label><input type="date" className="input" value={woForm.plannedEndDate} onChange={(e) => setWoForm({ ...woForm, plannedEndDate: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">مستودع المواد الخام *</label>
              <select required className="input" value={woForm.warehouseId} onChange={(e) => setWoForm({ ...woForm, warehouseId: e.target.value })}>
                <option value="">اختر مستودع</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">مستودع المنتج التام *</label>
              <select required className="input" value={woForm.fgWarehouseId} onChange={(e) => setWoForm({ ...woForm, fgWarehouseId: e.target.value })}>
                <option value="">اختر مستودع</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsWoModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={woSaving} className="btn-primary">{woSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
