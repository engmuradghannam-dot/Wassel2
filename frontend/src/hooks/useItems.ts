// MuradERP Items Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { itemApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Item } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useItems = (search?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', companyId, search],
    queryFn: () => itemApi.getAll({ companyId, search }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['items', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Item>) => itemApi.create(payload, companyId),
    onSuccess: () => {
      toast.success('تم إضافة المنتج بنجاح');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة المنتج')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Item> }) =>
      itemApi.update(id, payload),
    onSuccess: () => {
      toast.success('تم تحديث بيانات المنتج');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر تحديث المنتج')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemApi.delete(id),
    onSuccess: () => {
      toast.success('تم حذف المنتج');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر حذف المنتج')),
  });

  return {
    items: (data?.data as Item[]) || [],
    isLoading,
    error,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};
