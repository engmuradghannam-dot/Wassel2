import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { mrpApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useMRP = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['mrpRuns', companyId],
    queryFn: () => mrpApi.getRuns({ companyId }),
    enabled: !!companyId,
  });

  const runMRP = useMutation({
    mutationFn: (payload: any) => mrpApi.run(payload, companyId),
    onSuccess: () => {
      toast.success('MRP run completed');
      queryClient.invalidateQueries({ queryKey: ['mrpRuns', companyId] });
    },
    onError: (e) => toast.error(extractError(e, 'MRP run failed')),
  });

  const convertPlannedOrder = useMutation({
    mutationFn: ({ id, supplierId }: { id: string; supplierId: string }) =>
      mrpApi.convertPlannedOrder(id, { supplierId }),
    onSuccess: () => {
      toast.success('Converted to purchase order');
      queryClient.invalidateQueries({ queryKey: ['mrpRuns', companyId] });
    },
    onError: (e) => toast.error(extractError(e, 'Failed to convert planned order')),
  });

  return {
    runs: data?.data || [],
    isLoading,
    runMRP: runMRP.mutateAsync,
    isRunning: runMRP.isPending,
    convertPlannedOrder: convertPlannedOrder.mutateAsync,
  };
};

export const useMRPRun = (id?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['mrpRun', id],
    queryFn: () => mrpApi.getRun(id!),
    enabled: !!id,
  });
  return { run: data?.data, isLoading };
};
