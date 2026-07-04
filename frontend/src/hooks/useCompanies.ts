import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { companyApi } from '../services/api';
import { Company } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useCompanies = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['companies-full'],
    queryFn: () => companyApi.getAll(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['companies-full'] });
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Company>) => companyApi.create(payload),
    onSuccess: () => { toast.success('تم إنشاء الشركة بنجاح'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إنشاء الشركة')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Company> }) => companyApi.update(id, payload),
    onSuccess: () => { toast.success('تم تحديث بيانات الشركة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyApi.delete(id),
    onSuccess: () => { toast.success('تم إلغاء تفعيل الشركة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الحذف')),
  });

  return {
    companies: ((data as any)?.data as any[]) || [],
    isLoading,
    createCompany: createMutation.mutateAsync,
    updateCompany: updateMutation.mutateAsync,
    deleteCompany: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
