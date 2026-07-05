import { useQuery } from '@tanstack/react-query';
import { activityLogApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useActivityLogs = (params?: any) => {
  const { selectedCompany } = useAuthStore();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['activityLogs', companyId, params],
    queryFn: () => activityLogApi.getAll({ companyId, ...params }),
    enabled: !!companyId,
  });

  return {
    logs: data?.data || [],
    meta: data?.meta,
    isLoading,
  };
};
