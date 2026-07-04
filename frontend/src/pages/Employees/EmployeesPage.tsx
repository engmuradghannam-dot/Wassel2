import { useState, FormEvent } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { Employee } from '../../types';
import { formatCurrency } from '../../utils/currency';

const emptyForm = {
  firstName: '', lastName: '', nameAr: '', email: '', phone: '',
  nationality: 'SA', department: '', designation: '',
  employmentType: 'FULL_TIME', dateOfJoining: new Date().toISOString().slice(0, 10),
  basicSalary: 0, housingAllowance: 0, transportAllowance: 0, otherAllowance: 0,
};

const employmentTypeLabel: Record<string, string> = {
  FULL_TIME: 'دوام كامل', PART_TIME: 'دوام جزئي', CONTRACT: 'عقد', INTERN: 'متدرب',
};

export const EmployeesPage = () => {
  const { selectedCompany } = useAuthStore();
  const { employees, isLoading, createEmployee, updateEmployee, deleteEmployee, isSaving } = useEmployees();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setIsModalOpen(true); };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, nameAr: emp.nameAr || '',
      email: emp.email, phone: emp.phone || '', nationality: emp.nationality,
      department: emp.department || '', designation: emp.designation || '',
      employmentType: emp.employmentType, dateOfJoining: emp.dateOfJoining.slice(0, 10),
      basicSalary: emp.basicSalary, housingAllowance: emp.housingAllowance,
      transportAllowance: emp.transportAllowance, otherAllowance: emp.otherAllowance,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      dateOfJoining: new Date(form.dateOfJoining).toISOString(),
      basicSalary: Number(form.basicSalary),
      housingAllowance: Number(form.housingAllowance),
      transportAllowance: Number(form.transportAllowance),
      otherAllowance: Number(form.otherAllowance),
    };
    if (editingId) {
      await updateEmployee({ id: editingId, payload });
    } else {
      await createEmployee(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (emp: Employee) => {
    if (confirm(`متأكد تبي تحذف "${emp.firstName} ${emp.lastName}"؟`)) {
      await deleteEmployee(emp.id);
    }
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الموظفين</h1>
        <button className="btn-primary" onClick={openCreate}>
          <PlusIcon className="h-5 w-5 ml-1" />
          إضافة موظف
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">الرقم الوظيفي</th>
              <th className="table-header-cell">الاسم</th>
              <th className="table-header-cell">القسم</th>
              <th className="table-header-cell">نوع الدوام</th>
              <th className="table-header-cell">إجمالي الراتب</th>
              <th className="table-header-cell">إجراءات</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading && <tr><td className="table-cell" colSpan={6}>جاري التحميل...</td></tr>}
            {!isLoading && employees.length === 0 && (
              <tr><td className="table-cell text-secondary-500" colSpan={6}>لا يوجد موظفين بعد</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="table-cell">{emp.employeeNumber}</td>
                <td className="table-cell font-medium">{emp.firstName} {emp.lastName}</td>
                <td className="table-cell">{emp.department || '-'}</td>
                <td className="table-cell">{employmentTypeLabel[emp.employmentType]}</td>
                <td className="table-cell">{formatCurrency(emp.totalSalary, selectedCompany.currency)}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(emp)} className="text-primary-600 hover:text-primary-800">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(emp)} className="text-danger-600 hover:text-danger-800">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'تعديل موظف' : 'إضافة موظف'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الأول *</label>
              <input required className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم العائلة *</label>
              <input required className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
              <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الجوال</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">القسم</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المسمى الوظيفي</label>
              <input className="input" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">نوع الدوام</label>
              <select className="input" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                {Object.entries(employmentTypeLabel).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الالتحاق</label>
              <input type="date" className="input" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الراتب الأساسي *</label>
              <input required type="number" min={0} step="0.01" className="input" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">بدل السكن</label>
              <input type="number" min={0} step="0.01" className="input" value={form.housingAllowance} onChange={(e) => setForm({ ...form, housingAllowance: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">بدل النقل</label>
              <input type="number" min={0} step="0.01" className="input" value={form.transportAllowance} onChange={(e) => setForm({ ...form, transportAllowance: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">بدلات أخرى</label>
              <input type="number" min={0} step="0.01" className="input" value={form.otherAllowance} onChange={(e) => setForm({ ...form, otherAllowance: e.target.value })} />
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
