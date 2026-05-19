import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";

export default function Navbar({ cityMeta, cityAqi }) {
  const { t } = useLanguage();

  return (
    <header className="glass-panel flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[color:var(--text-muted)]">{t("systemName")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-0 text-[color:var(--text)] md:text-3xl">{t("appTitle")}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <ConnectionChip label={t("rest")} value="/api/sensors" />
        <ConnectionChip label={t("websocket")} value={t("ready")} />
        <ConnectionChip label={t("mqtt")} value={t("bridgeReady")} />
        <div className="rounded-md border px-3 py-2" style={{ borderColor: `${cityMeta.color}66`, color: cityMeta.color, background: `${cityMeta.color}14` }}>
          {t("cityAqi")} <span className="font-semibold text-[color:var(--text)]">{cityAqi}</span>
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}

function ConnectionChip({ label, value }) {
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-[color:var(--text)]">
      <span className="text-[color:var(--text-muted)]">{label}</span> <span className="font-medium">{value}</span>
    </div>
  );
}
