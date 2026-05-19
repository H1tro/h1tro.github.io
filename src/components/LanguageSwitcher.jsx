import { useLanguage } from "../contexts/LanguageContext.jsx";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-1" aria-label={t("language")}>
      {["en", "ru"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-label={code === "en" ? t("switchToEnglish") : t("switchToRussian")}
          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
            language === code ? "bg-[color:var(--accent)] text-white shadow-[0_0_16px_var(--accent-glow)]" : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
