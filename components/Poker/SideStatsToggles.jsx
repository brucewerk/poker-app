// components/Poker/SideStatsToggles.jsx - VERSÃO FINAL (vertical, legível, não cobre, com tema claro)
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function SideStatsToggles({
  pot = 0,
  stage = "preflop",
  stageNames = {},
  playerMoney = 0,
  cpuMoney = 0,
  currentBet = 0,
  isTurbo = false,
  isMultiplayerActive = false,
  currentUser = "",
}) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setIsLandscape(width > height && width < 900);
    };

    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkTheme(theme !== "light");
    };

    checkScreen();
    checkTheme();
    window.addEventListener("resize", checkScreen);
    window.addEventListener("themechange", checkTheme);

    // Observer para mudanças no atributo data-theme
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("resize", checkScreen);
      window.removeEventListener("themechange", checkTheme);
      observer.disconnect();
    };
  }, []);

  const stageLabel = stageNames[stage] || stage || "Pré-flop";

  const items = [
    { id: "pot", icon: "💰", value: pot, label: "Pote", color: "#ffd700" },
    {
      id: "stage",
      icon: "🎴",
      value: stageLabel,
      label: "Fase",
      color: "#4fc3f7",
    },
    {
      id: "player",
      icon: "👤",
      value: playerMoney,
      label: "Suas fichas",
      color: "#4caf50",
    },
    { id: "cpu", icon: "🤖", value: cpuMoney, label: "CPU", color: "#ff7043" },
    {
      id: "bet",
      icon: "📊",
      value: currentBet,
      label: "Aposta",
      color: "#ffa726",
    },
    {
      id: "turbo",
      icon: isTurbo ? "🚀" : "🐢",
      value: isTurbo ? "Turbo" : "Normal",
      label: "Modo",
      color: isTurbo ? "#ff9800" : "#4caf50",
    },
    {
      id: "players",
      icon: "👥",
      value: isMultiplayerActive ? "2P" : "1P",
      label: "Jogadores",
      color: isMultiplayerActive ? "#4caf50" : "#78909c",
    },
  ];

  // 🔥 ESTADO MINIMIZADO - ÍCONE NO CANTO SUPERIOR ESQUERDO
  if (isMinimized) {
    return (
      <motion.button
        onClick={() => setIsMinimized(false)}
        style={{
          position: "fixed",
          top: "10px",
          left: "12px",
          zIndex: 200,
          background: isDarkTheme
            ? "rgba(0,0,0,0.75)"
            : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          border: isDarkTheme
            ? "1px solid rgba(255,215,0,0.3)"
            : "1px solid rgba(0,0,0,0.15)",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          color: "gold",
          cursor: "pointer",
          fontSize: "1.1rem",
          boxShadow: isDarkTheme
            ? "0 4px 16px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Expandir estatísticas"
      >
        📊
        <span
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            background: "#4caf50",
            borderRadius: "50%",
            width: "15px",
            height: "15px",
            fontSize: "0.35rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          {items.length}
        </span>
      </motion.button>
    );
  }

  // 🔥 EXPANDIDO VERTICAL - COM SCROLL E LEGÍVEL
  return (
    <motion.div
      style={{
        position: "fixed",
        top: "52px",
        left: "12px",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: isMobile ? "3px" : "5px",
        padding: isMobile ? "6px 8px" : "10px 14px",
        background: isDarkTheme ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.95)",
        backdropFilter: "blur(18px)",
        borderRadius: isMobile ? "12px" : "16px",
        border: isDarkTheme
          ? "1px solid rgba(255,215,0,0.2)"
          : "1px solid rgba(0,0,0,0.1)",
        boxShadow: isDarkTheme
          ? "0 8px 32px rgba(0,0,0,0.5)"
          : "0 8px 32px rgba(0,0,0,0.1)",
        maxHeight: isMobile ? "calc(100vh - 65px)" : "calc(100vh - 70px)",
        overflowY: "auto",
        overflowX: "hidden",
        minWidth: isMobile ? "100px" : "160px",
        maxWidth: isMobile ? "calc(100vw - 24px)" : "calc(100vw - 100px)",
        scrollbarWidth: "thin",
      }}
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* HEADER COM BOTÃO FECHAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: isMobile ? "4px" : "6px",
          borderBottom: isDarkTheme
            ? "1px solid rgba(255,215,0,0.1)"
            : "1px solid rgba(0,0,0,0.08)",
          marginBottom: isMobile ? "4px" : "6px",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? "0.55rem" : "0.7rem",
            color: isDarkTheme ? "rgba(255,215,0,0.6)" : "rgba(0,0,0,0.5)",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          📊 STATS
        </span>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: "none",
            border: "none",
            color: isDarkTheme ? "rgba(255,215,0,0.4)" : "rgba(0,0,0,0.3)",
            cursor: "pointer",
            fontSize: isMobile ? "0.6rem" : "0.8rem",
            padding: "2px 8px",
            transition: "color 0.3s ease",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) =>
            (e.target.style.color = isDarkTheme ? "gold" : "#000")
          }
          onMouseLeave={(e) =>
            (e.target.style.color = isDarkTheme
              ? "rgba(255,215,0,0.4)"
              : "rgba(0,0,0,0.3)")
          }
          title="Minimizar"
        >
          ✕
        </button>
      </div>

      {items.map((item) => (
        <motion.div
          key={item.id}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: isMobile ? "6px" : "10px",
            background: isDarkTheme ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.04)",
            borderRadius: "8px",
            padding: isMobile ? "3px 8px" : "5px 12px",
            border: isDarkTheme
              ? "1px solid rgba(255,255,255,0.04)"
              : "1px solid rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
            width: "100%",
            minWidth: isMobile ? "80px" : "130px",
          }}
          whileHover={{
            scale: 1.02,
            background: isDarkTheme
              ? "rgba(255,215,0,0.06)"
              : "rgba(0,0,0,0.04)",
            border: isDarkTheme
              ? "1px solid rgba(255,215,0,0.1)"
              : "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <span
            style={{
              fontSize: isMobile ? "0.7rem" : "0.9rem",
              color: item.color,
              minWidth: isMobile ? "18px" : "24px",
              textAlign: "center",
            }}
          >
            {item.icon}
          </span>
          <span
            style={{
              fontSize: isMobile ? "0.5rem" : "0.65rem",
              color: isDarkTheme ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
              fontWeight: "600",
              minWidth: isMobile ? "45px" : "70px",
              letterSpacing: "0.2px",
            }}
          >
            {item.label}:
          </span>
          <span
            style={{
              fontSize: isMobile ? "0.6rem" : "0.8rem",
              color: isDarkTheme ? "#ffffff" : "#0a2f1f",
              fontWeight: "700",
              textAlign: "right",
              flex: 1,
              textShadow: isDarkTheme ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: isMobile ? "50px" : "80px",
            }}
          >
            {typeof item.value === "number" ? item.value : item.value}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
