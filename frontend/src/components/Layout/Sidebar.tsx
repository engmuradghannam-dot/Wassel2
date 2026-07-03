// MuradERP Sidebar Component
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ShoppingCartIcon,
  TruckIcon,
  CubeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneArrowUpRightIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  key: string;
  labelKey: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navigation: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', href: '/dashboard', icon: HomeIcon },
  { key: 'companies', labelKey: 'nav.companies', href: '/companies', icon: BuildingOfficeIcon },
  { key: 'crm', labelKey: 'nav.crm', href: '/crm', icon: PhoneArrowUpRightIcon },
  { key: 'customers', labelKey: 'nav.customers', href: '/customers', icon: UsersIcon },
  { key: 'suppliers', labelKey: 'nav.suppliers', href: '/suppliers', icon: TruckIcon },
  { key: 'items', labelKey: 'nav.items', href: '/items', icon: CubeIcon },
  { key: 'invoices', labelKey: 'nav.invoices', href: '/invoices', icon: DocumentTextIcon },
  { key: 'inventory', labelKey: 'nav.inventory', href: '/inventory', icon: ShoppingCartIcon },
  { key: 'assets', labelKey: 'nav.assets', href: '/assets', icon: ArchiveBoxIcon },
  { key: 'employees', labelKey: 'nav.employees', href: '/employees', icon: UsersIcon },
  { key: 'reports', labelKey: 'nav.reports', href: '/reports', icon: ChartBarIcon },
  { key: 'settings', labelKey: 'nav.settings', href: '/settings', icon: CogIcon },
];

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <aside
      className={`fixed top-0 right-0 z-40 h-screen bg-white border-l border-secondary-200 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">م</span>
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-secondary-900">{t('app.name')}</h1>
              <p className="text-xs text-secondary-500">{t('app.tagline')}</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-500 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.key}
              to={item.href}
              className={`sidebar-link ${
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
              }`}
              title={!sidebarOpen ? t(item.labelKey) : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
              {sidebarOpen && (
                <span className="mr-3 animate-fade-in">{t(item.labelKey)}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 right-0 left-0 p-3 border-t border-secondary-200 bg-white">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
          title={!sidebarOpen ? t('common.logout') : undefined}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="mr-3 animate-fade-in">{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};
