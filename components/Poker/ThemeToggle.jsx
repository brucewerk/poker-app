// components/Poker/ThemeToggle.jsx - CORRIGIDO
"use client";

import { useTheme } from "@/app/theme/ThemeContext";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      className="toolbar-btn"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      <motion.div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
        }}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      >
        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>
          {isDark ? "🌙" : "☀️"}
        </span>
      </motion.div>
      {isDark && <span className="toolbar-dot toolbar-dot-gold" />}
    </motion.button>
  );
}
