// MuradERP UI Store
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  language: 'ar' | 'en';
  notifications: any[];
  unreadCount: number;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  setNotifications: (notifications: any[]) => void;
  addNotification: (notification: any) => void;
  markNotificationRead: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  darkMode: false,
  language: 'ar',
  notifications: [],
  unreadCount: 0,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setLanguage: (language) => set({ language }),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
