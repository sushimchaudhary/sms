"use client";

import { useState, useEffect } from "react";
import { useTx } from "@/lib/context/TranslationContext";
import { useLanguage } from "@/lib/context/LanguageContext";

export function useT(text: string): string {
  const { translate } = useTx();
  const { locale } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let cancelled = false;

    if (locale === "en") {
      setTranslated(text);
      return;
    }

    // Check localStorage synchronously first (no flicker for cached strings)
    try {
      const cached = localStorage.getItem("tx_cache_" + locale + ":" + text);
      if (cached) {
        setTranslated(cached);
        return;
      }
    } catch {}

    // Async fetch for uncached strings
    translate(text).then((result) => {
      if (!cancelled) setTranslated(result);
    });

    return () => { cancelled = true; };
  }, [text, locale, translate]);

  return translated;
}