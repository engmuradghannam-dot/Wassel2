import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useAuthStore } from '../../store/authStore';
import { BuildingOfficeIcon, CogIcon, BellIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

type TabKey = 'company' | 'general' | 'notifications' | 'security' | 'print';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { selectedCompany } = useAuthStore();
  const { companySettings, isLoading, updateCompanySettings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabKey>('company');
  const [form, setForm] = useState<any>(companySettings || {});

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'company', label: t('settings.company'), icon: BuildingOfficeIcon },
    { key: 'general', label: t('settings.general'), icon: CogIcon },
    { key: 'notifications', label: t('settings.notifications'), icon: BellIcon },
    { key: 'security', label: t('settings.security'), icon: ShieldCheckIcon },
    { key: 'print', label: t('settings.print'), icon: DocumentTextIcon },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompanySettings(form);
  };

  if (!selectedCompany) {
    return (
      <div className="card text-center py-12">
        <BuildingOfficeIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700">{t('settings.selectCompany')}</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">{t('settings.title')}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <tab.icon className="w-5 h-5 me-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">{t('settings.companyInfo')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('settings.companyName')}</label>
                    <input
                      type="text"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.companyNameAr')}</label>
                    <input
                      type="text"
                      value={form.nameAr || ''}
                      onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                      className="form-input"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.taxId')}</label>
                    <input
                      type="text"
                      value={form.taxId || ''}
                      onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.email')}</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.phone')}</label>
                    <input
                      type="tel"
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.address')}</label>
                    <input
                      type="text"
                      value={form.address || ''}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.defaultCurrency')}</label>
                    <select
                      value={form.defaultCurrency || 'SAR'}
                      onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                      className="form-input"
                    >
                      <option value="SAR">SAR - ريال سعودي</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="AED">AED - درهم إماراتي</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('settings.fiscalYearStart')}</label>
                    <input
                      type="date"
                      value={form.fiscalYearStart ? new Date(form.fiscalYearStart).toISOString().split('T')[0] : ''}
                      onChange={(e) => setForm({ ...form, fiscalYearStart: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn-primary">
                    {t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">{t('settings.generalSettings')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{t('settings.language')}</h3>
                    <p className="text-sm text-secondary-500">{t('settings.languageDesc')}</p>
                  </div>
                  <select className="form-input w-48">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{t('settings.dateFormat')}</h3>
                    <p className="text-sm text-secondary-500">{t('settings.dateFormatDesc')}</p>
                  </div>
                  <select className="form-input w-48">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">{t('settings.notificationSettings')}</h2>
              <div className="space-y-4">
                {['emailNotifications', 'pushNotifications', 'smsNotifications', 'dailyDigest'].map((key) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">{t(`settings.${key}`)}</h3>
                      <p className="text-sm text-secondary-500">{t(`settings.${key}Desc`)}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">{t('settings.securitySettings')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{t('settings.twoFactor')}</h3>
                    <p className="text-sm text-secondary-500">{t('settings.twoFactorDesc')}</p>
                  </div>
                  <button className="btn-secondary">{t('common.enable')}</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{t('settings.sessionTimeout')}</h3>
                    <p className="text-sm text-secondary-500">{t('settings.sessionTimeoutDesc')}</p>
                  </div>
                  <select className="form-input w-32">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">{t('settings.printSettings')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('settings.pageSize')}</label>
                  <select className="form-input">
                    <option value="A4">A4</option>
                    <option value="A5">A5</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('settings.orientation')}</label>
                  <select className="form-input">
                    <option value="portrait">{t('settings.portrait')}</option>
                    <option value="landscape">{t('settings.landscape')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('settings.topMargin')}</label>
                  <input type="number" defaultValue={20} className="form-input" />
                </div>
                <div>
                  <label className="form-label">{t('settings.bottomMargin')}</label>
                  <input type="number" defaultValue={20} className="form-input" />
                </div>
                <div>
                  <label className="form-label">{t('settings.leftMargin')}</label>
                  <input type="number" defaultValue={15} className="form-input" />
                </div>
                <div>
                  <label className="form-label">{t('settings.rightMargin')}</label>
                  <input type="number" defaultValue={15} className="form-input" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
