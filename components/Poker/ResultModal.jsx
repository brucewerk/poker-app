// components/Poker/ResultModal.jsx - PREMIUM (cartas reais, confetti e badges)
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Card from "./Card.jsx";

// 🔥 Confetti só roda no cliente (depende de window) — import dinâmico evita erro de SSR
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export default function ResultModal({ data, onClose }) {
  if (!data) return null;

  const isWin = data.winner === "player";
  const isTie = data.winner === "tie";
  const isBigWin = isWin && (data.chipsWon || 0) >= 300;
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // 🔥 Impede rolagem do body enquanto o modal está aberto
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    const timer = setTimeout(() => setShowContent(true), 100);

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      clearTimeout(timer);
    };
  }, []);

  // 🔥 CONFETTI DE COMEMORAÇÃO NAS VITÓRIAS
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);

    let stopTimer;
    if (isWin) {
      setShowConfetti(true);
      stopTimer = setTimeout(
        () => setShowConfetti(false),
        isBigWin ? 6500 : 4000,
      );
    }

    return () => {
      window.removeEventListener("resize", updateSize);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, [isWin, isBigWin]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setShowConfetti(false);
    setTimeout(() => onClose(), 350);
  };

  const renderCards = (cards, faceDown = false, size = "small") => {
    if (!cards || cards.length === 0) {
      return (
        <span style={{ color: "#999", fontSize: "0.6rem" }}>Sem cartas</span>
      );
    }
    return cards.map((card, i) => (
      <Card
        key={`card-${i}-${card.rank}${card.suit}`}
        card={card}
        faceDown={faceDown}
        size={size}
        delay={i * 90}
      />
    ));
  };

  const resultConfig = {
    win: {
      icon: "🏆",
      title: isBigWin ? "GRANDE VITÓRIA!" : "VITÓRIA!",
      titleColor: "#4caf50",
      bgGradient: isBigWin
        ? "linear-gradient(145deg, #123b1a, #1d7a3a, #0e5a26)"
        : "linear-gradient(145deg, #0d3b1e, #1a6a3a)",
      borderColor: isBigWin ? "#ffd700" : "#4caf50",
      glowColor: isBigWin ? "rgba(255,215,0,0.35)" : "rgba(76, 175, 80, 0.3)",
      badge: "VENCEDOR",
    },
    loss: {
      icon: "💔",
      title: "DERROTA!",
      titleColor: "#f44336",
      bgGradient: "linear-gradient(145deg, #3b0d0d, #6a1a1a)",
      borderColor: "#f44336",
      glowColor: "rgba(244, 67, 54, 0.3)",
      badge: "ELIMINADO",
    },
    tie: {
      icon: "🤝",
      title: "EMPATE!",
      titleColor: "#ffc107",
      bgGradient: "linear-gradient(145deg, #3b3a0d, #6a6a1a)",
      borderColor: "#ffc107",
      glowColor: "rgba(255, 193, 7, 0.3)",
      badge: "EMPATE",
    },
  };

  const config = isWin
    ? resultConfig.win
    : isTie
      ? resultConfig.tie
      : resultConfig.loss;
  const playerName = data.playerName || "Você";
  const cpuName = data.cpuName || "CPU";

  const isDarkTheme =
    typeof window !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  const isSmallScreen =
    typeof window !== "undefined" && window.innerHeight < 500;

  return (
    <motion.div
      style={{
        position: "fixed",
        inset: 0,
        background: isDarkTheme ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: "8px",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={isBigWin ? 420 : 180}
          recycle={false}
          gravity={0.25}
          colors={
            isBigWin
              ? ["#ffd700", "#fff4c1", "#4caf50", "#ffffff", "#d6a12e"]
              : ["#4caf50", "#ffd700", "#ffffff"]
          }
          style={{ position: "fixed", inset: 0, zIndex: 2500, pointerEvents: "none" }}
        />
      )}

      <motion.div
        style={{
          background: isDarkTheme ? config.bgGradient : "#ffffff",
          padding: isSmallScreen ? "8px 12px" : "16px 24px",
          borderRadius: isSmallScreen ? "12px" : "20px",
          maxWidth: isSmallScreen ? "100%" : "480px",
          width: "100%",
          maxHeight: "95vh",
          overflowY: "auto",
          color: isDarkTheme ? "white" : "#0d1f15",
          border: isDarkTheme
            ? `2px solid ${config.borderColor}`
            : "1px solid rgba(0,0,0,0.08)",
          boxShadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 60px ${config.glowColor}`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: isClosing ? 0.95 : 1,
          opacity: isClosing ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Botão Fechar */}
        <motion.button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: isSmallScreen ? "4px" : "8px",
            right: isSmallScreen ? "4px" : "8px",
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: isDarkTheme ? "#fff" : "#333",
            fontSize: isSmallScreen ? "0.8rem" : "1rem",
            cursor: "pointer",
            width: isSmallScreen ? "24px" : "28px",
            height: isSmallScreen ? "24px" : "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.6,
            zIndex: 10,
          }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>

        {/* Header */}
        <motion.div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isSmallScreen ? "6px" : "12px",
            marginBottom: isSmallScreen ? "4px" : "8px",
          }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.1 }}
        >
          <motion.span
            style={{ fontSize: isSmallScreen ? "1.4rem" : "2.1rem" }}
            animate={
              isWin
                ? { rotate: [0, -8, 8, -6, 0], scale: [1, 1.15, 1] }
                : {}
            }
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {config.icon}
          </motion.span>
          <h2
            style={{
              margin: 0,
              fontSize: isSmallScreen ? "1rem" : "1.6rem",
              fontWeight: 800,
              color: config.titleColor,
              textShadow: isDarkTheme
                ? `0 0 24px ${config.glowColor}`
                : "none",
              letterSpacing: "0.5px",
            }}
          >
            {config.title}
          </h2>
        </motion.div>

        {/* Mensagem */}
        <p
          style={{
            textAlign: "center",
            fontSize: isSmallScreen ? "0.65rem" : "0.85rem",
            fontWeight: 600,
            color: config.titleColor,
            margin: isSmallScreen ? "2px 0 4px 0" : "4px 0 8px 0",
            padding: isSmallScreen ? "2px 8px" : "4px 12px",
            background: "rgba(0,0,0,0.1)",
            borderRadius: 12,
          }}
        >
          {data.winnerMsg}
        </p>

        {/* Community Cards */}
        {data.communityCards && data.communityCards.length > 0 && (
          <div
            style={{
              textAlign: "center",
              marginBottom: isSmallScreen ? "2px" : "6px",
              padding: isSmallScreen ? "4px" : "6px 8px",
              background: "rgba(0,0,0,0.15)",
              borderRadius: 10,
            }}
          >
            <span
              style={{
                fontSize: isSmallScreen ? "0.4rem" : "0.55rem",
                color: isDarkTheme ? "#aaa" : "#666",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              🔥 MESA
            </span>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                padding: isSmallScreen ? "2px 0" : "4px 0",
              }}
            >
              {renderCards(data.communityCards)}
            </div>
          </div>
        )}

        {/* Comparação lado a lado */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            padding: isSmallScreen ? "2px 0" : "6px 0",
            gap: isSmallScreen ? "4px" : "8px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            marginBottom: isSmallScreen ? "2px" : "4px",
          }}
        >
          {/* Jogador */}
          <div
            style={{
              flex: 1,
              textAlign: "left",
              padding: isSmallScreen ? "2px 4px" : "4px 8px",
              borderRadius: 8,
              background: isWin ? "rgba(76,175,80,0.1)" : "transparent",
              border: isWin ? `1px solid ${config.borderColor}44` : "1px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: isSmallScreen ? "0.5rem" : "0.68rem",
                fontWeight: 700,
                color: isWin ? "#4caf50" : "#999",
                marginBottom: isSmallScreen ? "1px" : "3px",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              🃏 {playerName}
              {isWin && (
                <span
                  style={{
                    fontSize: isSmallScreen ? "0.4rem" : "0.5rem",
                    background: "#4caf50",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: 8,
                  }}
                >
                  {config.badge}
                </span>
              )}
              {isTie && (
                <span
                  style={{
                    fontSize: isSmallScreen ? "0.4rem" : "0.5rem",
                    background: "#ffc107",
                    color: "#1a1a1a",
                    padding: "1px 6px",
                    borderRadius: 8,
                  }}
                >
                  EMPATE
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {renderCards(data.playerCards)}
            </div>
            <div
              style={{
                fontSize: isSmallScreen ? "0.45rem" : "0.62rem",
                fontWeight: 600,
                color: isWin ? "#4caf50" : "#999",
                marginTop: isSmallScreen ? "1px" : "3px",
                background: "rgba(0,0,0,0.15)",
                padding: isSmallScreen ? "1px 4px" : "2px 8px",
                borderRadius: 8,
                display: "inline-block",
              }}
            >
              {data.playerHand}
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: isSmallScreen ? "0.6rem" : "1rem",
              fontWeight: 800,
              color: "#666",
              padding: "0 2px",
            }}
          >
            ⚡
          </div>

          {/* CPU / Oponente */}
          <div
            style={{
              flex: 1,
              textAlign: "right",
              padding: isSmallScreen ? "2px 4px" : "4px 8px",
              borderRadius: 8,
              background:
                !isWin && !isTie ? "rgba(244,67,54,0.1)" : "transparent",
              border:
                !isWin && !isTie
                  ? `1px solid ${config.borderColor}44`
                  : "1px solid transparent",
            }}
          >
            <div
              style={{
                fontSize: isSmallScreen ? "0.5rem" : "0.68rem",
                fontWeight: 700,
                color: !isWin && !isTie ? "#f44336" : "#999",
                marginBottom: isSmallScreen ? "1px" : "3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {!isWin && !isTie && (
                <span
                  style={{
                    fontSize: isSmallScreen ? "0.4rem" : "0.5rem",
                    background: "#f44336",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: 8,
                  }}
                >
                  {config.badge}
                </span>
              )}
              {cpuName} {data.isMultiplayer ? "👤" : "🤖"}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {renderCards(data.cpuCards)}
            </div>
            <div
              style={{
                fontSize: isSmallScreen ? "0.45rem" : "0.62rem",
                fontWeight: 600,
                color: !isWin && !isTie ? "#f44336" : "#999",
                marginTop: isSmallScreen ? "1px" : "3px",
                background: "rgba(0,0,0,0.15)",
                padding: isSmallScreen ? "1px 4px" : "2px 8px",
                borderRadius: 8,
                display: "inline-block",
              }}
            >
              {data.cpuHand}
            </div>
          </div>
        </div>

        {/* Pote */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: isSmallScreen ? "2px 6px" : "6px 12px",
            fontSize: isSmallScreen ? "0.55rem" : "0.8rem",
            background: "rgba(0,0,0,0.15)",
            borderRadius: 8,
            marginBottom: isSmallScreen ? "2px" : "4px",
          }}
        >
          <span style={{ fontWeight: "bold" }}>
            💰 Pote: <span style={{ color: "#ffd700" }}>{data.pot}</span>
          </span>
          <div>
            {isWin && (
              <motion.span
                style={{ color: "#4caf50", fontWeight: 800 }}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                + {data.chipsWon}
              </motion.span>
            )}
            {!isWin && !isTie && (
              <span style={{ color: "#f44336", fontWeight: 800 }}>
                - {data.chipsLost}
              </span>
            )}
            {isTie && (
              <span style={{ color: "#ffc107", fontWeight: 800 }}>
                + {data.split}
              </span>
            )}
          </div>
        </div>

        {/* CPU Thought */}
        {data.cpuThought && (
          <div
            style={{
              textAlign: "center",
              fontSize: isSmallScreen ? "0.45rem" : "0.62rem",
              color: isDarkTheme ? "#bbb" : "#666",
              fontStyle: "italic",
              padding: isSmallScreen ? "2px 4px" : "4px 8px",
              marginBottom: isSmallScreen ? "2px" : "4px",
              background: "rgba(0,0,0,0.1)",
              borderRadius: 8,
            }}
          >
            💭 {data.cpuThought}
          </div>
        )}

        {/* Botão Continuar */}
        <motion.button
          onClick={handleClose}
          disabled={isClosing}
          style={{
            background: "linear-gradient(145deg, #f7d97c, #d6a12e)",
            border: "none",
            fontWeight: 700,
            fontSize: isSmallScreen ? "0.6rem" : "0.88rem",
            padding: isSmallScreen ? "6px 12px" : "11px 20px",
            borderRadius: 30,
            boxShadow: "0 3px 0 #7a4c1a",
            color: "#2e241f",
            width: "100%",
            cursor: isClosing ? "not-allowed" : "pointer",
            opacity: isClosing ? 0.5 : 1,
            marginTop: isSmallScreen ? "2px" : "6px",
          }}
          whileHover={{ scale: isClosing ? 1 : 1.02 }}
          whileTap={{ scale: isClosing ? 1 : 0.98 }}
        >
          {isClosing ? "⏳" : "▶ CONTINUAR"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
