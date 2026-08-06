// components/Poker/SideStatsToggles.jsx - VERSÃO FINAL (vertical, legível, não cobre)
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

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768);
      setIsLandscape(width > height && width < 900);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
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
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,215,0,0.3)",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          color: "gold",
          cursor: "pointer",
          fontSize: "1.1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
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
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(18px)",
        borderRadius: isMobile ? "12px" : "16px",
        border: "1px solid rgba(255,215,0,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
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
          borderBottom: "1px solid rgba(255,215,0,0.1)",
          marginBottom: isMobile ? "4px" : "6px",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? "0.55rem" : "0.7rem",
            color: "rgba(255,215,0,0.6)",
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
            color: "rgba(255,215,0,0.4)",
            cursor: "pointer",
            fontSize: isMobile ? "0.6rem" : "0.8rem",
            padding: "2px 8px",
            transition: "color 0.3s ease",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => (e.target.style.color = "gold")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(255,215,0,0.4)")}
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
            background: "rgba(0,0,0,0.25)",
            borderRadius: "8px",
            padding: isMobile ? "3px 8px" : "5px 12px",
            border: "1px solid rgba(255,255,255,0.04)",
            transition: "all 0.2s ease",
            width: "100%",
            minWidth: isMobile ? "80px" : "130px",
          }}
          whileHover={{
            scale: 1.02,
            background: "rgba(255,215,0,0.06)",
            border: "1px solid rgba(255,215,0,0.1)",
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
              color: "rgba(255,255,255,0.5)",
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
              color: "#ffffff",
              fontWeight: "700",
              textAlign: "right",
              flex: 1,
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
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
