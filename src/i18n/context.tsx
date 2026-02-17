import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Locale, TranslationDict } from './types';
import ko from './ko';
import en from './en';
import ja from './ja';

const dictionaries: Record<Locale, TranslationDict> = { ko, en, ja };

const STORAGE_KEY = 'fitsize-locale';

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ko' || stored === 'en' || stored === 'ja') return stored;
  const lang = navigator.language.slice(0, 2);
  if (lang === 'ja') return 'ja';
  if (lang === 'en') return 'en';
  return 'ko';
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  useEffect(() => {
    // Persist initial detected locale
    localStorage.setItem(STORAGE_KEY, locale);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let str = dictionaries[locale][key] ?? dictionaries['ko'][key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{{${k}}}`, String(v));
      }
    }
    return str;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
