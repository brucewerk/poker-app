// components/Poker/ThemeCustomizer.jsx
"use client";

import { useState } from "react";

const THEMES = {
  dark: {
    name: "Escuro",
    bgPrimary: "#0a2f1f",
    bgFelt: "#1a6a3a",
    textPrimary: "#ffffff",
    gold: "#ffd700",
  },
  light: {
    name: "Claro",
    bgPrimary: "#f8faf9",
    bgFelt: "#1e8a5a",
    textPrimary: "#0a2f1f",
    gold: "#1a4a3a",
  },
  neon: {
    name: "Neon",
    bgPrimary: "#0a0a1a",
    bgFelt: "#1a0a3a",
    textPrimary: "#00ff88",
    gold: "#ff00ff",
  },
  retro: {
    name: "Retro",
    bgPrimary: "#1a1a0a",
    bgFelt: "#2a2a1a",
    textPrimary: "#ffaa00",
    gold: "#ff4400",
  },
};

export default function ThemeCustomizer() {
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [isOpen, setIsOpen] = useState(false);

  const applyTheme = (themeKey) => {
    const theme = THEMES[themeKey];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--bg-primary", theme.bgPrimary);
    root.style.setProperty("--bg-felt", theme.bgFelt);
    root.style.setProperty("--text-primary", theme.textPrimary);
    root.style.setProperty("--gold", theme.gold);
    setCurrentTheme(themeKey);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="toolbar-btn"
        title="Customizar Tema"
        style={{ position: "relative" }}
      >
        🎨
        <span className="toolbar-dot toolbar-dot-gold" />
      </button>

      {isOpen && (
        <div style={popupStyle()}>
          <div style={popupHeaderStyle()}>
            <span>🎨 Temas</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <div style={themeGridStyle()}>
            {Object.entries(THEMES).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                style={themeButtonStyle(key === currentTheme, theme)}
              >
                <div style={themePreviewStyle(theme)} />
                <span style={themeNameStyle()}>{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function popupStyle() {
  return {
    position: "absolute",
    right: "0",
    top: "calc(100% + 10px)",
    background: "rgba(0,0,0,0.95)",
    padding: "15px",
    borderRadius: "16px",
    border: "1px solid rgba(255,215,0,0.2)",
    backdropFilter: "blur(12px)",
    minWidth: "200px",
    zIndex: 200,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  };
}

function popupHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    color: "gold",
    fontWeight: "bold",
  };
}

function themeGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  };
}

function themeButtonStyle(isActive, theme) {
  return {
    background: "rgba(255,255,255,0.03)",
    border: isActive
      ? `2px solid ${theme.gold}`
      : "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textAlign: "center",
  };
}

function themePreviewStyle(theme) {
  return {
    width: "100%",
    height: "30px",
    borderRadius: "6px",
    background: theme.bgPrimary,
    border: `1px solid ${theme.gold}`,
    marginBottom: "4px",
    position: "relative",
    overflow: "hidden",
  };
}

function themeNameStyle() {
  return {
    fontSize: "0.65rem",
    color: "var(--text-primary)",
    fontWeight: "600",
  };
}
