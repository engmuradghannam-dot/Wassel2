// MuradERP Login Page
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoginLoading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 relative">
      <div className="absolute top-4 left-4 bg-white/90 rounded-lg px-2 py-1">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
            <span className="text-primary-600 font-bold text-4xl">م</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('app.name')}</h1>
          <p className="text-primary-100">{t('app.tagline')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6 text-center">
            {t('auth.login')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="example@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-secondary-600">
                <input type="checkbox" className="rounded border-secondary-300" />
                {t('auth.rememberMe')}
              </label>
              <a href="/forgot-password" className="text-primary-600 hover:text-primary-700">
                {t('auth.forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoginLoading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {isLoginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('auth.loggingIn')}
                </span>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary-500">
            {t('auth.noAccount')}{' '}
            <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.createAccount')}
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-primary-200">
          {t('auth.allRightsReserved')}
        </p>
      </div>
    </div>
  );
};
