// components/Poker/ThemeToggle.jsx
"use client";

import { useTheme } from "@/app/theme/ThemeContext";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      style={buttonStyle()}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      <motion.div
        style={iconContainerStyle()}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      >
        {isDark ? (
          <span style={iconStyle()}>🌙</span>
        ) : (
          <span style={iconStyle()}>☀️</span>
        )}
      </motion.div>
      <span style={labelStyle()}>{isDark ? "Escuro" : "Claro"}</span>
    </motion.button>
  );
}

function buttonStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 30,
    padding: "6px 14px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    backdropFilter: "blur(4px)",
    fontFamily: "inherit",
    fontSize: "0.8rem",
  };
}

function iconContainerStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
  };
}

function iconStyle() {
  return {
    fontSize: "1.1rem",
    lineHeight: 1,
  };
}

function labelStyle() {
  return {
    fontSize: "0.7rem",
    fontWeight: "600",
    color: "#aaa",
  };
}
