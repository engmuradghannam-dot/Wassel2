import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { salesForecastApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useSalesForecast = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['salesForecasts', companyId],
    queryFn: () => salesForecastApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const generate = useMutation({
    mutationFn: (payload: any) => salesForecastApi.generate(payload, companyId),
    onSuccess: () => {
      toast.success('Forecast generated');
      queryClient.invalidateQueries({ queryKey: ['salesForecasts', companyId] });
    },
    onError: (e) => toast.error(extractError(e, 'Failed to generate forecast')),
  });

  return {
    forecasts: data?.data || [],
    isLoading,
    generateForecast: generate.mutateAsync,
    isGenerating: generate.isPending,
  };
};
