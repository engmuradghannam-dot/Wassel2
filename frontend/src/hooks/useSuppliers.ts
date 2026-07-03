// MuradERP Suppliers Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supplierApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Supplier } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useSuppliers = (search?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', companyId, search],
    queryFn: () => supplierApi.getAll({ companyId, search }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Supplier>) => supplierApi.create(payload, companyId),
    onSuccess: () => {
      toast.success('تم إضافة المورد بنجاح');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة المورد')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Supplier> }) =>
      supplierApi.update(id, payload),
    onSuccess: () => {
      toast.success('تم تحديث بيانات المورد');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر تحديث المورد')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.delete(id),
    onSuccess: () => {
      toast.success('تم حذف المورد');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر حذف المورد')),
  });

  return {
    suppliers: (data?.data as Supplier[]) || [],
    isLoading,
    error,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};
