// MuradERP Auth Hook
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout, selectedCompany } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials.email, credentials.password),
    onSuccess: (response: any) => {
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        storeLogin(user, token, refreshToken);
        localStorage.setItem('murad_erp_token', token);
        localStorage.setItem('murad_erp_refresh_token', refreshToken);
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في تسجيل الدخول');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response: any) => {
      if (response.success) {
        toast.success('تم إنشاء الحساب بنجاح');
        navigate('/login');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطأ في إنشاء الحساب');
    },
  });

  const logout = () => {
    localStorage.removeItem('murad_erp_token');
    localStorage.removeItem('murad_erp_refresh_token');
    storeLogout();
    queryClient.clear();
    toast.success('تم تسجيل الخروج');
    navigate('/login');
  };

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
  });

  return {
    user,
    isAuthenticated,
    selectedCompany,
    profile,
    profileLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
};
