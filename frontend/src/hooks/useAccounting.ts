import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { accountApi, journalEntryApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { GLAccount, JournalEntry } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useAccounts = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', companyId],
    queryFn: () => accountApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<GLAccount>) => accountApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إضافة الحساب'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إضافة الحساب')),
  });

  return {
    accounts: (data?.data as GLAccount[]) || [],
    isLoading,
    createAccount: createMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};

export const useJournalEntries = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['journal-entries', companyId],
    queryFn: () => journalEntryApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['journal-entries', companyId] });
    queryClient.invalidateQueries({ queryKey: ['accounts', companyId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => journalEntryApi.create(payload, companyId),
    onSuccess: () => { toast.success('تم إنشاء القيد'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر إنشاء القيد')),
  });

  const postMutation = useMutation({
    mutationFn: (id: string) => journalEntryApi.post(id),
    onSuccess: () => { toast.success('تم ترحيل القيد'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الترحيل')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => journalEntryApi.cancel(id),
    onSuccess: () => { toast.success('تم إلغاء القيد'); invalidate(); },
    onError: (error) => toast.error(extractError(error, 'تعذر الإلغاء')),
  });

  return {
    journalEntries: (data?.data as JournalEntry[]) || [],
    isLoading,
    createJournalEntry: createMutation.mutateAsync,
    postJournalEntry: postMutation.mutateAsync,
    cancelJournalEntry: cancelMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
