// MuradERP Auth Store
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Company } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedCompany: Company | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setSelectedCompany: (company: Company | null) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      selectedCompany: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setSelectedCompany: (selectedCompany) => set({ selectedCompany }),

      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          selectedCompany: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'murad-erp-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        selectedCompany: state.selectedCompany,
      }),
    }
  )
);
