'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey } from './translations';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    // Read persisted language on client mount
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage === 'ar' || savedLanguage === 'en') {
      setTimeout(() => {
        setLanguageState(savedLanguage);
      }, 0);
    } else {
      // Default to Arabic
      localStorage.setItem('language', 'ar');
    }
  }, []);

  useEffect(() => {
    // Update HTML attributes dynamically on language change
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    // Check if key is a translation key
    const dictionary = translations[language] as Record<string, string>;
    const arabicFallback = translations['ar'] as Record<string, string>;

    let text = dictionary[key] || arabicFallback[key] || key;

    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      });
    }

    return text;
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
