// MuradERP Invoices Page
import { useState, FormEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useInvoices } from '../../hooks/useInvoices';
import { useCustomers } from '../../hooks/useCustomers';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useItems } from '../../hooks/useItems';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Invoice } from '../../types';
import { formatCurrency } from '../../utils/currency';

type LineItem = { itemId: string; quantity: number; unitPrice: number; discountPercent: number };

const statusBadge: Record<string, string> = {
  DRAFT: 'badge-warning',
  SUBMITTED: 'badge-info',
  PAID: 'badge-success',
  OVERDUE: 'badge-danger',
  CANCELLED: 'badge-danger',
};

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

export const InvoicesPage = () => {
  const { t, i18n } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const [typeFilter, setTypeFilter] = useState('');
  const { invoices, isLoading, createInvoice, submitInvoice, cancelInvoice, isSaving } =
    useInvoices(typeFilter ? { type: typeFilter } : undefined);
  const { customers } = useCustomers();
  const { suppliers } = useSuppliers();
  const { items } = useItems();

  const statusLabel: Record<string, string> = {
    DRAFT: t('status.draft'),
    SUBMITTED: t('invoices.statusSubmitted'),
    PAID: t('status.paid'),
    OVERDUE: t('status.overdue'),
    CANCELLED: t('invoices.statusCancelled'),
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => todayPlus(0));
  const [dueDate, setDueDate] = useState(() => todayPlus(30));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ itemId: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);

  const resetForm = () => {
    setInvoiceType('SALES');
    setCustomerId('');
    setSupplierId('');
    setInvoiceDate(todayPlus(0));
    setDueDate(todayPlus(30));
    setNotes('');
    setLines([{ itemId: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const onPickItem = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    updateLine(index, {
      itemId,
      unitPrice: item ? item.sellingPrice : 0,
    });
  };

  const addLine = () => setLines((prev) => [...prev, { itemId: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of lines) {
      const item = items.find((i) => i.id === line.itemId);
      const lineSubtotal = line.quantity * line.unitPrice;
      const discount = lineSubtotal * (line.discountPercent / 100);
      const taxable = lineSubtotal - discount;
      const taxRate = item?.taxRate ?? 15;
      subtotal += lineSubtotal - discount;
      tax += taxable * (taxRate / 100);
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [lines, items]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      return;
    }
    await createInvoice({
      invoiceType,
      customerId: invoiceType === 'SALES' ? customerId : undefined,
      supplierId: invoiceType === 'PURCHASE' ? supplierId : undefined,
      invoiceDate: new Date(invoiceDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes,
      items: validLines.map((l) => ({
        itemId: l.itemId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discountPercent: Number(l.discountPercent) || 0,
      })),
    });
    setIsModalOpen(false);
  };

  const handleSubmitInvoice = async (invoice: Invoice) => {
    if (confirm(t('invoices.approveConfirm', { number: invoice.invoiceNumber }))) {
      await submitInvoice(invoice.id);
    }
  };

  const handleCancel = async (invoice: Invoice) => {
    if (confirm(t('invoices.cancelConfirm', { number: invoice.invoiceNumber }))) {
      await cancelInvoice(invoice.id);
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
        <h1 className="text-2xl font-bold">{t('invoices.title')}</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          {t('invoices.newInvoice')}
        </button>
      </div>

      <div className="flex gap-2">
        <select className="input max-w-xs" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">{t('invoices.allInvoices')}</option>
          <option value="SALES">{t('invoices.salesInvoices')}</option>
          <option value="PURCHASE">{t('invoices.purchaseInvoices')}</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">{t('invoices.colNumber')}</th>
              <th className="table-header-cell">{t('invoices.colCustomerSupplier')}</th>
              <th className="table-header-cell">{t('invoices.colDate')}</th>
              <th className="table-header-cell">{t('invoices.colTotal')}</th>
              <th className="table-header-cell">{t('invoices.colStatus')}</th>
              <th className="table-header-cell">{t('invoices.colActions')}</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && (
              <tr><td className="table-cell" colSpan={6}>{t('common.loading')}</td></tr>
            )}
            {!isLoading && invoices.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>{t('invoices.emptyState')}</td></tr>
            )}
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="table-cell font-medium">{invoice.invoiceNumber}</td>
                <td className="table-cell">{invoice.customer?.name || invoice.supplier?.name || '-'}</td>
                <td className="table-cell">{new Date(invoice.invoiceDate).toLocaleDateString(i18n.language)}</td>
                <td className="table-cell">{formatCurrency(invoice.totalAmount, selectedCompany.currency)}</td>
                <td className="table-cell">
                  <span className={statusBadge[invoice.status] || 'badge-info'}>
                    {statusLabel[invoice.status] || invoice.status}
                  </span>
                </td>
                <td className="table-cell">
                  {invoice.status === 'DRAFT' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitInvoice(invoice)} className="text-success-600 hover:text-success-800" title={t('invoices.approveTitle')}>
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleCancel(invoice)} className="text-danger-600 hover:text-danger-800" title={t('invoices.cancelTitle')}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('invoices.modalTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoices.fieldInvoiceType')}</label>
              <select className="input" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value as any)}>
                <option value="SALES">{t('invoices.typeSales')}</option>
                <option value="PURCHASE">{t('invoices.typePurchase')}</option>
              </select>
            </div>
            {invoiceType === 'SALES' ? (
              <div>
                <label className="block text-sm font-medium mb-1">{t('invoices.fieldCustomer')} *</label>
                <select required className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">{t('invoices.chooseCustomer')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">{t('invoices.fieldSupplier')} *</label>
                <select required className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">{t('invoices.chooseSupplier')}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoices.fieldInvoiceDate')}</label>
              <input type="datetime-local" className="input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoices.fieldDueDate')}</label>
              <input type="datetime-local" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">{t('invoices.lineItems')}</label>
              <button type="button" onClick={addLine} className="text-primary-600 text-sm hover:underline">{t('invoices.addLine')}</button>
            </div>
            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    className="input col-span-5"
                    value={line.itemId}
                    onChange={(e) => onPickItem(index, e.target.value)}
                  >
                    <option value="">{t('invoices.chooseProduct')}</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" min={0.01} step="0.01" placeholder={t('invoices.quantity')}
                    className="input col-span-2"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                  />
                  <input
                    type="number" min={0} step="0.01" placeholder={t('invoices.price')}
                    className="input col-span-2"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                  />
                  <input
                    type="number" min={0} max={100} placeholder={t('invoices.discount')}
                    className="input col-span-2"
                    value={line.discountPercent}
                    onChange={(e) => updateLine(index, { discountPercent: Number(e.target.value) })}
                  />
                  <button type="button" onClick={() => removeLine(index)} className="col-span-1 text-danger-500 hover:text-danger-700">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('invoices.fieldNotes')}</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="bg-secondary-50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>{t('invoices.subtotal')}</span><span>{formatCurrency(totals.subtotal, selectedCompany.currency)}</span></div>
            <div className="flex justify-between"><span>{t('invoices.tax')}</span><span>{formatCurrency(totals.tax, selectedCompany.currency)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-secondary-200">
              <span>{t('invoices.total')}</span><span>{formatCurrency(totals.total, selectedCompany.currency)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? t('common.saving') : t('invoices.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
