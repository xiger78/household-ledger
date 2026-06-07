import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Language, PaymentMethod, TransactionType } from '../types';
import {
  TranslationKey,
  formatAmountLocalized,
  t as translate,
  tMethod as translateMethod,
  tType as translateType,
} from '../i18n/translations';
import { getSettings, updateSettings } from '../store/database';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  tType: (type: TransactionType) => string;
  tMethod: (method: PaymentMethod) => string;
  formatAmount: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getSettings().language || 'ko');

  useEffect(() => {
    setLanguageState(getSettings().language || 'ko');
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await updateSettings({ language: lang });
    setLanguageState(lang);
  }, []);

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: (key, params) => translate(language, key, params),
    tType: (type) => translateType(language, type),
    tMethod: (method) => translateMethod(language, method),
    formatAmount: (amount) => formatAmountLocalized(language, amount),
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
