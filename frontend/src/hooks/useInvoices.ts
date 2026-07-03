// MuradERP Invoices Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { invoiceApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Invoice } from '../types';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useInvoices = (filters?: { type?: string; status?: string }) => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', companyId, filters],
    queryFn: () => invoiceApi.getAll({ companyId, ...filters }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });

  const createMutation = useMutation({
    mutationFn: (payload: any) => invoiceApi.create(payload, companyId),
    onSuccess: () => {
      toast.success('تم إنشاء الفاتورة بنجاح');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إنشاء الفاتورة')),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.submit(id),
    onSuccess: () => {
      toast.success('تم اعتماد الفاتورة');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر اعتماد الفاتورة')),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.cancel(id),
    onSuccess: () => {
      toast.success('تم إلغاء الفاتورة');
      invalidate();
    },
    onError: (error) => toast.error(extractError(error, 'تعذر إلغاء الفاتورة')),
  });

  return {
    invoices: (data?.data as Invoice[]) || [],
    isLoading,
    error,
    createInvoice: createMutation.mutateAsync,
    submitInvoice: submitMutation.mutateAsync,
    cancelInvoice: cancelMutation.mutateAsync,
    isSaving: createMutation.isPending,
  };
};
