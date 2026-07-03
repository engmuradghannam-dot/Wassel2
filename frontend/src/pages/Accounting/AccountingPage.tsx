import { useState, FormEvent } from 'react';
import { PlusIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAccounts, useJournalEntries } from '../../hooks/useAccounting';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';
import { JournalEntry } from '../../types';

type JELine = { debitAccountId: string; creditAccountId: string; amount: number; description: string };

const accountTypeOptions = [
  { value: 'CURRENT_ASSET', label: 'أصول متداولة' },
  { value: 'FIXED_ASSET', label: 'أصول ثابتة' },
  { value: 'INTANGIBLE_ASSET', label: 'أصول غير ملموسة' },
  { value: 'CURRENT_LIABILITY', label: 'خصوم متداولة' },
  { value: 'LONG_TERM_LIABILITY', label: 'خصوم طويلة الأجل' },
  { value: 'CAPITAL', label: 'رأس المال' },
  { value: 'RETAINED_EARNINGS', label: 'أرباح محتجزة' },
  { value: 'OPERATING_INCOME', label: 'إيرادات تشغيلية' },
  { value: 'OTHER_INCOME', label: 'إيرادات أخرى' },
  { value: 'COST_OF_GOODS_SOLD', label: 'تكلفة البضاعة المباعة' },
  { value: 'OPERATING_EXPENSE', label: 'مصروفات تشغيلية' },
  { value: 'ADMIN_EXPENSE', label: 'مصروفات إدارية' },
  { value: 'SELLING_EXPENSE', label: 'مصروفات بيعية' },
  { value: 'OTHER_EXPENSE', label: 'مصروفات أخرى' },
];

const typeLabel: Record<string, string> = {
  ASSET: 'أصول', LIABILITY: 'خصوم', EQUITY: 'حقوق ملكية', INCOME: 'إيرادات', EXPENSE: 'مصروفات',
};

const emptyAccountForm = { code: '', name: '', nameAr: '', type: 'ASSET', accountType: 'CURRENT_ASSET', openingBalance: 0 };

export const AccountingPage = () => {
  const { selectedCompany } = useAuthStore();
  const [tab, setTab] = useState<'accounts' | 'journal'>('accounts');

  const { accounts, isLoading: accountsLoading, createAccount, isSaving: accountSaving } = useAccounts();
  const { journalEntries, isLoading: jeLoading, createJournalEntry, postJournalEntry, cancelJournalEntry, isSaving: jeSaving } = useJournalEntries();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<any>(emptyAccountForm);

  const [isJEModalOpen, setIsJEModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [jeLines, setJeLines] = useState<JELine[]>([{ debitAccountId: '', creditAccountId: '', amount: 0, description: '' }]);

  const handleAccountSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createAccount({ ...accountForm, openingBalance: Number(accountForm.openingBalance) });
    setAccountForm(emptyAccountForm);
    setIsAccountModalOpen(false);
  };

  const updateJeLine = (i: number, patch: Partial<JELine>) => {
    setJeLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addJeLine = () => setJeLines((prev) => [...prev, { debitAccountId: '', creditAccountId: '', amount: 0, description: '' }]);
  const removeJeLine = (i: number) => setJeLines((prev) => prev.filter((_, idx) => idx !== i));

  const jeTotalDebit = jeLines.reduce((s, l) => s + (l.debitAccountId ? Number(l.amount) : 0), 0);
  const jeTotalCredit = jeLines.reduce((s, l) => s + (l.creditAccountId ? Number(l.amount) : 0), 0);
  const jeBalanced = jeTotalDebit === jeTotalCredit && jeTotalDebit > 0;

  const handleJESubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!jeBalanced) return;
    const validLines = jeLines.filter((l) => (l.debitAccountId || l.creditAccountId) && l.amount > 0);
    await createJournalEntry({
      entryDate: new Date(entryDate).toISOString(),
      description,
      lines: validLines.map((l) => ({
        debitAccountId: l.debitAccountId || undefined,
        creditAccountId: l.creditAccountId || undefined,
        amount: Number(l.amount),
        description: l.description,
      })),
    });
    setEntryDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setJeLines([{ debitAccountId: '', creditAccountId: '', amount: 0, description: '' }]);
    setIsJEModalOpen(false);
  };

  const handlePost = async (entry: JournalEntry) => {
    if (confirm(`ترحيل القيد ${entry.entryNumber}؟ سيتم تحديث أرصدة الحسابات فعليًا.`)) {
      await postJournalEntry(entry.id);
    }
  };
  const handleCancelJE = async (entry: JournalEntry) => {
    if (confirm(`إلغاء القيد ${entry.entryNumber}؟`)) await cancelJournalEntry(entry.id);
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المحاسبة</h1>

      <div className="flex gap-2 border-b border-secondary-200">
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'accounts' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('accounts')}>
          دليل الحسابات
        </button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'journal' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('journal')}>
          القيود اليومية
        </button>
      </div>

      {tab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsAccountModalOpen(true)}>
              <PlusIcon className="h-5 w-5 ml-1" />
              إضافة حساب
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">الكود</th>
                  <th className="table-header-cell">اسم الحساب</th>
                  <th className="table-header-cell">النوع</th>
                  <th className="table-header-cell">الرصيد الحالي</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {accountsLoading && <tr><td className="table-cell" colSpan={4}>جاري التحميل...</td></tr>}
                {!accountsLoading && accounts.length === 0 && (
                  <tr><td className="table-cell text-secondary-500" colSpan={4}>لا يوجد حسابات بعد</td></tr>
                )}
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="table-cell">{acc.code}</td>
                    <td className="table-cell font-medium">{acc.name}</td>
                    <td className="table-cell">{typeLabel[acc.type]}</td>
                    <td className="table-cell">{formatCurrency(acc.currentBalance, acc.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'journal' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsJEModalOpen(true)}>
              <PlusIcon className="h-5 w-5 ml-1" />
              قيد جديد
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">رقم القيد</th>
                  <th className="table-header-cell">التاريخ</th>
                  <th className="table-header-cell">الوصف</th>
                  <th className="table-header-cell">المدين</th>
                  <th className="table-header-cell">الدائن</th>
                  <th className="table-header-cell">الحالة</th>
                  <th className="table-header-cell">إجراءات</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {jeLoading && <tr><td className="table-cell" colSpan={7}>جاري التحميل...</td></tr>}
                {!jeLoading && journalEntries.length === 0 && (
                  <tr><td className="table-cell text-secondary-500" colSpan={7}>لا يوجد قيود بعد</td></tr>
                )}
                {journalEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="table-cell font-medium">{entry.entryNumber}</td>
                    <td className="table-cell">{new Date(entry.entryDate).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">{entry.description || '-'}</td>
                    <td className="table-cell">{formatCurrency(entry.totalDebit, selectedCompany.currency)}</td>
                    <td className="table-cell">{formatCurrency(entry.totalCredit, selectedCompany.currency)}</td>
                    <td className="table-cell">
                      <span className={entry.status === 'POSTED' ? 'badge-success' : entry.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {entry.status === 'DRAFT' && (
                        <div className="flex gap-2">
                          <button onClick={() => handlePost(entry)} className="text-success-600 hover:text-success-800" title="ترحيل">
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleCancelJE(entry)} className="text-danger-600 hover:text-danger-800" title="إلغاء">
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
        </div>
      )}

      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="إضافة حساب">
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">كود الحساب *</label>
              <input required className="input" value={accountForm.code} onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم الحساب *</label>
              <input required className="input" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التصنيف الرئيسي</label>
            <select className="input" value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}>
              {Object.entries(typeLabel).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التصنيف الفرعي</label>
            <select className="input" value={accountForm.accountType} onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}>
              {accountTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الرصيد الافتتاحي</label>
            <input type="number" step="0.01" className="input" value={accountForm.openingBalance} onChange={(e) => setAccountForm({ ...accountForm, openingBalance: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsAccountModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={accountSaving} className="btn-primary">{accountSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isJEModalOpen} onClose={() => setIsJEModalOpen(false)} title="قيد يومية جديد">
        <form onSubmit={handleJESubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">التاريخ</label>
              <input type="date" className="input" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الوصف</label>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">البنود (كل سطر: حساب مدين أو دائن + مبلغ)</label>
              <button type="button" onClick={addJeLine} className="text-primary-600 text-sm hover:underline">+ إضافة سطر</button>
            </div>
            <div className="space-y-2">
              {jeLines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select className="input col-span-4" value={line.debitAccountId}
                    onChange={(e) => updateJeLine(i, { debitAccountId: e.target.value, creditAccountId: e.target.value ? '' : line.creditAccountId })}>
                    <option value="">مدين: بدون</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                  <select className="input col-span-4" value={line.creditAccountId}
                    onChange={(e) => updateJeLine(i, { creditAccountId: e.target.value, debitAccountId: e.target.value ? '' : line.debitAccountId })}>
                    <option value="">دائن: بدون</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                  </select>
                  <input type="number" min={0} step="0.01" placeholder="المبلغ" className="input col-span-3"
                    value={line.amount} onChange={(e) => updateJeLine(i, { amount: Number(e.target.value) })} />
                  <button type="button" onClick={() => removeJeLine(i)} className="col-span-1 text-danger-500">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-lg p-3 text-sm flex justify-between ${jeBalanced ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
            <span>إجمالي المدين: {jeTotalDebit.toFixed(2)}</span>
            <span>إجمالي الدائن: {jeTotalCredit.toFixed(2)}</span>
            <span>{jeBalanced ? 'القيد متوازن ✓' : 'القيد غير متوازن'}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsJEModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={jeSaving || !jeBalanced} className="btn-primary disabled:opacity-50">
              {jeSaving ? 'جاري الحفظ...' : 'حفظ القيد'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
