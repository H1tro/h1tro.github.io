import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet.heat";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { getAqiMeta } from "./Dashboard.jsx";

const BISHKEK_CENTER = [42.8746, 74.6122];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function AQIMap({ sensors, selectedSensor, onSelectSensor, heatOpacity }) {
  const { t } = useLanguage();

  return (
    <section className="glass-panel min-h-[620px] overflow-hidden p-4">
      <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--text)]">{t("liveMap")}</h2>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{t("mapSubtitle")}</p>
        </div>
        <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--text)]">
          {t("heatmapActive")} <span className="font-semibold text-[color:var(--accent)]">{t("active")}</span>
        </div>
      </div>

      <div className="relative h-[520px] overflow-hidden rounded-lg border border-[color:var(--border)] bg-slate-950">
        <MapContainer center={BISHKEK_CENTER} zoom={11} minZoom={10} maxZoom={15} scrollWheelZoom className="h-full w-full">
          <ThemeAwareMap />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatmapLayer sensors={sensors} opacity={heatOpacity} />
          {sensors.map((sensor) => (
            <SensorMarker key={sensor.id} sensor={sensor} selected={selectedSensor.id === sensor.id} onSelect={() => onSelectSensor(sensor.id)} />
          ))}
        </MapContainer>
        <WindOverlay />
        <MapLegend />
      </div>
    </section>
  );
}

function ThemeAwareMap() {
  const { theme } = useTheme();
  const map = useMap();

  useEffect(() => {
    map.getContainer().dataset.theme = theme;
  }, [map, theme]);

  return null;
}

function HeatmapLayer({ sensors, opacity }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    heatLayerRef.current = L.heatLayer([], {
      radius: 42,
      blur: 30,
      maxZoom: 13,
      minOpacity: 0.18,
      gradient: {
        0.18: "#22c55e",
        0.42: "#eab308",
        0.66: "#f97316",
        1: "#ef4444",
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!heatLayerRef.current) return;

    const points = sensors
      .filter((sensor) => sensor.online)
      .map((sensor) => [sensor.lat, sensor.lng, clamp(sensor.pm25 / 95, 0.15, 1)]);

    heatLayerRef.current.setLatLngs(points);
    heatLayerRef.current.setOptions({ opacity });
    if (heatLayerRef.current._canvas) heatLayerRef.current._canvas.style.opacity = String(opacity);
  }, [sensors, opacity]);

  return null;
}

function SensorMarker({ sensor, selected, onSelect }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const meta = getAqiMeta(sensor.aqi, t);
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "aqi-div-icon",
        html: `<span class="aqi-pulse ${theme === "light" ? "aqi-pulse-light" : ""}" style="--aqi-color:${sensor.online ? meta.color : "#64748b"}; --marker-size:${selected ? "22px" : "18px"}"></span>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -16],
      }),
    [meta.color, selected, sensor.online, theme],
  );

  return (
    <Marker position={[sensor.lat, sensor.lng]} icon={icon} eventHandlers={{ click: onSelect, mouseover: onSelect }}>
      <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
        <span className="font-semibold">{sensor.district}</span> - {t("aqi")} {sensor.aqi}
      </Tooltip>
      <Popup>
        <div className="leaflet-popup-card">
          <p className="popup-title">{sensor.district}</p>
          <div className="popup-grid">
            <span>{t("aqi")}</span>
            <strong style={{ color: meta.color }}>{sensor.aqi} {meta.label}</strong>
            <span>{t("pm25")}</span>
            <strong>{sensor.pm25} ug/m3</strong>
            <span>{t("temperature")}</span>
            <strong>{sensor.temperature} C</strong>
            <span>{t("humidity")}</span>
            <strong>{sensor.humidity}%</strong>
            <span>{t("sensorStatus")}</span>
            <strong>{sensor.online ? t("online") : t("offline")}</strong>
            <span>{t("lastUpdate")}</span>
            <strong>{sensor.timestamp}</strong>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function WindOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[450] overflow-hidden">
      {[12, 26, 40, 56, 70, 84].map((top, index) => (
        <span
          key={top}
          className="wind-line"
          style={{
            top: `${top}%`,
            left: `${8 + index * 9}%`,
            width: `${120 + index * 18}px`,
            animationDelay: `${index * 0.65}s`,
          }}
        />
      ))}
    </div>
  );
}

function MapLegend() {
  const { t } = useLanguage();
  const items = [
    [t("good"), "#22c55e"],
    [t("moderate"), "#eab308"],
    [t("unhealthy"), "#f97316"],
    [t("dangerous"), "#ef4444"],
  ];

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-md border border-[color:var(--border)] bg-[color:var(--surface)]/90 px-3 py-2 text-xs text-[color:var(--text)] shadow-xl backdrop-blur">
      <div className="flex flex-wrap gap-3">
        {items.map(([label, color]) => (
          <span key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
