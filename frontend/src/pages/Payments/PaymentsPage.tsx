import { useState, FormEvent } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paymentApi, invoiceApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';

export const PaymentsPage = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', companyId],
    queryFn: () => paymentApi.getAll({ companyId }),
    enabled: !!companyId,
  });
  const payments = (paymentsData?.data as any[]) || [];

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', companyId, undefined],
    queryFn: () => invoiceApi.getAll({ companyId }),
    enabled: !!companyId,
  });
  const invoices = ((invoicesData?.data as any[]) || []).filter((i) => Number(i.balanceDue) > 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('CASH');

  const createMutation = useMutation({
    mutationFn: (payload: any) => paymentApi.create(payload),
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة');
      queryClient.invalidateQueries({ queryKey: ['payments', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'تعذر تسجيل الدفعة'),
  });

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoiceId || amount <= 0) return;
    await createMutation.mutateAsync({
      invoiceId,
      paymentDate: new Date().toISOString(),
      paymentType: selectedInvoice?.invoiceType === 'PURCHASE' ? 'PAY' : 'RECEIVE',
      paymentMode,
      amount,
    });
    setInvoiceId('');
    setAmount(0);
    setIsModalOpen(false);
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المدفوعات</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 ml-1" />
          تسجيل دفعة
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">رقم الدفعة</th>
              <th className="table-header-cell">الفاتورة</th>
              <th className="table-header-cell">الطرف</th>
              <th className="table-header-cell">المبلغ</th>
              <th className="table-header-cell">طريقة الدفع</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
            {!isLoading && payments.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد مدفوعات بعد</td></tr>
            )}
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="table-cell font-medium">{p.paymentNumber}</td>
                <td className="table-cell">{p.invoice?.invoiceNumber}</td>
                <td className="table-cell">{p.invoice?.customer?.name || p.invoice?.supplier?.name || '-'}</td>
                <td className="table-cell">{formatCurrency(Number(p.amount), selectedCompany.currency)}</td>
                <td className="table-cell">{p.paymentMode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تسجيل دفعة">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الفاتورة *</label>
            <select required className="input" value={invoiceId} onChange={(e) => {
              setInvoiceId(e.target.value);
              const inv = invoices.find((i) => i.id === e.target.value);
              setAmount(inv ? Number(inv.balanceDue) : 0);
            }}>
              <option value="">اختر فاتورة (لها رصيد مستحق)</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — مستحق: {Number(inv.balanceDue).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المبلغ *</label>
            <input required type="number" min={0.01} step="0.01" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
            <select className="input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="CASH">نقدي</option>
              <option value="BANK_TRANSFER">تحويل بنكي</option>
              <option value="CHECK">شيك</option>
            </select>
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
