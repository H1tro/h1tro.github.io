import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AQIMap from "./AQIMap.jsx";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";

const SENSOR_SEED = [
  { id: "center", key: "center", lat: 42.8746, lng: 74.5698, aqi: 165, pm25: 84, pm10: 73, temperature: 22, humidity: 42, online: true },
  { id: "osh-bazaar", key: "oshBazaar", lat: 42.8749, lng: 74.5697, aqi: 178, pm25: 91, pm10: 104, temperature: 23, humidity: 45, online: true },
  { id: "dordoi", key: "dordoi", lat: 42.9333, lng: 74.6208, aqi: 201, pm25: 110, pm10: 118, temperature: 21, humidity: 48, online: true },
  { id: "jal", key: "jal", lat: 42.8415, lng: 74.565, aqi: 102, pm25: 51, pm10: 61, temperature: 22, humidity: 41, online: true },
  { id: "south", key: "south", lat: 42.82, lng: 74.6, aqi: 95, pm25: 44, pm10: 36, temperature: 20, humidity: 50, online: true },
  { id: "industrial", key: "industrial", lat: 42.889, lng: 74.64, aqi: 220, pm25: 130, pm10: 132, temperature: 24, humidity: 39, online: true },
  { id: "microdistrict-7", key: "micro7", lat: 42.8275, lng: 74.6035, aqi: 88, pm25: 40, pm10: 58, temperature: 21, humidity: 46, online: true },
  { id: "microdistrict-12", key: "micro12", lat: 42.814, lng: 74.615, aqi: 79, pm25: 35, pm10: 52, temperature: 20, humidity: 49, online: true },
  { id: "orto-sai", key: "ortoSai", lat: 42.8305, lng: 74.6205, aqi: 91, pm25: 42, pm10: 61, temperature: 22, humidity: 43, online: true },
];

const AQI_HISTORY = [78, 82, 89, 96, 102, 111, 126, 137, 148, 158, 151, 144, 139, 132, 125, 119, 113, 108, 117, 129, 141, 136, 128, 121];

const API_ENDPOINTS = {
  sensors: "/api/sensors",
  aqi: "/api/aqi",
  system: "/api/system",
  fans: "/api/fans",
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function getAqiMeta(aqi, t) {
  if (aqi <= 50) return { label: t("good"), color: "#22c55e", text: "text-emerald-400" };
  if (aqi <= 100) return { label: t("moderate"), color: "#eab308", text: "text-yellow-500" };
  if (aqi <= 170) return { label: t("unhealthy"), color: "#f97316", text: "text-orange-500" };
  return { label: t("dangerous"), color: "#ef4444", text: "text-red-500" };
}

function formatTime(offsetSeconds = 0) {
  return new Date(Date.now() - offsetSeconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createLiveSensors(tick, t) {
  return SENSOR_SEED.map((sensor, index) => {
    const wave = Math.sin((tick + index * 1.7) / 3);
    const drift = Math.cos((tick + index) / 5);
    const online = sensor.id === "industrial" ? tick % 18 !== 0 : sensor.online;
    const pm25 = clamp(Math.round(sensor.pm25 + wave * 5 + drift * 3), 9, 130);
    const aqi = clamp(Math.round(sensor.aqi + wave * 12 + drift * 7), 31, 240);

    return {
      ...sensor,
      district: t(`districts.${sensor.key}`),
      aqi,
      pm25,
      pm10: clamp(Math.round(sensor.pm10 + wave * 8), 18, 170),
      temperature: clamp(Math.round((sensor.temperature + Math.sin((tick + index) / 6) * 1.3) * 10) / 10, 16, 29),
      humidity: clamp(Math.round(sensor.humidity + Math.cos((tick + index) / 4) * 3), 32, 61),
      online,
      timestamp: formatTime(index * 13 + (online ? 0 : 260)),
    };
  });
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [tick, setTick] = useState(0);
  const [selectedSensorId, setSelectedSensorId] = useState("osh-bazaar");
  const [activeTab, setActiveTab] = useState("live");
  const heatOpacity = 0.56;
  const filterHealth = 78;

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 2400);
    return () => window.clearInterval(interval);
  }, []);

  const sensors = useMemo(() => createLiveSensors(tick, t), [tick, t]);
  const onlineSensors = sensors.filter((sensor) => sensor.online);
  const cityAqi = Math.round(onlineSensors.reduce((sum, sensor) => sum + sensor.aqi, 0) / onlineSensors.length);
  const avgPm25 = Math.round(onlineSensors.reduce((sum, sensor) => sum + sensor.pm25, 0) / onlineSensors.length);
  const selectedSensor = sensors.find((sensor) => sensor.id === selectedSensorId) || sensors[0];
  const cityMeta = getAqiMeta(cityAqi, t);
  const fanRpm = Math.round(1450 + cityAqi * 10 + 380);
  const uptime = `${Math.floor(126 + tick / 70)}h ${String((18 + tick) % 60).padStart(2, "0")}m`;
  const filterDays = Math.max(2, Math.round(filterHealth * 1.4 - avgPm25 * 0.18));
  const aqiSeries = useMemo(
    () => AQI_HISTORY.map((point, index) => clamp(Math.round(point + (cityAqi - 120) * 0.42 + Math.sin((tick + index) / 3) * 7), 34, 240)),
    [cityAqi, tick],
  );

  return (
    <main className="subtle-grid-bg min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] antialiased selection:bg-cyan-300 selection:text-slate-950">
      <motion.div
        className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-5 lg:px-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Navbar cityMeta={cityMeta} cityAqi={cityAqi} />

        <section className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <Sidebar
            cityAqi={cityAqi}
            avgPm25={avgPm25}
            cityMeta={cityMeta}
            filterHealth={filterHealth}
            filterDays={filterDays}
            fanRpm={fanRpm}
            uptime={uptime}
            sensorCount={onlineSensors.length}
            totalSensors={sensors.length}
          />

          <div className="flex min-h-0 flex-col gap-4">
            {/* Tab Swer / Переключатель вкладок */}
            <div className="flex items-center gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-1 self-start">
              <button
                onClick={() => setActiveTab("live")}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === "live"
                    ? "bg-[color:var(--accent)] text-slate-950 shadow-[0_0_12px_var(--accent-glow)]"
                    : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                }`}
              >
                {t("liveMonitor")}
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`rounded-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === "gallery"
                    ? "bg-[color:var(--accent)] text-slate-950 shadow-[0_0_12px_var(--accent-glow)]"
                    : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                }`}
              >
                {t("systemGallery")}
              </button>
            </div>

            {activeTab === "live" ? (
              <motion.div
                key="live-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <AQIMap
                  sensors={sensors}
                  selectedSensor={selectedSensor}
                  onSelectSensor={setSelectedSensorId}
                  heatOpacity={heatOpacity}
                />
                <HistoricalPanel aqiSeries={aqiSeries} sensors={sensors} />
              </motion.div>
            ) : (
              <motion.div
                key="gallery-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <SystemGallery />
              </motion.div>
            )}
          </div>

          <SystemPanel selectedSensor={selectedSensor} filterHealth={filterHealth} filterDays={filterDays} apiEndpoints={API_ENDPOINTS} />
        </section>
      </motion.div>
    </main>
  );
}

function HistoricalPanel({ aqiSeries, sensors }) {
  const { t } = useLanguage();

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[color:var(--text)]">{t("historicalAqiTrend")}</h3>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">{t("historySubtitle")}</p>
          </div>
          <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{t("liveMock")}</span>
        </div>
        <LineChart data={aqiSeries} color="var(--accent)" />
      </div>
      <div className="glass-panel p-4">
        <h3 className="text-base font-semibold text-[color:var(--text)]">{t("sensorStatusTitle")}</h3>
        <div className="mt-4 space-y-2">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="flex w-full items-center justify-between rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-left">
              <span>
                <span className="block text-sm font-medium text-[color:var(--text)]">{sensor.district}</span>
                <span className="text-xs text-[color:var(--text-muted)]">{t("pm25")} {sensor.pm25} ug/m3</span>
              </span>
              <span className={`rounded-full px-2 py-1 text-xs ${sensor.online ? "bg-emerald-400/10 text-emerald-500" : "bg-slate-400/10 text-slate-500"}`}>
                {sensor.online ? t("online").toLowerCase() : t("offline").toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LineChart({ data, color }) {
  const { t } = useLanguage();
  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 88 - ((value - min) / (max - min || 1)) * 72;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="mt-4 h-44 w-full overflow-visible" role="img" aria-label={t("aqiTrendChart")}>
      <defs>
        <linearGradient id="aqiHistoryFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth="0.5" />
      ))}
      <path d={`M0,100 L${points} L100,100 Z`} fill="url(#aqiHistoryFill)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy={points.split(" ").at(-1).split(",")[1]} r="2" fill={color} />
    </svg>
  );
}

function SystemPanel({ selectedSensor, filterHealth, filterDays, apiEndpoints }) {
  const { t } = useLanguage();
  const meta = getAqiMeta(selectedSensor.aqi, t);

  return (
    <aside className="glass-panel p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">{t("selectedNode")}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{selectedSensor.district}</h2>
        <p className={`mt-1 text-sm font-semibold ${selectedSensor.online ? meta.text : "text-slate-400"}`}>
          {selectedSensor.online ? `${meta.label} ${t("airQuality")}` : t("offline")}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SmallStat label={t("aqi")} value={selectedSensor.aqi} color={meta.color} />
        <SmallStat label={t("pm25")} value={`${selectedSensor.pm25}`} suffix="ug/m3" />
        <SmallStat label={t("temp")} value={`${selectedSensor.temperature}`} suffix="C" />
        <SmallStat label={t("humidity")} value={`${selectedSensor.humidity}%`} />
      </div>

      <div className="mt-5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-muted)]">{t("filterReplacement")}</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{filterDays} {t("daysLeft")}</p>
          </div>
          <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-500">{t("monitored")}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--track)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400"
            initial={false}
            animate={{ width: `${filterHealth}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <InfoPanel title={t("integrationNotes")}>
        <p><span className="text-[color:var(--text-muted)]">{t("rest")}:</span> {t("restNote")}</p>
        <p><span className="text-[color:var(--text-muted)]">{t("websocket")}:</span> {t("websocketNote")}</p>
        <p><span className="text-[color:var(--text-muted)]">{t("mqtt")}:</span> {t("mqttNote")}</p>
      </InfoPanel>

      <InfoPanel title={t("placeholderEndpoints")}>
        <div className="grid gap-2 text-sm">
          {Object.values(apiEndpoints).map((endpoint) => (
            <code key={endpoint} className="rounded bg-[color:var(--surface-soft)] px-2 py-1 text-[color:var(--accent)]">{endpoint}</code>
          ))}
        </div>
      </InfoPanel>
    </aside>
  );
}

function InfoPanel({ title, children }) {
  return (
    <div className="mt-5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-muted)]">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-[color:var(--text)]">{children}</div>
    </div>
  );
}

function SmallStat({ label, value, suffix, color }) {
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]" style={{ color: color || undefined }}>
        {value} {suffix ? <span className="text-sm font-medium text-[color:var(--text-muted)]">{suffix}</span> : null}
      </p>
    </div>
  );
}

function SystemGallery() {
  const { t } = useLanguage();

  const galleryItems = [
    {
      id: "device",
      image: "/images/device_render.png",
      title: t("deviceRenderTitle"),
      desc: t("deviceRenderDesc"),
      specs: [
        { label: "Processor / Процессор", value: "Raspberry Pi 4 Model B (4GB RAM)" },
        { label: "Purification / Фильтрация", value: "HEPA H13 + Active Carbon Filter" },
        { label: "Casing / Корпус", value: "Custom laser-cut 4mm transparent acrylic" },
        { label: "Control / Управление", value: "PWM auto-regulated 12V dual 120mm fans" }
      ]
    },
    {
      id: "filter",
      image: "/images/filter_diagram.png",
      title: t("filterDiagramTitle"),
      desc: t("filterDiagramDesc"),
      specs: [
        { label: "Layer 1 / Слой 1", value: "Nylon mesh pre-filter (dust, hair, debris)" },
        { label: "Layer 2 / Слой 2", value: "Medical-grade H13 HEPA (99.97% PM2.5 trap)" },
        { label: "Layer 3 / Слой 3", value: "Granular active carbon (gases, odors, VOCs)" },
        { label: "Lifespan / Ресурс", value: "90-120 days depending on winter smog level" }
      ]
    },
    {
      id: "schematic",
      image: "/images/system_schematic.png",
      title: t("systemSchematicTitle"),
      desc: t("systemSchematicDesc"),
      specs: [
        { label: "Sensors / Датчики", value: "Laser PM2.5 (SDS011) + Temperature/Humid (DHT22)" },
        { label: "Communication / Сеть", value: "MQTT broker telemetry + REST JSON API" },
        { label: "Telemetry / Частота", value: "Live updates published every 2.4 seconds" },
        { label: "Data Logging / Логи", value: "Local SQLite db on 32GB MicroSD card" }
      ]
    },
    {
      id: "bishkek",
      image: "/images/bishkek_panoramic.png",
      title: t("bishkekPanoramicTitle"),
      desc: t("bishkekPanoramicDesc"),
      specs: [
        { label: "Location / Локация", value: "Bishkek, Kyrgyzstan (Chuy Valley)" },
        { label: "Context / Контекст", value: "Extreme winter heating season smog mitigation" },
        { label: "Target / Цель", value: "Maintain indoor PM2.5 index below 15 ug/m3" },
        { label: "Status / Статус", value: "Prototyping, sensor grid active" }
      ]
    }
  ];

  const [activeItem, setActiveItem] = useState(galleryItems[0]);

  return (
    <section className="glass-panel p-5 flex flex-col gap-5">
      <div>
        <h3 className="text-xl font-semibold text-[color:var(--text)]">{t("galleryTitle")}</h3>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">{t("gallerySubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Main Display */}
        <div className="flex flex-col gap-4">
          <div className="relative group overflow-hidden rounded-lg border border-[color:var(--border)] bg-black/40 aspect-video flex items-center justify-center">
            <motion.img
              key={activeItem.id}
              src={activeItem.image}
              alt={activeItem.title}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <a
                href={activeItem.image}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-slate-950 flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M10 14L21 3M18 21H3V6h7" />
                </svg>
                {t("viewFullSize")}
              </a>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            {galleryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`relative rounded-md overflow-hidden border aspect-video transition-all ${
                  activeItem.id === item.id
                    ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent-glow)]"
                    : "border-[color:var(--border)] opacity-60 hover:opacity-100"
                }`}
              >
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info & Specs */}
        <div className="flex flex-col gap-4 justify-between">
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-[color:var(--text)]">{activeItem.title}</h4>
            <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">{activeItem.desc}</p>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 space-y-3">
            <h5 className="text-xs uppercase tracking-[0.24em] font-semibold text-[color:var(--text-muted)]">Specs & Telemetry</h5>
            <div className="space-y-2">
              {activeItem.specs.map((spec) => (
                <div key={spec.label} className="flex flex-col border-b border-[color:var(--border)] pb-1.5 last:border-b-0 last:pb-0">
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-muted)]">{spec.label}</span>
                  <span className="text-xs font-medium text-[color:var(--text)] mt-0.5">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
