"use client";
import React, { createContext, useContext } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

export type Locale = "en" | "ar";

const messages = { en, ar } as const;

interface I18nContextValue {
  locale: Locale;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "ar",
  t: (key) => key,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const dict = messages[locale] as Record<string, any>;
  const t = (key: string) => {
    return key.split(".").reduce<any>((obj, k) => (obj ? obj[k] : undefined), dict) ?? key;
  };
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
