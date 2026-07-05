import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useBranches } from '../../hooks/useBranches';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../../components/common/Modal';

const emptyForm = {
  name: '',
  nameAr: '',
  code: '',
  address: '',
  city: '',
  state: '',
  country: 'SA',
  phone: '',
  email: '',
};

export const BranchesPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const { branches, isLoading, createBranch, updateBranch, deleteBranch, isSaving } = useBranches();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (branch: any) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      nameAr: branch.nameAr || '',
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || 'SA',
      phone: branch.phone || '',
      email: branch.email || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateBranch({ id: editingId, payload: form });
    } else {
      await createBranch(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (branch: any) => {
    if (confirm(t('branches.confirmDelete', { name: branch.name }))) {
      await deleteBranch(branch.id);
    }
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <BuildingOfficeIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">{t('branches.selectCompany')}</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">{t('branches.title')}</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          {t('branches.add')}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('branches.code')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('branches.name')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('branches.city')}</th>
                <th className="px-4 py-3 text-start text-xs font-medium text-secondary-500 uppercase">{t('branches.phone')}</th>
                <th className="px-4 py-3 text-end text-xs font-medium text-secondary-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {branches.map((branch: any) => (
                <tr key={branch.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-secondary-900">{branch.code}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700">
                    <div>{branch.name}</div>
                    {branch.nameAr && <div className="text-xs text-secondary-400" dir="rtl">{branch.nameAr}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-600">{branch.city}</td>
                  <td className="px-4 py-3 text-sm text-secondary-600">{branch.phone}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(branch)} className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(branch)} className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? t('branches.edit') : t('branches.add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('branches.name')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" required />
            </div>
            <div>
              <label className="form-label">{t('branches.nameAr')}</label>
              <input type="text" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="form-input" dir="rtl" />
            </div>
            <div>
              <label className="form-label">{t('branches.code')}</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="form-input" placeholder="BR-XXXX" />
            </div>
            <div>
              <label className="form-label">{t('branches.phone')}</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">{t('branches.email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">{t('branches.city')}</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="form-input" />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">{t('branches.address')}</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
