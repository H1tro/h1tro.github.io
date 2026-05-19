import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../translations/index.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "anti-smog-language";

function getInitialLanguage() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "ru") return saved;
  return "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const dictionary = translations[language];
    const t = (key) => key.split(".").reduce((current, part) => current?.[part], dictionary) ?? key;
    return { language, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
