import { useState } from 'react';
import { useIndustry } from '../../hooks/useIndustry';
import { Modal } from '../../components/common/Modal';
import {
  BriefcaseIcon,
  PlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FlagIcon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export const PMOPage = () => {
  const {
    pmoProjects,
    pmoProjectsLoading,
    createPMOProject,
    deletePMOProject,
    isCreating,
  } = useIndustry();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    projectCode: '',
    name: '',
    description: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    budget: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPMOProject({
      ...form,
      budget: form.budget ? Number(form.budget) : undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setForm({ projectCode: '', name: '', description: '', priority: 'MEDIUM', status: 'DRAFT', budget: '', startDate: '', endDate: '' });
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success-100 text-success-700';
      case 'COMPLETED': return 'bg-primary-100 text-primary-700';
      case 'ON_HOLD': return 'bg-warning-100 text-warning-700';
      case 'CANCELLED': return 'bg-danger-100 text-danger-700';
      default: return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-danger-600';
      case 'HIGH': return 'text-warning-600';
      case 'MEDIUM': return 'text-primary-600';
      default: return 'text-secondary-500';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BriefcaseIcon className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold">إدارة المشاريع (PMO)</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <PlusIcon className="h-5 w-5 ml-1" />
          مشروع جديد
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{pmoProjects.length}</p>
          <p className="text-sm text-secondary-500">إجمالي المشاريع</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-success-600">
            {pmoProjects.filter((p: any) => p.status === 'ACTIVE').length}
          </p>
          <p className="text-sm text-secondary-500">نشطة</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-warning-600">
            {pmoProjects.filter((p: any) => p.status === 'ON_HOLD').length}
          </p>
          <p className="text-sm text-secondary-500">معلقة</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">
            {pmoProjects.reduce((sum: number, p: any) => sum + (p._count?.risks || 0), 0)}
          </p>
          <p className="text-sm text-secondary-500">المخاطر</p>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {pmoProjectsLoading ? (
          <div className="card text-center py-8 text-secondary-500">جاري التحميل...</div>
        ) : pmoProjects.length === 0 ? (
          <div className="card text-center py-12 text-secondary-500">
            <BriefcaseIcon className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
            <p>لا توجد مشاريع</p>
            <button onClick={() => setIsModalOpen(true)} className="text-primary-600 mt-2 text-sm">
              إنشاء أول مشروع
            </button>
          </div>
        ) : (
          pmoProjects.map((project: any) => (
            <div key={project.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{project.name}</h3>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <FlagIcon className={`h-4 w-4 ${getPriorityColor(project.priority)}`} />
                  </div>
                  <p className="text-sm text-secondary-600 mb-3">{project.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-secondary-500">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      {project._count?.stakeholders || 0} أصحاب مصلحة
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      {project._count?.milestones || 0} معالم
                    </span>
                    <span className="flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      {project._count?.risks || 0} مخاطر
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {project._count?.issues || 0} مشاكل
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>التقدم</span>
                      <span>{project.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mr-4">
                  <button
                    onClick={() => {
                      if (confirm('متأكد تبي تحذف المشروع؟')) {
                        deletePMOProject(project.id);
                      }
                    }}
                    className="text-danger-500 hover:text-danger-700 p-2"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="مشروع جديد">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">كود المشروع *</label>
              <input
                required
                className="input"
                value={form.projectCode}
                onChange={(e) => setForm({ ...form, projectCode: e.target.value })}
                placeholder="PMO-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم المشروع *</label>
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الوصف</label>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الأولوية</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">منخفضة</option>
                <option value="MEDIUM">متوسطة</option>
                <option value="HIGH">عالية</option>
                <option value="CRITICAL">حرجة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الحالة</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="DRAFT">مسودة</option>
                <option value="ACTIVE">نشط</option>
                <option value="ON_HOLD">معلق</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الميزانية</label>
            <input
              type="number"
              className="input"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="500000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ البدء</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الانتهاء</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={isCreating}>
              {isCreating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
