import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { approvalApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useApprovals = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows', companyId],
    queryFn: () => approvalApi.getWorkflows({ companyId }),
    enabled: !!companyId,
  });

  const { data: pending } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: () => approvalApi.getPending(),
  });

  const createWorkflow = useMutation({
    mutationFn: (payload: any) => approvalApi.createWorkflow(payload, companyId),
    onSuccess: () => {
      toast.success('Workflow created');
      queryClient.invalidateQueries({ queryKey: ['workflows', companyId] });
    },
    onError: (error) => toast.error(extractError(error, 'Failed to create workflow')),
  });

  const processApproval = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => approvalApi.processApproval(id, data),
    onSuccess: () => {
      toast.success('Approval processed');
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
    onError: (error) => toast.error(extractError(error, 'Failed to process approval')),
  });

  return {
    workflows: workflows?.data || [],
    pending: pending?.data || [],
    isLoading,
    createWorkflow: createWorkflow.mutateAsync,
    processApproval: processApproval.mutateAsync,
  };
};
