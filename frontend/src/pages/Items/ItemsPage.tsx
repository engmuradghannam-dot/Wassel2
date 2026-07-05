// MuradERP Items Page
import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useItems } from '../../hooks/useItems';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Item } from '../../types';
import { formatCurrency } from '../../utils/currency';

type Tab = 'basic' | 'logistics' | 'sales' | 'purchasing' | 'inventory' | 'mrp' | 'quality';

const emptyForm: any = {
  code: '', name: '', nameAr: '', description: '', oldItemCode: '', manufacturerName: '', manufacturerPartNumber: '', barcode: '',
  itemType: 'INVENTORY', itemGroup: '', division: '', brand: '', countryOfOrigin: 'SA', hsCode: '',
  unitOfMeasure: 'PCS', grossWeight: '', netWeight: '', weightUnit: 'KG', volume: '', volumeUnit: 'M3',
  length: '', width: '', height: '',
  standardCost: 0, sellingPrice: 0, priceControl: 'STANDARD',
  salesUnitOfMeasure: '', minOrderQuantity: '', deliveryTimeDays: '',
  purchasingUnitOfMeasure: '', purchasingGroup: '', preferredSupplierId: '', goodsReceiptBasedInvoiceVerification: true,
  isStockItem: true, batchManaged: false, serialManaged: false, shelfLifeDays: '', storageConditions: '', isHazardous: false,
  procurementType: 'BUY', lotSizingProcedure: 'LOT_FOR_LOT', safetyStock: 0, planningTimeFenceDays: 0,
  reorderLevel: 0, reorderQuantity: 0,
  qualityInspectionRequired: false,
  taxRate: 15, taxClassification: 'STANDARD_RATED',
};

const tabs: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'بيانات أساسية' },
  { key: 'logistics', label: 'الأبعاد والوزن' },
  { key: 'sales', label: 'المبيعات' },
  { key: 'purchasing', label: 'المشتريات' },
  { key: 'inventory', label: 'المخزون' },
  { key: 'mrp', label: 'تخطيط MRP' },
  { key: 'quality', label: 'الجودة والضريبة' },
];

export const ItemsPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [search, setSearch] = useState('');
  const { items, isLoading, createItem, updateItem, deleteItem, isSaving } = useItems(search);
  const { suppliers } = useSuppliers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('basic');
  const [form, setForm] = useState<any>(emptyForm);

  const set = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTab('basic');
    setIsModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item });
    setTab('basic');
    setIsModalOpen(true);
  };

  const numOrUndef = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      code: form.code || undefined,
      standardCost: Number(form.standardCost),
      sellingPrice: Number(form.sellingPrice),
      reorderLevel: Number(form.reorderLevel),
      reorderQuantity: Number(form.reorderQuantity),
      taxRate: Number(form.taxRate),
      safetyStock: Number(form.safetyStock),
      planningTimeFenceDays: Number(form.planningTimeFenceDays),
      grossWeight: numOrUndef(form.grossWeight),
      netWeight: numOrUndef(form.netWeight),
      volume: numOrUndef(form.volume),
      length: numOrUndef(form.length),
      width: numOrUndef(form.width),
      height: numOrUndef(form.height),
      minOrderQuantity: numOrUndef(form.minOrderQuantity),
      deliveryTimeDays: numOrUndef(form.deliveryTimeDays),
      shelfLifeDays: numOrUndef(form.shelfLifeDays),
      preferredSupplierId: form.preferredSupplierId || undefined,
    };
    if (editingId) {
      await updateItem({ id: editingId, payload });
    } else {
      await createItem(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (item: Item) => {
    if (confirm(t('items.confirmDelete', { name: item.name }))) {
      await deleteItem(item.id);
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
        <h1 className="text-2xl font-bold">{t('items.title')}</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          {t('items.addTitle')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-2.5 text-secondary-400" />
        <input
          className="input pr-10"
          placeholder={t('items.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">{t('items.colCode')}</th>
              <th className="table-header-cell">{t('items.colName')}</th>
              <th className="table-header-cell">{t('items.colGroup')}</th>
              <th className="table-header-cell">{t('items.colUOM')}</th>
              <th className="table-header-cell">{t('items.colPrice')}</th>
              <th className="table-header-cell">{t('items.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={6}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>{t('items.emptyState')}</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="table-cell">{item.code}</td>
                <td className="table-cell font-medium">
                  {item.name}
                  {item.isHazardous && <ExclamationTriangleIcon className="inline w-4 h-4 text-warning-600 ms-1" title="مادة خطرة" />}
                </td>
                <td className="table-cell">{item.itemGroup || '-'}</td>
                <td className="table-cell">{item.unitOfMeasure}</td>
                <td className="table-cell">{formatCurrency(item.sellingPrice, 'SAR')}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="text-danger-600 hover:text-danger-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('items.editTitle') : t('items.addTitle')} size="xl">
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

          {tab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldName')} *</label>
                  <input required className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldNameAr')}</label>
                  <input className="input" value={form.nameAr} onChange={(e) => set({ nameAr: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع الصنف</label>
                  <select className="input" value={form.itemType} onChange={(e) => set({ itemType: e.target.value })}>
                    <option value="INVENTORY">مخزون</option>
                    <option value="NON_INVENTORY">غير مخزون</option>
                    <option value="SERVICE">خدمة</option>
                    <option value="ASSET">أصل</option>
                    <option value="RAW_MATERIAL">مادة خام</option>
                    <option value="FINISHED_GOOD">منتج تام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldGroup')}</label>
                  <input className="input" value={form.itemGroup} onChange={(e) => set({ itemGroup: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">القسم (Division)</label>
                  <input className="input" value={form.division} onChange={(e) => set({ division: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">العلامة التجارية</label>
                  <input className="input" value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الباركود (EAN/UPC)</label>
                  <input className="input" value={form.barcode} onChange={(e) => set({ barcode: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الرمز القديم</label>
                  <input className="input" value={form.oldItemCode} onChange={(e) => set({ oldItemCode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">اسم الشركة المصنّعة</label>
                  <input className="input" value={form.manufacturerName} onChange={(e) => set({ manufacturerName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم قطعة المصنّع</label>
                  <input className="input" value={form.manufacturerPartNumber} onChange={(e) => set({ manufacturerPartNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">بلد المنشأ (ISO)</label>
                  <input className="input" value={form.countryOfOrigin} onChange={(e) => set({ countryOfOrigin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الرمز الجمركي (HS Code)</label>
                  <input className="input" placeholder="8471.30" value={form.hsCode} onChange={(e) => set({ hsCode: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'logistics' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('items.fieldUOM')}</label>
                <input className="input" value={form.unitOfMeasure} onChange={(e) => set({ unitOfMeasure: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الوزن الإجمالي</label>
                  <input type="number" step="0.001" className="input" value={form.grossWeight} onChange={(e) => set({ grossWeight: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الوزن الصافي</label>
                  <input type="number" step="0.001" className="input" value={form.netWeight} onChange={(e) => set({ netWeight: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وحدة الوزن</label>
                  <select className="input" value={form.weightUnit} onChange={(e) => set({ weightUnit: e.target.value })}>
                    <option value="KG">كجم</option>
                    <option value="G">جم</option>
                    <option value="TON">طن</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الطول (سم)</label>
                  <input type="number" className="input" value={form.length} onChange={(e) => set({ length: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">العرض (سم)</label>
                  <input type="number" className="input" value={form.width} onChange={(e) => set({ width: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الارتفاع (سم)</label>
                  <input type="number" className="input" value={form.height} onChange={(e) => set({ height: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحجم</label>
                  <input type="number" step="0.001" className="input" value={form.volume} onChange={(e) => set({ volume: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'sales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldSellingPrice')}</label>
                  <input type="number" min={0} className="input" value={form.sellingPrice} onChange={(e) => set({ sellingPrice: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">وحدة بيع مختلفة (اختياري)</label>
                  <input className="input" value={form.salesUnitOfMeasure} onChange={(e) => set({ salesUnitOfMeasure: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الحد الأدنى للطلب</label>
                  <input type="number" min={0} className="input" value={form.minOrderQuantity} onChange={(e) => set({ minOrderQuantity: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مدة التسليم (أيام)</label>
                  <input type="number" min={0} className="input" value={form.deliveryTimeDays} onChange={(e) => set({ deliveryTimeDays: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'purchasing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldStandardCost')}</label>
                  <input type="number" min={0} className="input" value={form.standardCost} onChange={(e) => set({ standardCost: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">طريقة التسعير</label>
                  <select className="input" value={form.priceControl} onChange={(e) => set({ priceControl: e.target.value })}>
                    <option value="STANDARD">تكلفة معيارية</option>
                    <option value="MOVING_AVERAGE">متوسط متحرك</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">وحدة شراء مختلفة (اختياري)</label>
                  <input className="input" value={form.purchasingUnitOfMeasure} onChange={(e) => set({ purchasingUnitOfMeasure: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">مجموعة المشتريات</label>
                  <input className="input" value={form.purchasingGroup} onChange={(e) => set({ purchasingGroup: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المورد المفضّل</label>
                <select className="input" value={form.preferredSupplierId} onChange={(e) => set({ preferredSupplierId: e.target.value })}>
                  <option value="">-</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.goodsReceiptBasedInvoiceVerification} onChange={(e) => set({ goodsReceiptBasedInvoiceVerification: e.target.checked })} />
                يتطلب مطابقة ثلاثية (فاتورة مقابل إذن استلام) قبل السداد
              </label>
            </div>
          )}

          {tab === 'inventory' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isStockItem} onChange={(e) => set({ isStockItem: e.target.checked })} />
                {t('items.fieldIsStock')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.batchManaged} onChange={(e) => set({ batchManaged: e.target.checked })} />
                  إدارة بالدفعات (Batch)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.serialManaged} onChange={(e) => set({ serialManaged: e.target.checked })} />
                  إدارة بالرقم التسلسلي
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">مدة الصلاحية (أيام)</label>
                  <input type="number" min={0} className="input" value={form.shelfLifeDays} onChange={(e) => set({ shelfLifeDays: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ظروف التخزين</label>
                  <input className="input" placeholder="يُحفظ مبرّدًا..." value={form.storageConditions} onChange={(e) => set({ storageConditions: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-warning-700">
                <input type="checkbox" checked={form.isHazardous} onChange={(e) => set({ isHazardous: e.target.checked })} />
                مادة خطرة
              </label>
            </div>
          )}

          {tab === 'mrp' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع التوريد</label>
                  <select className="input" value={form.procurementType} onChange={(e) => set({ procurementType: e.target.value })}>
                    <option value="BUY">شراء</option>
                    <option value="MAKE">تصنيع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">أسلوب تحديد الكمية</label>
                  <select className="input" value={form.lotSizingProcedure} onChange={(e) => set({ lotSizingProcedure: e.target.value })}>
                    <option value="LOT_FOR_LOT">حسب الطلب مباشرة</option>
                    <option value="FIXED_QTY">كمية ثابتة</option>
                    <option value="REORDER_POINT">نقطة إعادة الطلب</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldReorderLevel')}</label>
                  <input type="number" min={0} className="input" value={form.reorderLevel} onChange={(e) => set({ reorderLevel: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">كمية إعادة الطلب</label>
                  <input type="number" min={0} className="input" value={form.reorderQuantity} onChange={(e) => set({ reorderQuantity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">مخزون الأمان</label>
                  <input type="number" min={0} className="input" value={form.safetyStock} onChange={(e) => set({ safetyStock: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">فترة تجميد التخطيط (أيام)</label>
                  <input type="number" min={0} className="input" value={form.planningTimeFenceDays} onChange={(e) => set({ planningTimeFenceDays: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {tab === 'quality' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.qualityInspectionRequired} onChange={(e) => set({ qualityInspectionRequired: e.target.checked })} />
                يتطلب فحص جودة عند الاستلام
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('items.fieldTaxRate')}</label>
                  <input type="number" min={0} max={100} className="input" value={form.taxRate} onChange={(e) => set({ taxRate: e.target.value })} />
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
