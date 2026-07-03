import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stockEntryApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { StockEntry } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useStockEntries = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['stock-entries', companyId],
    queryFn: () => stockEntryApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['stock-entries', companyId] });
    queryClient.invalidateQueries({ queryKey: ['stock-levels', companyId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => stockEntryApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء حركة المخزون'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إنشاء الحركة')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => stockEntryApi.submit(id),
    onSuccess: () => { toast.success('تم اعتماد الحركة وتحديث المخزون'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الاعتماد')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => stockEntryApi.cancel(id),
    onSuccess: () => { toast.success('تم إلغاء الحركة'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإلغاء')),
  });

  return {
    stockEntries: (data?.data as StockEntry[]) || [],
    isLoading,
    createStockEntry: createMutation.mutateAsync,
    submitStockEntry: submitMutation.mutateAsync,
    cancelStockEntry: cancelMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
