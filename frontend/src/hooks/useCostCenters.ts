import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { costCenterApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useCostCenters = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['costCenters', companyId],
    queryFn: () => costCenterApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['costCenters', companyId] });

  const createCostCenter = useMutation({
    mutationFn: (payload: any) => costCenterApi.create(payload),
    onSuccess: () => { toast.success('Cost center created'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to create cost center')),
  });

  const deleteCostCenter = useMutation({
    mutationFn: (id: string) => costCenterApi.delete(id),
    onSuccess: () => { toast.success('Cost center deleted'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to delete cost center')),
  });

  return {
    costCenters: data?.data || [],
    isLoading,
    createCostCenter: createCostCenter.mutateAsync,
    deleteCostCenter: deleteCostCenter.mutateAsync,
  };
};
