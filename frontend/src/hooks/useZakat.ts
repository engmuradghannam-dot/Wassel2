import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { zakatApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useZakat = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data: history, isLoading } = useQuery({
    queryKey: ['zakatHistory', companyId],
    queryFn: () => zakatApi.getHistory({ companyId }),
    enabled: !!companyId,
  });

  const calculate = useMutation({
    mutationFn: (payload: any) => zakatApi.calculate(payload, companyId),
    onSuccess: () => {
      toast.success('Zakat calculated successfully');
      queryClient.invalidateQueries({ queryKey: ['zakatHistory', companyId] });
    },
    onError: (error) => toast.error(extractError(error, 'Failed to calculate zakat')),
  });

  return {
    history: history?.data || [],
    isLoading,
    calculateZakat: calculate.mutateAsync,
  };
};
