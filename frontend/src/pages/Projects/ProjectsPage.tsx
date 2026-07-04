import { useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useProjects, useTasks, useTimesheets } from '../../hooks/useProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';
import { formatCurrency } from '../../utils/currency';

type Tab = 'projects' | 'tasks' | 'timesheets';

const statusLabel: Record<string, string> = {
  PLANNING: 'تخطيط', IN_PROGRESS: 'قيد التنفيذ', ON_HOLD: 'متوقف', COMPLETED: 'مكتمل', CANCELLED: 'ملغي',
  TODO: 'للتنفيذ', REVIEW: 'مراجعة', DONE: 'منجز',
};

export const ProjectsPage = () => {
  const { selectedCompany } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs: Tab[] = ['projects', 'tasks', 'timesheets'];
  const paramTab = searchParams.get('tab') as Tab | null;
  const [tab, setTabState] = useState<Tab>(paramTab && validTabs.includes(paramTab) ? paramTab : 'projects');
  const setTab = (t: Tab) => { setTabState(t); setSearchParams({ tab: t }); };

  const { projects, isLoading: projectsLoading, createProject, isSaving: projectSaving } = useProjects();
  const { tasks, isLoading: tasksLoading, createTask, updateTaskStatus, isSaving: taskSaving } = useTasks();
  const { timesheets, isLoading: tsLoading, createTimesheet, isSaving: tsSaving } = useTimesheets();
  const { employees } = useEmployees();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', startDate: new Date().toISOString().slice(0, 10), endDate: '', estimatedCost: 0, priority: 'MEDIUM' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', projectId: '', dueDate: '', priority: 'MEDIUM' });

  const [isTsModalOpen, setIsTsModalOpen] = useState(false);
  const [tsForm, setTsForm] = useState({ employeeId: '', projectId: '', date: new Date().toISOString().slice(0, 10), hours: 8, activityType: '', billable: true });

  const handleProjectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createProject({
      ...projectForm,
      startDate: new Date(projectForm.startDate).toISOString(),
      endDate: projectForm.endDate ? new Date(projectForm.endDate).toISOString() : undefined,
      estimatedCost: Number(projectForm.estimatedCost),
    });
    setIsProjectModalOpen(false);
  };

  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createTask({
      ...taskForm,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
    });
    setIsTaskModalOpen(false);
  };

  const handleTsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createTimesheet({ ...tsForm, date: new Date(tsForm.date).toISOString(), hours: Number(tsForm.hours) });
    setIsTsModalOpen(false);
  };

  if (!selectedCompany) {
    return <div className="card text-center text-secondary-500">الرجاء اختيار شركة أولًا</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المشاريع</h1>

      <div className="flex gap-2 border-b border-secondary-200">
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'projects' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('projects')}>المشاريع</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'tasks' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('tasks')}>المهام</button>
        <button className={`px-4 py-2 text-sm font-medium ${tab === 'timesheets' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-secondary-500'}`} onClick={() => setTab('timesheets')}>الجداول الزمنية</button>
      </div>

      {tab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsProjectModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />مشروع جديد</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr>
                <th className="table-header-cell">الكود</th><th className="table-header-cell">الاسم</th>
                <th className="table-header-cell">تاريخ البدء</th><th className="table-header-cell">التكلفة التقديرية</th>
                <th className="table-header-cell">الحالة</th><th className="table-header-cell">المهام</th>
              </tr></thead>
              <tbody className="table-body">
                {projectsLoading && <tr><td className="table-cell" colSpan={6}>جاري التحميل...</td></tr>}
                {!projectsLoading && projects.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={6}>لا يوجد مشاريع بعد</td></tr>}
                {projects.map((p: any) => (
                  <tr key={p.id}>
                    <td className="table-cell">{p.projectCode}</td>
                    <td className="table-cell font-medium">{p.name}</td>
                    <td className="table-cell">{new Date(p.startDate).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell">{formatCurrency(p.estimatedCost, selectedCompany.currency)}</td>
                    <td className="table-cell"><span className="badge-info">{statusLabel[p.status]}</span></td>
                    <td className="table-cell">{p._count?.tasks ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsTaskModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />مهمة جديدة</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr>
                <th className="table-header-cell">الكود</th><th className="table-header-cell">العنوان</th>
                <th className="table-header-cell">المشروع</th><th className="table-header-cell">الاستحقاق</th><th className="table-header-cell">الحالة</th>
              </tr></thead>
              <tbody className="table-body">
                {tasksLoading && <tr><td className="table-cell" colSpan={5}>جاري التحميل...</td></tr>}
                {!tasksLoading && tasks.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={5}>لا يوجد مهام بعد</td></tr>}
                {tasks.map((t: any) => (
                  <tr key={t.id}>
                    <td className="table-cell">{t.taskCode}</td>
                    <td className="table-cell font-medium">{t.title}</td>
                    <td className="table-cell">{t.project?.name}</td>
                    <td className="table-cell">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('ar-SA') : '-'}</td>
                    <td className="table-cell">
                      <select className="input py-1 text-xs" value={t.status} onChange={(e) => updateTaskStatus({ id: t.id, status: e.target.value })}>
                        {Object.entries(statusLabel).filter(([v]) => ['TODO','IN_PROGRESS','REVIEW','DONE','CANCELLED'].includes(v)).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'timesheets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setIsTsModalOpen(true)}><PlusIcon className="h-5 w-5 ml-1" />تسجيل وقت</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header"><tr>
                <th className="table-header-cell">التاريخ</th><th className="table-header-cell">المشروع</th>
                <th className="table-header-cell">الساعات</th><th className="table-header-cell">قابل للفوترة</th>
              </tr></thead>
              <tbody className="table-body">
                {tsLoading && <tr><td className="table-cell" colSpan={4}>جاري التحميل...</td></tr>}
                {!tsLoading && timesheets.length === 0 && <tr><td className="table-cell text-secondary-500" colSpan={4}>لا يوجد سجلات بعد</td></tr>}
                {timesheets.map((ts: any) => (
                  <tr key={ts.id}>
                    <td className="table-cell">{new Date(ts.date).toLocaleDateString('ar-SA')}</td>
                    <td className="table-cell font-medium">{ts.project?.name}</td>
                    <td className="table-cell">{Number(ts.hours)}</td>
                    <td className="table-cell">{ts.billable ? <span className="badge-success">نعم</span> : <span className="badge-warning">لا</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="مشروع جديد">
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم المشروع *</label>
            <input required className="input" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الوصف</label>
            <textarea className="input" rows={2} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">تاريخ البدء</label><input type="date" className="input" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">تاريخ الانتهاء المتوقع</label><input type="date" className="input" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التكلفة التقديرية</label>
            <input type="number" min={0} step="0.01" className="input" value={projectForm.estimatedCost} onChange={(e) => setProjectForm({ ...projectForm, estimatedCost: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsProjectModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={projectSaving} className="btn-primary">{projectSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="مهمة جديدة">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">المشروع *</label>
            <select required className="input" value={taskForm.projectId} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}>
              <option value="">اختر مشروع</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">عنوان المهمة *</label>
            <input required className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ الاستحقاق</label>
            <input type="date" className="input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsTaskModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={taskSaving} className="btn-primary">{taskSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTsModalOpen} onClose={() => setIsTsModalOpen(false)} title="تسجيل وقت">
        <form onSubmit={handleTsSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الموظف *</label>
            <select required className="input" value={tsForm.employeeId} onChange={(e) => setTsForm({ ...tsForm, employeeId: e.target.value })}>
              <option value="">اختر موظف</option>
              {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">المشروع *</label>
            <select required className="input" value={tsForm.projectId} onChange={(e) => setTsForm({ ...tsForm, projectId: e.target.value })}>
              <option value="">اختر مشروع</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">التاريخ</label><input type="date" className="input" value={tsForm.date} onChange={(e) => setTsForm({ ...tsForm, date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">عدد الساعات</label><input type="number" min={0.5} max={24} step="0.5" className="input" value={tsForm.hours} onChange={(e) => setTsForm({ ...tsForm, hours: Number(e.target.value) })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsTsModalOpen(false)}>إلغاء</button>
            <button type="submit" disabled={tsSaving} className="btn-primary">{tsSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
