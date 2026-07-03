// MuradERP CRM Hook (Leads + Opportunities)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { crmApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Lead, Opportunity } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useLeads = (status?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['leads', companyId, status],
    queryFn: () => crmApi.getLeads({ companyId, status }),
    enabled: !!companyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['leads', companyId] });
    queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Lead>) => crmApi.createLead(payload, companyId),
    onSuccess: () => {
      toast.success('تم إضافة العميل المحتمل');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة العميل المحتمل')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => crmApi.updateLeadStatus(id, status),
    onSuccess: () => {
      toast.success('تم تحديث حالة العميل المحتمل');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => crmApi.convertLead(id, companyId),
    onSuccess: () => {
      toast.success('تم تحويله لعميل بنجاح');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر التحويل')),
  });

  return {
    leads: (data?.data as Lead[]) || [],
    isLoading,
    createLead: createMutation.mutateAsync,
    updateLeadStatus: updateStatusMutation.mutateAsync,
    convertLead: convertMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};

export const useOpportunities = (stage?: string) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', companyId, stage],
    queryFn: () => crmApi.getOpportunities({ companyId, stage }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['opportunities', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Opportunity>) => crmApi.createOpportunity(payload, companyId),
    onSuccess: () => {
      toast.success('تمت إضافة الفرصة البيعية');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة الفرصة')),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, actualAmount }: { id: string; stage: string; actualAmount?: number }) =>
      crmApi.updateOpportunityStage(id, stage, actualAmount),
    onSuccess: () => {
      toast.success('تم تحديث مرحلة الفرصة');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر التحديث')),
  });

  return {
    opportunities: (data?.data as Opportunity[]) || [],
    isLoading,
    createOpportunity: createMutation.mutateAsync,
    updateOpportunityStage: updateStageMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
