import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useUsers = () => {
  const { selectedCompany } = useAuthStore();
  const companyId = selectedCompany?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => userApi.getAll({ companyId }),
    enabled: !!companyId,
  });

  return {
    users: (data as any)?.data || [],
    isLoading,
  };
};
