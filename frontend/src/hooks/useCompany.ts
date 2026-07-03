// MuradERP Company Hook
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { companyApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useCompany = () => {
  const queryClient = useQueryClient();
  const { selectedCompany, setSelectedCompany } = useAuthStore();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => companyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('تم إنشاء الشركة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في إنشاء الشركة');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => companyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('تم تحديث الشركة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في تحديث الشركة');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('تم حذف الشركة بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في حذف الشركة');
    },
  });

  return {
    companies: companies?.data || [],
    selectedCompany,
    isLoading,
    setSelectedCompany,
    createCompany: createMutation.mutate,
    updateCompany: updateMutation.mutate,
    deleteCompany: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
