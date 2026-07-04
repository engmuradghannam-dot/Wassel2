import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useReport = (type: 'trialBalance' | 'profitAndLoss' | 'balanceSheet' | 'stock' | 'sales' | 'payroll') => {
  const { selectedCompany } = useAuthStore();
  const companyId = selectedCompany?.id;

  const fetchers: Record<string, (params?: any) => Promise<any>> = {
    trialBalance: reportApi.trialBalance,
    profitAndLoss: reportApi.profitAndLoss,
    balanceSheet: reportApi.balanceSheet,
    stock: reportApi.stock,
    sales: reportApi.sales,
    payroll: reportApi.payroll,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['report', type, companyId],
    queryFn: () => fetchers[type]({ companyId }),
    enabled: !!companyId,
  });

  return { data: data?.data as any, isLoading, error };
};
