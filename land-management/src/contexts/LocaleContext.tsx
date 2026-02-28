"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations, type Locale } from "@/lib/i18n";

type LocaleContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const t = useCallback((key: string) => translations[locale][key] ?? key, [locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
      document.documentElement.lang = locale === "ur" ? "ur" : "en";
    }
  }, [locale]);
  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
