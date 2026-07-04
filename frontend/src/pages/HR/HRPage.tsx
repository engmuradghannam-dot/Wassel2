import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon, CheckCircleIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { useAttendance, useLeaves, usePayrolls } from '../../hooks/useHR';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';

type Tab = 'attendance' | 'leaves' | 'payroll';

const leaveTypeLabel: Record<string, string> = {
  ANNUAL: 'سنوية', SICK: 'مرضية', EMERGENCY: 'طارئة', UNPAID: 'بدون راتب',
  MATERNITY: 'أمومة', PATERNITY: 'أبوة', HAJJ: 'حج', OTHER: 'أخرى',
};

export const HRPage = () => {
  const { selectedCompany } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: Tab[] = ['attendance', 'leaves', 'payroll'];
  const paramTab = searchParams.get('tab') as Tab | null;
  const [tab, setTabState] = useState<Tab>(paramTab && validTabs.includes(paramTab) ? paramTab : 'attendance');
  const setTab = (t: Tab) => { setTabState(t); setSearchParams({ tab: t }); };

  const { records, isLoading: attLoading, createAttendance, isSaving: attSaving } = useAttendance();
  const { leaves, isLoading: leavesLoading, createLeave, updateLeaveStatus, isSaving: leaveSaving } = useLeaves();
  const { payrolls, isLoading: payrollLoading, createPayroll, markPaid, isSaving: payrollSaving } = usePayrolls();
  const { employees } = useEmployees();

  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [attForm, setAttForm] = useState({ employeeId: '', date: new Date().toISOString().slice(0, 10), status: 'PRESENT' });

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', leaveType: 'ANNUAL', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), reason: '' });

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ employeeId: '', periodStart: new Date().toISOString().slice(0, 10), periodEnd: new Date().toISOString().slice(0, 10), overtimePay: 0, bonus: 0 });

  const handleAttSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createAttendance({ ...attForm, date: new Date(attForm.date).toISOString() });
    setIsAttModalOpen(false);
  };

  const handleLeaveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createLeave({ ...leaveForm, startDate: new Date(leaveForm.startDate).toISOString(), endDate: new Date(leaveForm.endDate).toISOString() });
    setIsLeaveModalOpen(false);
  };

  const handlePayrollSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createPayroll({
      ...payrollForm,
      periodStart: new Date(payrollForm.periodStart).toISOString(),
      periodEnd: new Date(payrollForm.periodEnd).toISOString(),
      overtimePay: Number(payrollForm.overtimePay),
      bonus: Number(payrollForm.bonus),
    });
    setIsPayrollModalOpen(false);
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الموارد البشرية</h1>

      <div className="flex gap-2 border-b border-secondary-200">
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'attendance' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('attendance')}>الحضور</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'leaves' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('leaves')}>الإجازات</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'payroll' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('payroll')}>الرواتب</button>
      </div>

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setIsAttModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />تسجيل حضور</button></div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr><th className="table-header-cell">الموظف</th><th className="table-header-cell">التاريخ</th><th className="table-header-cell">الحالة</th><th className="table-header-cell">ساعات العمل</th></tr></thead>
              <tbody className="table-body">
                {attLoading && <tr><td className="table-cell" colSpan={4}>جاري التحميل...</td></tr>}
                {!attLoading && records.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={4}>لا يوجد سجلات بعد</td></tr>}
                {records.map((r: any) => (
                  <tr key={r.id}>
                    <td className="table-cell font-medium">{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td className="table-cell">{new Date(r.date).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">{r.status}</td>
                    <td className="table-cell">{r.workHours ? Number(r.workHours).toFixed(1) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setIsLeaveModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />طلب إجازة</button></div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr><th className="table-header-cell">الموظف</th><th className="table-header-cell">النوع</th><th className="table-header-cell">من</th><th className="table-header-cell">إلى</th><th className="table-header-cell">الأيام</th><th className="table-header-cell">الحالة</th><th className="table-header-cell">إجراءات</th></tr></thead>
              <tbody className="table-body">
                {leavesLoading && <tr><td className="table-cell" colSpan={7}>جاري التحميل...</td></tr>}
                {!leavesLoading && leaves.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={7}>لا يوجد طلبات بعد</td></tr>}
                {leaves.map((l: any) => (
                  <tr key={l.id}>
                    <td className="table-cell font-medium">{l.employee?.firstName} {l.employee?.lastName}</td>
                    <td className="table-cell">{leaveTypeLabel[l.leaveType]}</td>
                    <td className="table-cell">{new Date(l.startDate).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">{new Date(l.endDate).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">{l.days}</td>
                    <td className="table-cell"><span className={l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}>{l.status}</span></td>
                    <td className="table-cell">
                      {l.status === 'PENDING' && (
                        <button onClick={() => updateLeaveStatus({ id: l.id, status: 'APPROVED' })} className="text-success-600 hover:text-success-800" title="اعتماد">
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

      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button className="btn-primary" onClick={() => setIsPayrollModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />إنشاء كشف راتب</button></div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr><th className="table-header-cell">الموظف</th><th className="table-header-cell">الفترة</th><th className="table-header-cell">إجمالي الاستحقاقات</th><th className="table-header-cell">التأمينات (GOSI)</th><th className="table-header-cell">صافي الراتب</th><th className="table-header-cell">الحالة</th><th className="table-header-cell">إجراءات</th></tr></thead>
              <tbody className="table-body">
                {payrollLoading && <tr><td className="table-cell" colSpan={7}>جاري التحميل...</td></tr>}
                {!payrollLoading && payrolls.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={7}>لا يوجد كشوفات رواتب بعد</td></tr>}
                {payrolls.map((p: any) => (
                  <tr key={p.id}>
                    <td className="table-cell font-medium">{p.employee?.firstName} {p.employee?.lastName}</td>
                    <td className="table-cell">{new Date(p.periodStart).toLocaleDateString('ar-SA')} - {new Date(p.periodEnd).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">{formatCurrency(Number(p.totalEarnings), selectedCompany.currency)}</td>
                    <td className="table-cell">{formatCurrency(Number(p.gosiEmployee), selectedCompany.currency)}</td>
                    <td className="table-cell font-bold">{formatCurrency(Number(p.netSalary), selectedCompany.currency)}</td>
                    <td className="table-cell"><span className={p.status === 'PAID' ? 'badge-success' : 'badge-warning'}>{p.status}</span></td>
                    <td className="table-cell">
                      {p.status !== 'PAID' && (
                        <button onClick={() => markPaid(p.id)} className="text-success-600 hover:text-success-800" title="تسجيل الصرف">
                          <BanknotesIcon className="h-5 w-5" />
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

      <Modal isOpen={isAttModalOpen} onClose={() => setIsAttModalOpen(false)} title="تسجيل حضور">
        <form onSubmit={handleAttSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الموظف *</label>
            <select required className="input" value={attForm.employeeId} onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })}>
              <option value="">اختر موظف</option>
              {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">التاريخ</label><input type="date" className="input" value={attForm.date} onChange={(e) => setAttForm({ ...attForm, date: e.target.value })} /></div>
            <div>
              <label className="block text-sm font-medium mb-1">الحالة</label>
              <select className="input" value={attForm.status} onChange={(e) => setAttForm({ ...attForm, status: e.target.value })}>
                <option value="PRESENT">حاضر</option><option value="ABSENT">غائب</option><option value="LATE">متأخر</option><option value="HALF_DAY">نصف يوم</option><option value="ON_LEAVE">إجازة</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsAttModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={attSaving} className="btn-primary">{attSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="طلب إجازة">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الموظف *</label>
            <select required className="input" value={leaveForm.employeeId} onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}>
              <option value="">اختر موظف</option>
              {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">نوع الإجازة</label>
            <select className="input" value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}>
              {Object.entries(leaveTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">من تاريخ</label><input type="date" className="input" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">إلى تاريخ</label><input type="date" className="input" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsLeaveModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={leaveSaving} className="btn-primary">{leaveSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title="إنشاء كشف راتب">
        <form onSubmit={handlePayrollSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الموظف *</label>
            <select required className="input" value={payrollForm.employeeId} onChange={(e) => setPayrollForm({ ...payrollForm, employeeId: e.target.value })}>
              <option value="">اختر موظف</option>
              {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">بداية الفترة</label><input type="date" className="input" value={payrollForm.periodStart} onChange={(e) => setPayrollForm({ ...payrollForm, periodStart: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">نهاية الفترة</label><input type="date" className="input" value={payrollForm.periodEnd} onChange={(e) => setPayrollForm({ ...payrollForm, periodEnd: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">ساعات إضافية (مبلغ)</label><input type="number" min={0} step="0.01" className="input" value={payrollForm.overtimePay} onChange={(e) => setPayrollForm({ ...payrollForm, overtimePay: Number(e.target.value) })} /></div>
            <div><label className="block text-sm font-medium mb-1">مكافأة</label><input type="number" min={0} step="0.01" className="input" value={payrollForm.bonus} onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) })} /></div>
          </div>
          <p className="text-xs text-secondary-500 bg-secondary-50 rounded-lg p-3">
            سيتم حساب التأمينات الاجتماعية (GOSI) تلقائيًا حسب جنسية الموظف والراتب الأساسي وبدل السكن المسجّلين ببياناته.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsPayrollModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={payrollSaving} className="btn-primary">{payrollSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
