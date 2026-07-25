import { createContext, useContext, useState } from 'react';
import translations from '../i18n/translations';

/**
 * LanguageContext — provides the active language and a lookup function
 * to all components in the tree.
 *
 * @typedef {'en'|'es'} Lang
 * @typedef {{ lang: Lang, setLang: (lang: Lang) => void, t: (key: string) => string }} LanguageContextValue
 */
const LanguageContext = createContext(null);

/**
 * LanguageProvider — wrap the app root with this to enable i18n.
 * Defaults to English.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  /**
   * Looks up a translation key for the current language.
   * Falls back to the English string, then the raw key if neither exists.
   *
   * @param {string} key
   * @returns {string}
   */
  function t(key) {
    return translations[lang]?.[key]
      ?? translations['en']?.[key]
      ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage — consume the language context.
 * Must be used inside a <LanguageProvider>.
 *
 * @returns {{ lang: Lang, setLang: (lang: Lang) => void, t: (key: string) => string }}
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider>');
  }
  return ctx;
}
