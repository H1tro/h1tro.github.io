import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      className="theme-toggle"
    >
      <span className="text-xs font-semibold text-[color:var(--text-muted)]">{isDark ? t("darkMode") : t("lightMode")}</span>
      <span className="theme-toggle-track">
        <motion.span
          className="theme-toggle-thumb"
          layout
          animate={{ x: isDark ? 0 : 22 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        />
      </span>
    </button>
  );
}
