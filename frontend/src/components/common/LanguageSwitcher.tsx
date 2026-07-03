import { useTranslation } from 'react-i18next';
import { LanguageIcon } from '@heroicons/react/24/outline';
import { supportedLanguages } from '../../i18n/config';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="relative flex items-center gap-1">
      <LanguageIcon className="h-5 w-5 text-secondary-400" />
      <select
        className="bg-transparent text-sm text-secondary-700 focus:outline-none cursor-pointer"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label="Language"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
