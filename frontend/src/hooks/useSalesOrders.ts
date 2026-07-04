import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { salesOrderApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { SalesOrder } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useSalesOrders = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['sales-orders', companyId],
    queryFn: () => salesOrderApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sales-orders', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => salesOrderApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء أمر البيع'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إنشاء أمر البيع')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.submit(id),
    onSuccess: () => { toast.success('تم اعتماد أمر البيع'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الاعتماد')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.cancel(id),
    onSuccess: () => { toast.success('تم إلغاء أمر البيع'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإلغاء')),
  });

  return {
    salesOrders: (data?.data as SalesOrder[]) || [],
    isLoading,
    createSalesOrder: createMutation.mutateAsync,
    submitSalesOrder: submitMutation.mutateAsync,
    cancelSalesOrder: cancelMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
