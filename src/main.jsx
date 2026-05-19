import React from "react";
import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import Dashboard from "./components/Dashboard.jsx";
import "leaflet/dist/leaflet.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <Dashboard />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
