// components/Poker/ThemeToggle.jsx - ESTILO UNIFICADO COM OS DEMAIS BOTÕES
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
    </motion.button>
  );
}

// ====================== ESTILOS ======================
function buttonStyle() {
  return {
    width: 44,
    height: 44,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%",
    color: "white",
    fontSize: "1.2rem",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s ease",
    position: "relative",
    fontFamily: "inherit",
    outline: "none",
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
