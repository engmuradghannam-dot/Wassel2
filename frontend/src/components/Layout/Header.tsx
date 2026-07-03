// MuradERP Header Component
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BellIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useCompany } from '../../hooks/useCompany';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const Header = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { sidebarOpen } = useUIStore();
  const { companies, selectedCompany, setSelectedCompany } = useCompany();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-secondary-200 transition-all duration-300 ${
        sidebarOpen ? 'mr-64' : 'mr-20'
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              className="input pr-10 w-full"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Company Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary-700 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <BuildingOfficeIcon className="w-5 h-5 text-secondary-500" />
              <span>{selectedCompany?.name || t('common.selectCompany')}</span>
              <ChevronDownIcon className="w-4 h-4 text-secondary-400" />
            </button>

            {showCompanyDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-50">
                {companies?.map((company: any) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelectedCompany(company);
                      setShowCompanyDropdown(false);
                    }}
                    className={`flex items-center w-full px-4 py-2.5 text-sm hover:bg-secondary-50 transition-colors ${
                      selectedCompany?.id === company.id ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
                    }`}
                  >
                    <BuildingOfficeIcon className="w-5 h-5 ml-2" />
                    {company.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-secondary-500 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-1 left-1 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-secondary-200">
                  <h3 className="text-sm font-semibold text-secondary-900">الإشعارات</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <p className="px-4 py-8 text-center text-sm text-secondary-500">لا توجد إشعارات جديدة</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.firstName} className="w-8 h-8 rounded-full" />
              ) : (
                <UserCircleIcon className="w-8 h-8 text-secondary-400" />
              )}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-secondary-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
              </div>
            </button>

            {showProfile && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-secondary-200 py-2 z-50">
                <a href="/profile" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                  الملف الشخصي
                </a>
                <a href="/settings" className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                  الإعدادات
                </a>
                <hr className="my-1 border-secondary-200" />
                <button className="block w-full text-right px-4 py-2 text-sm text-danger-600 hover:bg-danger-50">
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
