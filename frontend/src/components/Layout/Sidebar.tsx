// MuradERP Sidebar Component
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useState, useRef, useEffect } from 'react';
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
  BanknotesIcon,
  CalculatorIcon,
  CreditCardIcon,
  InboxArrowDownIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  BriefcaseIcon,
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
    key: 'accountingGroup',
    labelKey: 'nav.accountingGroup',
    icon: CalculatorIcon,
    children: [
      { key: 'accounting', labelKey: 'nav.chartOfAccounts', href: '/accounting', icon: CalculatorIcon },
      { key: 'generalLedger', labelKey: 'nav.generalLedger', href: '/reports', icon: DocumentTextIcon },
    ],
  },
  {
    key: 'salesGroup',
    labelKey: 'nav.sales',
    icon: BanknotesIcon,
    children: [
      { key: 'customers', labelKey: 'nav.customers', href: '/customers', icon: UsersIcon },
      { key: 'salesOrders', labelKey: 'nav.salesOrders', href: '/sales-orders', icon: DocumentTextIcon },
      { key: 'invoices', labelKey: 'nav.invoices', href: '/invoices', icon: DocumentTextIcon },
      { key: 'payments', labelKey: 'nav.payments', href: '/payments', icon: CreditCardIcon },
    ],
  },
  {
    key: 'purchasingGroup',
    labelKey: 'nav.purchasing',
    icon: TruckIcon,
    children: [
      { key: 'suppliers', labelKey: 'nav.suppliers', href: '/suppliers', icon: TruckIcon },
      { key: 'purchaseOrders', labelKey: 'nav.purchaseOrders', href: '/purchase-orders', icon: DocumentTextIcon },
      { key: 'purchaseReceipts', labelKey: 'nav.purchaseReceipts', href: '/purchase-receipts', icon: InboxArrowDownIcon },
    ],
  },
  {
    key: 'inventoryGroup',
    labelKey: 'nav.inventoryGroup',
    icon: CubeIcon,
    children: [
      { key: 'items', labelKey: 'nav.items', href: '/items', icon: CubeIcon },
      { key: 'inventory', labelKey: 'nav.inventory', href: '/inventory', icon: ShoppingCartIcon },
      { key: 'stockEntries', labelKey: 'nav.stockEntries', href: '/stock-entries', icon: ShoppingCartIcon },
      { key: 'stockLedger', labelKey: 'nav.stockLedger', href: '/reports', icon: DocumentTextIcon },
    ],
  },
  {
    key: 'manufacturingGroup',
    labelKey: 'nav.manufacturingGroup',
    icon: WrenchScrewdriverIcon,
    children: [
      { key: 'bom', labelKey: 'nav.bom', href: '/manufacturing', icon: WrenchScrewdriverIcon },
      { key: 'workOrders', labelKey: 'nav.workOrders', href: '/manufacturing', icon: ClipboardDocumentListIcon },
      { key: 'jobCards', labelKey: 'nav.jobCards', href: '/manufacturing', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    key: 'hrGroup',
    labelKey: 'nav.hr',
    icon: UsersIcon,
    children: [
      { key: 'employees', labelKey: 'nav.employees', href: '/employees', icon: UsersIcon },
      { key: 'attendance', labelKey: 'nav.attendance', href: '/hr', icon: ClockIcon },
      { key: 'leaves', labelKey: 'nav.leaves', href: '/hr', icon: ClockIcon },
      { key: 'payroll', labelKey: 'nav.payroll', href: '/hr', icon: BriefcaseIcon },
    ],
  },
  { key: 'crm', labelKey: 'nav.crm', href: '/crm', icon: PhoneArrowUpRightIcon },
  {
    key: 'assetsGroup',
    labelKey: 'nav.assetsGroup',
    icon: ArchiveBoxIcon,
    children: [
      { key: 'assets', labelKey: 'nav.fixedAssets', href: '/assets', icon: ArchiveBoxIcon },
    ],
  },
  {
    key: 'projectsGroup',
    labelKey: 'nav.projectsGroup',
    icon: BriefcaseIcon,
    children: [
      { key: 'projects', labelKey: 'nav.projects', href: '/projects', icon: BriefcaseIcon },
      { key: 'tasks', labelKey: 'nav.tasks', href: '/projects', icon: ClipboardDocumentListIcon },
      { key: 'timesheets', labelKey: 'nav.timesheets', href: '/projects', icon: ClockIcon },
    ],
  },
  { key: 'reports', labelKey: 'nav.reports', href: '/reports', icon: ChartBarIcon },
  { key: 'settings', labelKey: 'nav.settings', href: '/settings', icon: CogIcon },
];

const GroupNavItem = ({
  entry,
  sidebarOpen,
  isActive,
}: {
  entry: GroupItem;
  sidebarOpen: boolean;
  isActive: boolean;
}) => {
  const { t } = useTranslation();
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openFlyout = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      // Position the flyout just to the left of the sidebar button, at the
      // same vertical position — a fixed position element so it escapes the
      // scrollable nav's clipping instead of being cut off.
      setFlyoutPos({ top: rect.top, right: window.innerWidth - rect.left + 8 });
    }
    setFlyoutOpen((v) => !v);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={openFlyout}
        className={`sidebar-link w-full ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${sidebarOpen ? '' : 'justify-center'}`}
        title={t(entry.labelKey)}
      >
        <entry.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-secondary-400'}`} />
        {sidebarOpen && <span className="mr-3 flex-1 text-right animate-fade-in">{t(entry.labelKey)}</span>}
      </button>

      {/* Flyout panel — pops out to the side, like a Windows Start menu category flyout.
          Fixed positioning (not absolute) so it isn't clipped by the scrollable nav. */}
      {flyoutOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 w-56 bg-white rounded-xl shadow-lg border border-secondary-200 py-2"
          style={{ top: flyoutPos.top, right: flyoutPos.right }}
        >
          <div className="px-4 py-1.5 text-xs font-semibold text-secondary-400">{t(entry.labelKey)}</div>
          {entry.children.map((child) => (
            <NavLink
              key={child.key}
              to={child.href}
              onClick={() => setFlyoutOpen(false)}
              className={({ isActive: childActive }) =>
                `flex items-center px-4 py-2.5 text-sm transition-colors ${
                  childActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50'
                }`
              }
            >
              <child.icon className="w-4 h-4 flex-shrink-0" />
              <span className="mr-2">{t(child.labelKey)}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

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
          return (
            <GroupNavItem key={entry.key} entry={entry} sidebarOpen={sidebarOpen} isActive={groupHasActiveChild} />
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
