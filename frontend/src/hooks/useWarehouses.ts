import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { warehouseApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Warehouse } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useWarehouses = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', companyId],
    queryFn: () => warehouseApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['warehouses', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Warehouse>) => warehouseApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إضافة المستودع'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة المستودع')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehouseApi.delete(id),
    onSuccess: () => { toast.success('تم حذف المستودع'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الحذف')),
  });

  return {
    warehouses: (data?.data as Warehouse[]) || [],
    isLoading,
    createWarehouse: createMutation.mutateAsync,
    deleteWarehouse: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};

export const useStockLevels = (warehouseId?: string) => {
  const { selectedCompany } = useAuthStore();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['stock-levels', companyId, warehouseId],
    queryFn: () => warehouseApi.getStockLevels({ companyId, warehouseId }),
    enabled: !!companyId,
  });

  return { stockLevels: (data?.data as any[]) || [], isLoading };
};
