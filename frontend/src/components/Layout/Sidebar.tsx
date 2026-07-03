// MuradERP Sidebar Component
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useState } from 'react';
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
  ChevronDownIcon,
  PhoneArrowUpRightIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../hooks/useAuth';

interface LeafItem {
  key: string;
  labelKey: string;
  href: string;
  icon: React.ElementType;
}

interface GroupItem {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  children: LeafItem[];
}

type NavEntry = LeafItem | GroupItem;

const isGroup = (entry: NavEntry): entry is GroupItem => 'children' in entry;

const navigation: NavEntry[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', href: '/dashboard', icon: HomeIcon },
  { key: 'companies', labelKey: 'nav.companies', href: '/companies', icon: BuildingOfficeIcon },
  {
    key: 'salesGroup',
    labelKey: 'nav.sales',
    icon: BanknotesIcon,
    children: [
      { key: 'crm', labelKey: 'nav.crm', href: '/crm', icon: PhoneArrowUpRightIcon },
      { key: 'customers', labelKey: 'nav.customers', href: '/customers', icon: UsersIcon },
      { key: 'invoices', labelKey: 'nav.invoices', href: '/invoices', icon: DocumentTextIcon },
    ],
  },
  {
    key: 'purchasingGroup',
    labelKey: 'nav.purchasing',
    icon: TruckIcon,
    children: [
      { key: 'suppliers', labelKey: 'nav.suppliers', href: '/suppliers', icon: TruckIcon },
    ],
  },
  {
    key: 'inventoryGroup',
    labelKey: 'nav.inventoryGroup',
    icon: CubeIcon,
    children: [
      { key: 'items', labelKey: 'nav.items', href: '/items', icon: CubeIcon },
      { key: 'inventory', labelKey: 'nav.inventory', href: '/inventory', icon: ShoppingCartIcon },
      { key: 'assets', labelKey: 'nav.assets', href: '/assets', icon: ArchiveBoxIcon },
    ],
  },
  {
    key: 'hrGroup',
    labelKey: 'nav.hr',
    icon: UsersIcon,
    children: [
      { key: 'employees', labelKey: 'nav.employees', href: '/employees', icon: UsersIcon },
    ],
  },
  { key: 'reports', labelKey: 'nav.reports', href: '/reports', icon: ChartBarIcon },
  { key: 'settings', labelKey: 'nav.settings', href: '/settings', icon: CogIcon },
];

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { logout } = useAuth();
  const { t } = useTranslation();

  // Auto-expand whichever group contains the current route.
  const initiallyOpen = navigation
    .filter(isGroup)
    .filter((g) => g.children.some((c) => location.pathname.startsWith(c.href)))
    .map((g) => g.key);
  const [openGroups, setOpenGroups] = useState<string[]>(initiallyOpen);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

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
        {navigation.map((entry) => {
          if (!isGroup(entry)) {
            const isActive = location.pathname.startsWith(entry.href);
            return (
              <NavLink
                key={entry.key}
                to={entry.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                title={!sidebarOpen ? t(entry.labelKey) : undefined}
              >
                <entry.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
                {sidebarOpen && <span className="mr-3 animate-fade-in">{t(entry.labelKey)}</span>}
              </NavLink>
            );
          }

          const groupHasActiveChild = entry.children.some((c) => location.pathname.startsWith(c.href));
          const isOpen = openGroups.includes(entry.key) || groupHasActiveChild;

          return (
            <div key={entry.key}>
              <button
                type="button"
                onClick={() => toggleGroup(entry.key)}
                className={`sidebar-link w-full ${groupHasActiveChild ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                title={!sidebarOpen ? t(entry.labelKey) : undefined}
              >
                <entry.icon className={`w-5 h-5 flex-shrink-0 ${groupHasActiveChild ? 'text-primary-600' : 'text-secondary-400'}`} />
                {sidebarOpen && (
                  <>
                    <span className="mr-3 flex-1 text-right animate-fade-in">{t(entry.labelKey)}</span>
                    <ChevronDownIcon
                      className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>

              {/* Flyout / expanded sub-items */}
              {isOpen && sidebarOpen && (
                <div className="mr-6 mt-1 space-y-1 border-r border-secondary-200 pr-3 animate-fade-in">
                  {entry.children.map((child) => {
                    const isActive = location.pathname.startsWith(child.href);
                    return (
                      <NavLink
                        key={child.key}
                        to={child.href}
                        className={`sidebar-link text-sm ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        <child.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
                        <span className="mr-2">{t(child.labelKey)}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* Collapsed sidebar: show children as simple stacked icons (no flyout popover, kept simple) */}
              {!sidebarOpen && (
                <div className="space-y-1 mt-1">
                  {entry.children.map((child) => {
                    const isActive = location.pathname.startsWith(child.href);
                    return (
                      <NavLink
                        key={child.key}
                        to={child.href}
                        className={`sidebar-link justify-center ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                        title={t(child.labelKey)}
                      >
                        <child.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
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
