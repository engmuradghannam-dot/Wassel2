import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { branchApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useBranches = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => branchApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['branches', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => branchApi.create(payload, companyId),
    onSuccess: () => { toast.success('Branch created'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'Failed to create branch')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => branchApi.update(id, payload),
    onSuccess: () => { toast.success('Branch updated'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'Failed to update branch')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchApi.delete(id),
    onSuccess: () => { toast.success('Branch deleted'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'Failed to delete branch')),
  });

  return {
    branches: data?.data || [],
    isLoading,
    createBranch: createMutation.mutateAsync,
    updateBranch: updateMutation.mutateAsync,
    deleteBranch: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};
