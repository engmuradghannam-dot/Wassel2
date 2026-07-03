// MuradERP Dashboard Hook
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const useDashboard = () => {
  const { selectedCompany } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats', selectedCompany?.id],
    queryFn: () => dashboardApi.getStats(selectedCompany?.id),
    enabled: !!selectedCompany,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: () => dashboardApi.getNotifications(),
  });

  return {
    stats: stats?.data,
    notifications: notifications?.data || [],
    statsLoading,
    notificationsLoading,
  };
};
