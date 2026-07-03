import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { purchaseOrderApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PurchaseOrder } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const usePurchaseOrders = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', companyId],
    queryFn: () => purchaseOrderApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchase-orders', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => purchaseOrderApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء أمر الشراء'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إنشاء أمر الشراء')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderApi.submit(id),
    onSuccess: () => { toast.success('تم اعتماد أمر الشراء'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الاعتماد')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchaseOrderApi.cancel(id),
    onSuccess: () => { toast.success('تم إلغاء أمر الشراء'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإلغاء')),
  });

  return {
    purchaseOrders: (data?.data as PurchaseOrder[]) || [],
    isLoading,
    createPurchaseOrder: createMutation.mutateAsync,
    submitPurchaseOrder: submitMutation.mutateAsync,
    cancelPurchaseOrder: cancelMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
