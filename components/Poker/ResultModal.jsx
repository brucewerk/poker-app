// components/Poker/ResultModal.jsx - COMPLETO CORRIGIDO
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ResultModal({ data, onClose }) {
  if (!data) return null;

  const isWin = data.winner === "player";
  const isTie = data.winner === "tie";
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => setShowContent(true), 100);

    return () => {
      document.body.style.overflow = "";
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setTimeout(() => onClose(), 350);
  };

  // 🔥 RENDERIZAR CARTA INDIVIDUAL
  const renderCard = (card, index, isFlipped = false) => {
    if (!card) return null;
    const isRed = card.suit === "♥" || card.suit === "♦";
    const rankDisplay =
      card.rank === 14
        ? "A"
        : card.rank === 13
          ? "K"
          : card.rank === 12
            ? "Q"
            : card.rank === 11
              ? "J"
              : card.rank === 10
                ? "10"
                : card.rank;

    return (
      <motion.div
        key={`card-${index}-${card.rank}${card.suit}`}
        className="result-card"
        initial={{ opacity: 0, scale: 0.8, rotateY: isFlipped ? 180 : 0 }}
        animate={{
          opacity: showContent ? 1 : 0,
          scale: showContent ? 1 : 0.8,
          rotateY: 0,
        }}
        transition={{
          delay: 0.1 + index * 0.08,
          type: "spring",
          stiffness: 350,
          damping: 25,
        }}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 50,
          height: 70,
          margin: "2px",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          flexShrink: 0,
          position: "relative",
          background: isFlipped
            ? "repeating-linear-gradient(45deg, #2b5797, #2b5797 8px, #1d3f6e 8px, #1d3f6e 16px)"
            : "linear-gradient(145deg, #ffffff, #f0f0f0)",
          border: isFlipped ? "2px solid #1a3a6e" : "1px solid #ddd",
          color: isRed ? "#cc0000" : "#000",
          transition: "var(--transition-theme)",
        }}
      >
        {!isFlipped && (
          <>
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: isRed ? "#cc0000" : "#000",
                lineHeight: 1,
              }}
            >
              {rankDisplay}
            </span>
            <span
              style={{
                fontSize: "1rem",
                color: isRed ? "#cc0000" : "#000",
                lineHeight: 1,
              }}
            >
              {card.suit}
            </span>
          </>
        )}
      </motion.div>
    );
  };

  // 🔥 RENDERIZAR CARTAS
  const renderCards = (cards, faceDown = false) => {
    if (!cards || cards.length === 0) {
      return (
        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
          Sem cartas
        </span>
      );
    }
    return cards.map((card, i) => renderCard(card, i, faceDown));
  };

  const resultConfig = {
    win: {
      icon: "🏆",
      title: "VITÓRIA!",
      titleColor: "#4caf50",
      bgGradient: "linear-gradient(145deg, #0d3b1e, #1a6a3a)",
      borderColor: "#4caf50",
      glowColor: "rgba(76, 175, 80, 0.3)",
      badge: "VENCEDOR",
      badgeColor: "#4caf50",
    },
    loss: {
      icon: "💔",
      title: "DERROTA!",
      titleColor: "#f44336",
      bgGradient: "linear-gradient(145deg, #3b0d0d, #6a1a1a)",
      borderColor: "#f44336",
      glowColor: "rgba(244, 67, 54, 0.3)",
      badge: "ELIMINADO",
      badgeColor: "#f44336",
    },
    tie: {
      icon: "🤝",
      title: "EMPATE!",
      titleColor: "#ffc107",
      bgGradient: "linear-gradient(145deg, #3b3a0d, #6a6a1a)",
      borderColor: "#ffc107",
      glowColor: "rgba(255, 193, 7, 0.3)",
      badge: "EMPATE",
      badgeColor: "#ffc107",
    },
  };

  const config = isWin
    ? resultConfig.win
    : isTie
      ? resultConfig.tie
      : resultConfig.loss;

  const playerName = data.playerName || "Você";
  const cpuName = data.cpuName || "CPU";

  // 🔥 CORES DO TEMA CLARO E ESCURO
  const isDarkTheme =
    typeof window !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  return (
    <motion.div
      className="result-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        inset: 0,
        background: isDarkTheme ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
        padding: 20,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        className="result-modal"
        initial={{ scale: 0.85, rotateX: -10, opacity: 0 }}
        animate={{
          scale: isClosing ? 0.92 : 1,
          rotateX: isClosing ? -5 : 0,
          opacity: isClosing ? 0 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          duration: 0.4,
        }}
        style={{
          background: isDarkTheme ? config.bgGradient : "#ffffff",
          padding: "30px 35px",
          borderRadius: 28,
          maxWidth: 600,
          width: "100%",
          color: isDarkTheme ? "white" : "#0d1f15",
          border: isDarkTheme
            ? `2px solid ${config.borderColor}`
            : `2px solid rgba(13, 31, 21, 0.12)`,
          boxShadow: isDarkTheme
            ? `0 20px 60px rgba(0,0,0,0.6), 0 0 60px ${config.glowColor}`
            : `0 20px 60px rgba(0,0,0,0.08)`,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          scrollbarWidth: "thin",
          scrollbarColor: isDarkTheme
            ? "rgba(255,255,255,0.1) transparent"
            : "rgba(13,31,21,0.1) transparent",
          transition: "var(--transition-theme)",
        }}
      >
        {/* Botão Fechar */}
        <motion.button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: isDarkTheme
              ? "rgba(255,255,255,0.05)"
              : "rgba(13,31,21,0.05)",
            border: "none",
            color: isDarkTheme ? "#fff" : "#0d1f15",
            fontSize: "1.1rem",
            cursor: "pointer",
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            opacity: 0.6,
          }}
          whileHover={{
            background: isDarkTheme
              ? "rgba(255,255,255,0.15)"
              : "rgba(13,31,21,0.1)",
            rotate: 90,
          }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "8px",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: showContent ? 1 : 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDarkTheme
                ? "rgba(0,0,0,0.2)"
                : "rgba(13,31,21,0.06)",
              backdropFilter: "blur(4px)",
              border: isDarkTheme
                ? `2px solid ${config.borderColor}`
                : `2px solid rgba(13,31,21,0.15)`,
              boxShadow: isDarkTheme
                ? `0 0 40px ${config.glowColor}`
                : `0 0 20px rgba(13,31,21,0.05)`,
            }}
          >
            <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>
              {config.icon}
            </span>
          </motion.div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.8rem",
              fontWeight: 800,
              color: isDarkTheme
                ? config.titleColor
                : isWin
                  ? "#2e7d32"
                  : isTie
                    ? "#b8960f"
                    : "#c62828",
              textShadow: isDarkTheme ? `0 0 30px ${config.glowColor}` : "none",
              letterSpacing: "1px",
            }}
          >
            {config.title}
          </h2>
        </motion.div>

        {/* Mensagem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          style={{ textAlign: "center", marginBottom: "12px" }}
        >
          <p
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: isDarkTheme
                ? config.titleColor
                : isWin
                  ? "#2e7d32"
                  : isTie
                    ? "#b8960f"
                    : "#c62828",
              margin: 0,
              padding: "6px 16px",
              background: isDarkTheme
                ? "rgba(0,0,0,0.2)"
                : "rgba(13,31,21,0.04)",
              borderRadius: 20,
              display: "inline-block",
            }}
          >
            {data.winnerMsg}
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          style={{
            background: isDarkTheme ? "rgba(0,0,0,0.2)" : "rgba(13,31,21,0.04)",
            borderRadius: 16,
            padding: "14px",
            marginBottom: "12px",
            border: isDarkTheme
              ? `1px solid ${config.borderColor}33`
              : "1px solid rgba(13,31,21,0.06)",
          }}
        >
          {/* Community Cards */}
          {data.communityCards && data.communityCards.length > 0 && (
            <div
              style={{
                textAlign: "center",
                marginBottom: "10px",
                padding: "6px",
                background: isDarkTheme
                  ? "rgba(0,0,0,0.12)"
                  : "rgba(13,31,21,0.03)",
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  fontSize: "0.55rem",
                  color: isDarkTheme ? "#aaa" : "#4a5a52",
                  marginBottom: "4px",
                  display: "block",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  fontWeight: 600,
                }}
              >
                🔥 MESA
              </span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "4px",
                  flexWrap: "wrap",
                  padding: "2px 0",
                  minHeight: "50px",
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
              padding: "6px 0",
              borderTop: isDarkTheme
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(13,31,21,0.06)",
              borderBottom: isDarkTheme
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(13,31,21,0.06)",
              marginBottom: "4px",
              gap: "6px",
            }}
          >
            {/* Jogador */}
            <div
              style={{
                flex: 1,
                textAlign: "left",
                minWidth: "90px",
                padding: "4px 6px",
                borderRadius: 10,
                background: isWin
                  ? isDarkTheme
                    ? "rgba(76,175,80,0.12)"
                    : "rgba(46,125,50,0.08)"
                  : isDarkTheme
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(13,31,21,0.02)",
                border: isWin
                  ? isDarkTheme
                    ? `1px solid ${config.borderColor}44`
                    : "1px solid rgba(46,125,50,0.15)"
                  : "1px solid transparent",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: isDarkTheme
                    ? isWin
                      ? "#4caf50"
                      : "#aaa"
                    : isWin
                      ? "#2e7d32"
                      : "#4a5a52",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "4px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "0.9rem" }}>🃏</span>
                {playerName}
                {isWin && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: showContent ? 1 : 0 }}
                    transition={{
                      delay: 0.4,
                      type: "spring",
                      stiffness: 400,
                    }}
                    style={{
                      fontSize: "0.55rem",
                      background: isDarkTheme ? "#4caf50" : "#2e7d32",
                      color: "white",
                      padding: "1px 8px",
                      borderRadius: 10,
                    }}
                  >
                    VENCEDOR
                  </motion.span>
                )}
                {isTie && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: showContent ? 1 : 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                    style={{
                      fontSize: "0.55rem",
                      background: isDarkTheme ? "#ffc107" : "#b8960f",
                      color: isDarkTheme ? "#1a1a1a" : "white",
                      padding: "1px 8px",
                      borderRadius: 10,
                    }}
                  >
                    EMPATE
                  </motion.span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: "4px",
                  flexWrap: "wrap",
                  padding: "2px 0",
                  minHeight: "50px",
                }}
              >
                {renderCards(data.playerCards)}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: isDarkTheme
                    ? isWin
                      ? "#4caf50"
                      : "#aaa"
                    : isWin
                      ? "#2e7d32"
                      : "#4a5a52",
                  background: isDarkTheme
                    ? "rgba(0,0,0,0.2)"
                    : "rgba(13,31,21,0.04)",
                  padding: "2px 10px",
                  borderRadius: 10,
                  display: "inline-block",
                  marginTop: "4px",
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
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: isDarkTheme ? "#888" : "#b0b0b0",
                padding: "0 4px",
                minWidth: "24px",
              }}
            >
              ⚡
            </div>

            {/* CPU / Oponente */}
            <div
              style={{
                flex: 1,
                textAlign: "right",
                minWidth: "90px",
                padding: "4px 6px",
                borderRadius: 10,
                background:
                  !isWin && !isTie
                    ? isDarkTheme
                      ? "rgba(244,67,54,0.12)"
                      : "rgba(198,40,40,0.08)"
                    : isDarkTheme
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(13,31,21,0.02)",
                border:
                  !isWin && !isTie
                    ? isDarkTheme
                      ? `1px solid ${config.borderColor}44`
                      : "1px solid rgba(198,40,40,0.15)"
                    : "1px solid transparent",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: isDarkTheme
                    ? !isWin && !isTie
                      ? "#f44336"
                      : "#aaa"
                    : !isWin && !isTie
                      ? "#c62828"
                      : "#4a5a52",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "4px",
                  flexWrap: "wrap",
                }}
              >
                {!isWin && !isTie && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: showContent ? 1 : 0 }}
                    transition={{
                      delay: 0.4,
                      type: "spring",
                      stiffness: 400,
                    }}
                    style={{
                      fontSize: "0.55rem",
                      background: isDarkTheme ? "#f44336" : "#c62828",
                      color: "white",
                      padding: "1px 8px",
                      borderRadius: 10,
                    }}
                  >
                    ELIMINADO
                  </motion.span>
                )}
                {cpuName}
                <span style={{ fontSize: "0.9rem" }}>
                  {data.isMultiplayer ? "👤" : "🤖"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "4px",
                  flexWrap: "wrap",
                  padding: "2px 0",
                  minHeight: "50px",
                }}
              >
                {renderCards(data.cpuCards)}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: isDarkTheme
                    ? !isWin && !isTie
                      ? "#f44336"
                      : "#aaa"
                    : !isWin && !isTie
                      ? "#c62828"
                      : "#4a5a52",
                  background: isDarkTheme
                    ? "rgba(0,0,0,0.2)"
                    : "rgba(13,31,21,0.04)",
                  padding: "2px 10px",
                  borderRadius: 10,
                  display: "inline-block",
                  marginTop: "4px",
                }}
              >
                {data.cpuHand}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            fontSize: "0.9rem",
            background: isDarkTheme
              ? "rgba(0,0,0,0.15)"
              : "rgba(13,31,21,0.04)",
            borderRadius: 12,
            marginBottom: "6px",
            border: isDarkTheme
              ? `1px solid ${config.borderColor}22`
              : "1px solid rgba(13,31,21,0.06)",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              color: isDarkTheme ? "white" : "#0d1f15",
            }}
          >
            💰 Pote:{" "}
            <span style={{ color: isDarkTheme ? "#ffd700" : "#b8960f" }}>
              {data.pot}
            </span>{" "}
            fichas
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isWin && (
              <span
                style={{
                  color: isDarkTheme ? "#4caf50" : "#2e7d32",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  textShadow: isDarkTheme
                    ? "0 0 20px rgba(76,175,80,0.3)"
                    : "none",
                }}
              >
                + {data.chipsWon}
              </span>
            )}
            {!isWin && !isTie && (
              <span
                style={{
                  color: isDarkTheme ? "#f44336" : "#c62828",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  textShadow: isDarkTheme
                    ? "0 0 20px rgba(244,67,54,0.3)"
                    : "none",
                }}
              >
                - {data.chipsLost}
              </span>
            )}
            {isTie && (
              <span
                style={{
                  color: isDarkTheme ? "#ffc107" : "#b8960f",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  textShadow: isDarkTheme
                    ? "0 0 20px rgba(255,193,7,0.3)"
                    : "none",
                }}
              >
                + {data.split}
              </span>
            )}
          </div>
        </motion.div>

        {/* CPU Thought */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          style={{
            textAlign: "center",
            fontSize: "0.7rem",
            color: isDarkTheme ? "#bbb" : "#4a5a52",
            fontStyle: "italic",
            padding: "6px 12px",
            marginBottom: "8px",
            background: isDarkTheme
              ? "rgba(0,0,0,0.15)"
              : "rgba(13,31,21,0.04)",
            borderRadius: 12,
            minHeight: "22px",
            border: isDarkTheme
              ? `1px solid ${config.borderColor}22`
              : "1px solid rgba(13,31,21,0.06)",
          }}
        >
          <span style={{ opacity: 0.5 }}>💭</span> {data.cpuThought}
        </motion.div>

        {/* Botão Continuar */}
        <motion.button
          onClick={handleClose}
          disabled={isClosing}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
          style={{
            background: "linear-gradient(145deg, #f7d97c, #d6a12e)",
            border: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "12px 24px",
            borderRadius: 50,
            boxShadow: "0 4px 0 #7a4c1a, 0 0 30px rgba(255,215,0,0.1)",
            color: "#2e241f",
            width: "100%",
            transition: "all 0.2s ease",
            marginTop: "4px",
            letterSpacing: "0.5px",
            position: "relative",
            overflow: "hidden",
            cursor: isClosing ? "not-allowed" : "pointer",
            opacity: isClosing ? 0.5 : 1,
          }}
          whileHover={{
            scale: isClosing ? 1 : 1.02,
            boxShadow: isClosing
              ? "0 4px 0 #7a4c1a"
              : "0 6px 0 #7a4c1a, 0 0 40px rgba(255,215,0,0.2)",
          }}
          whileTap={{ scale: isClosing ? 1 : 0.98 }}
        >
          {isClosing ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ animation: "spin 0.8s linear infinite" }}>⏳</span>
              FECHANDO...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>▶</span>
              CONTINUAR
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
