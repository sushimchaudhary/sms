"use client";

import React, {
  createContext, useContext,
  useState, useEffect, useTransition
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

type Locale = "en" | "ne";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  isPending: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const saved = Cookies.get("NEXT_LOCALE") as Locale;
    if (saved === "en" || saved === "ne") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    // ✅ FIX: startTransition must be synchronous
    Cookies.set("NEXT_LOCALE", newLocale, { expires: 365, path: "/" });
    setLocaleState(newLocale);

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);