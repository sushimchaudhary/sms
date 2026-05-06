"use client";

import React, { createContext, useContext, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/context/LanguageContext";

const CACHE_PREFIX = "tx_cache_";

type TxContextType = {
  translate: (text: string) => Promise<string>;
};

const TxContext = createContext<TxContextType>({ translate: async (t) => t });

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const pending = useRef<Record<string, Promise<string>>>({});


const batchQueue = useRef<{
  texts: string[];
  resolvers: ((v: string) => void)[];
  timer: ReturnType<typeof setTimeout> | null;
}>({ texts: [], resolvers: [], timer: null });

const translate = useCallback((text: string): Promise<string> => {
  if (locale === "en") return Promise.resolve(text);

  const cacheKey = "tx_cache_" + locale + ":" + text;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return Promise.resolve(cached);
  } catch {}

  return new Promise((resolve) => {
    batchQueue.current.texts.push(text);
    batchQueue.current.resolvers.push(resolve);

    if (batchQueue.current.timer) clearTimeout(batchQueue.current.timer);

    batchQueue.current.timer = setTimeout(async () => {
      const texts = [...batchQueue.current.texts];
      const resolvers = [...batchQueue.current.resolvers];
      batchQueue.current.texts = [];
      batchQueue.current.resolvers = [];
      batchQueue.current.timer = null;

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            system: "Translate each line to the target language. Return ONLY the translations, one per line, in the same order. No numbering, no explanation.",
            messages: [{
              role: "user",
              content: `Translate each line to ${locale === "ne" ? "Nepali" : locale}:\n${texts.join("\n")}`
            }]
          })
        });
        const data = await res.json();
        const lines = (data.content?.[0]?.text || "").split("\n");

        texts.forEach((original, i) => {
          const translated = lines[i]?.trim() || original;
          try { localStorage.setItem("tx_cache_" + locale + ":" + original, translated); } catch {}
          resolvers[i](translated);
        });
      } catch {
        resolvers.forEach((r, i) => r(texts[i]));
      }
    }, 50);
  });
}, [locale]);

  return (
    <TxContext.Provider value={{ translate }}>
      {children}
    </TxContext.Provider>
  );
}

export function useTx() {
  return useContext(TxContext);
}