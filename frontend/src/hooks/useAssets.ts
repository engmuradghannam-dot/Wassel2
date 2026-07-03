// MuradERP Assets Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { assetApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Asset } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useAssets = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['assets', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Asset>) => assetApi.create(payload, companyId),
    onSuccess: () => {
      toast.success('تم إضافة الأصل بنجاح');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة الأصل')),
  });

  const depreciateMutation = useMutation({
    mutationFn: (id: string) => assetApi.depreciate(id),
    onSuccess: () => {
      toast.success('تم تطبيق الإهلاك');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر تطبيق الإهلاك')),
  });

  const disposeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetApi.dispose(id, data),
    onSuccess: () => {
      toast.success('تم استبعاد الأصل');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر الاستبعاد')),
  });

  return {
    assets: (data?.data as Asset[]) || [],
    isLoading,
    createAsset: createMutation.mutateAsync,
    depreciateAsset: depreciateMutation.mutateAsync,
    disposeAsset: disposeMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
