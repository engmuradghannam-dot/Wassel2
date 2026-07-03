// MuradERP Customers Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Customer } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useCustomers = (search?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', companyId, search],
    queryFn: () => customerApi.getAll({ companyId, search }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['customers', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Customer>) => customerApi.create(payload, companyId),
    onSuccess: () => {
      toast.success('تم إضافة العميل بنجاح');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة العميل')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Customer> }) =>
      customerApi.update(id, payload),
    onSuccess: () => {
      toast.success('تم تحديث بيانات العميل');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر تحديث العميل')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      toast.success('تم حذف العميل');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر حذف العميل')),
  });

  return {
    customers: (data?.data as Customer[]) || [],
    isLoading,
    error,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};
