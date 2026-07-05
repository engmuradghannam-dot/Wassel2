import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { batchApi, serialNumberApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useBatches = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['batches', companyId],
    queryFn: () => batchApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['batches', companyId] });

  const createBatch = useMutation({
    mutationFn: (payload: any) => batchApi.create(payload),
    onSuccess: () => { toast.success('Batch created'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to create batch')),
  });

  const deleteBatch = useMutation({
    mutationFn: (id: string) => batchApi.delete(id),
    onSuccess: () => { toast.success('Batch deleted'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to delete batch')),
  });

  return {
    batches: data?.data || [],
    isLoading,
    createBatch: createBatch.mutateAsync,
    deleteBatch: deleteBatch.mutateAsync,
  };
};

export const useSerialNumbers = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['serialNumbers', companyId],
    queryFn: () => serialNumberApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['serialNumbers', companyId] });

  const bulkCreate = useMutation({
    mutationFn: (payload: any) => serialNumberApi.bulkCreate(payload),
    onSuccess: (res: any) => { toast.success(res.message || 'Serial numbers registered'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to register serial numbers')),
  });

  const deleteSerial = useMutation({
    mutationFn: (id: string) => serialNumberApi.delete(id),
    onSuccess: () => { toast.success('Serial number deleted'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to delete serial number')),
  });

  return {
    serialNumbers: data?.data || [],
    isLoading,
    bulkCreate: bulkCreate.mutateAsync,
    deleteSerial: deleteSerial.mutateAsync,
  };
};
