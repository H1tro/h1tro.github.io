import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext.jsx";

export default function Sidebar({
  cityAqi,
  avgPm25,
  cityMeta,
  filterHealth,
  filterDays,
  fanRpm,
  uptime,
  sensorCount,
  totalSensors,
}) {
  const { t } = useLanguage();
  const stats = [
    [t("averagePm25"), `${avgPm25} ug/m3`, t("cityMean")],
    [t("filterHealth"), `${filterHealth}%`, `${filterDays} ${t("daysLeft")}`],
    [t("raspberryPi"), t("online"), t("wlanStable")],
    [t("sensors"), `${sensorCount}/${totalSensors}`, t("onlineNodes")],
    [t("fanRpm"), fanRpm.toLocaleString(), t("adaptive")],
    [t("deviceUptime"), uptime, t("systemdService")],
  ];

  return (
    <aside className="glass-panel p-5">
      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">{t("currentCityAqi")}</p>
            <motion.p
              key={cityAqi}
              className="mt-4 text-6xl font-semibold leading-none text-[color:var(--text)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {cityAqi}
            </motion.p>
            <p className={`mt-3 text-sm font-semibold ${cityMeta.text}`}>{cityMeta.label}</p>
          </div>
          <span className="mt-3 h-12 w-12 rounded-full shadow-[0_0_28px_currentColor]" style={{ backgroundColor: cityMeta.color, color: cityMeta.color }} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {stats.map(([label, value, note]) => (
          <MetricRow key={label} label={label} value={value} note={note} />
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-muted)]">{t("operationMode")}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[color:var(--text)]">{t("automatic")}</p>
            <p className="text-sm text-[color:var(--text-muted)]">{t("readOnlyNotice")}</p>
          </div>
          <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">{t("locked")}</span>
        </div>
      </div>
    </aside>
  );
}

function MetricRow({ label, value, note }) {
  return (
    <div className="metric-row">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{label}</p>
        <p className="mt-1 text-xl font-semibold text-[color:var(--text)]">{value}</p>
      </div>
      <p className="text-right text-xs text-[color:var(--text-muted)]">{note}</p>
    </div>
  );
}
