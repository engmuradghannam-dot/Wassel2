import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { iotDeviceApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useIoTDevices = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['iotDevices', companyId],
    queryFn: () => iotDeviceApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['iotDevices', companyId] });

  const registerDevice = useMutation({
    mutationFn: (payload: any) => iotDeviceApi.create(payload),
    onSuccess: () => { toast.success('Device registered'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to register device')),
  });

  const deleteDevice = useMutation({
    mutationFn: (id: string) => iotDeviceApi.delete(id),
    onSuccess: () => { toast.success('Device removed'); invalidate(); },
    onError: (e) => toast.error(extractError(e, 'Failed to remove device')),
  });

  return {
    devices: data?.data || [],
    isLoading,
    registerDevice: registerDevice.mutateAsync,
    deleteDevice: deleteDevice.mutateAsync,
  };
};
