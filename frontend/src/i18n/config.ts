// MuradERP i18n Configuration
// Proprietary - All Rights Reserved © 2026 Murad Ghannam

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from './locales/ar.json';
import en from './locales/en.json';
import ur from './locales/ur.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import tl from './locales/tl.json';
import id from './locales/id.json';
import ml from './locales/ml.json';
import tr from './locales/tr.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import zh from './locales/zh.json';

export const supportedLanguages = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', label: 'বাংলা', dir: 'ltr' },
  { code: 'tl', label: 'Filipino', dir: 'ltr' },
  { code: 'id', label: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'ml', label: 'മലയാളം', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'zh', label: '中文', dir: 'ltr' },
] as const;

export const rtlLanguageCodes = supportedLanguages.filter((l) => l.dir === 'rtl').map((l) => l.code);

export function applyDirection(lng: string) {
  const dir = rtlLanguageCodes.includes(lng as any) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      ur: { translation: ur },
      hi: { translation: hi },
      bn: { translation: bn },
      tl: { translation: tl },
      id: { translation: id },
      ml: { translation: ml },
      tr: { translation: tr },
      fr: { translation: fr },
      es: { translation: es },
      zh: { translation: zh },
    },
    fallbackLng: 'ar',
    supportedLngs: supportedLanguages.map((l) => l.code),
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'murad_erp_language',
    },
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => applyDirection(lng));
applyDirection(i18n.language || 'ar');

export default i18n;
