import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { manufacturingApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useBOMs = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['boms', companyId],
    queryFn: () => manufacturingApi.getBOMs({ companyId }),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => manufacturingApi.createBOM(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء قائمة المواد'); queryClient.invalidateQueries({ queryKey: ['boms', companyId] }); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإنشاء')),
  });

  return { boms: (data?.data as any[]) || [], isLoading, createBOM: createMutation.mutateAsync, isSaving: createMutation.isPending };
};

export const useWorkOrders = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', companyId],
    queryFn: () => manufacturingApi.getWorkOrders({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['work-orders', companyId] });
    queryClient.invalidateQueries({ queryKey: ['stock-levels', companyId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => manufacturingApi.createWorkOrder(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء أمر الإنتاج'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإنشاء')),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => manufacturingApi.completeWorkOrder(id),
    onSuccess: () => { toast.success('تم إكمال الإنتاج وتحديث المخزون'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإكمال')),
  });

  return {
    workOrders: (data?.data as any[]) || [], isLoading,
    createWorkOrder: createMutation.mutateAsync, completeWorkOrder: completeMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
