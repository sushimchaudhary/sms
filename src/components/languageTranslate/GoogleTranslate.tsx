"use client";

import { useEffect } from "react";

// Extend Window type for Google Translate
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          containerId: string
        ) => void;
      };
    };
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    // Init callback Google Translate expects
    window.googleTranslateElementInit = () => {
      new window.google!.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "ne,en,ja,hi,ko",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // Inject the Google Translate script once
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Hidden container — Google Translate mounts its widget here
  return (
    <div
      id="google_translate_element"
      className="hidden"
      aria-hidden="true"
    />
  );
}