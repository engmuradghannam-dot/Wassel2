import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

function extractError(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export const useSettings = () => {
  const { selectedCompany } = useAuthStore();
  const queryClient = useQueryClient();
  const companyId = selectedCompany?.id;

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', companyId],
    queryFn: () => settingsApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  const { data: companySettings } = useQuery({
    queryKey: ['companySettings', companyId],
    queryFn: () => settingsApi.getCompany(),
    enabled: !!companyId,
  });

  const updateSettings = useMutation({
    mutationFn: (payload: any) => settingsApi.update(payload),
    onSuccess: () => {
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['settings', companyId] });
    },
    onError: (error) => toast.error(extractError(error, 'Failed to update settings')),
  });

  const updateCompanySettings = useMutation({
    mutationFn: (payload: any) => settingsApi.updateCompany(payload),
    onSuccess: () => {
      toast.success('Company settings updated');
      queryClient.invalidateQueries({ queryKey: ['companySettings', companyId] });
    },
    onError: (error) => toast.error(extractError(error, 'Failed to update company settings')),
  });

  return {
    settings: settings?.data || {},
    companySettings: companySettings?.data,
    isLoading,
    updateSettings: updateSettings.mutateAsync,
    updateCompanySettings: updateCompanySettings.mutateAsync,
  };
};
