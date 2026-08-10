// components/Poker/ResultModal.jsx - CORRIGIDO (SEM whileHover/whileTap em elementos DOM)
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
    // 🔥 CORREÇÃO: Impede rolagem do body
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

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setTimeout(() => onClose(), 350);
  };

  // 🔥 Renderiza cartas com tamanho fixo em porcentagem
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

    const isSmallScreen =
      typeof window !== "undefined" && window.innerHeight < 500;
    const cardSize = isSmallScreen ? "28px" : "40px";
    const cardHeight = isSmallScreen ? "40px" : "56px";
    const fontSize = isSmallScreen ? "0.5rem" : "0.7rem";

    return (
      <motion.div
        key={`card-${index}-${card.rank}${card.suit}`}
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
          width: cardSize,
          height: cardHeight,
          margin: "1px",
          borderRadius: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          flexShrink: 0,
          background: isFlipped
            ? "repeating-linear-gradient(45deg, #2b5797, #2b5797 6px, #1d3f6e 6px, #1d3f6e 12px)"
            : "linear-gradient(145deg, #ffffff, #f0f0f0)",
          border: isFlipped ? "1px solid #1a3a6e" : "1px solid #ddd",
          color: isRed ? "#cc0000" : "#000",
        }}
      >
        {!isFlipped && (
          <>
            <span style={{ fontSize, fontWeight: 800, lineHeight: 1 }}>
              {rankDisplay}
            </span>
            <span
              style={{ fontSize: `calc(${fontSize} * 1.2)`, lineHeight: 1 }}
            >
              {card.suit}
            </span>
          </>
        )}
      </motion.div>
    );
  };

  const renderCards = (cards, faceDown = false) => {
    if (!cards || cards.length === 0) {
      return (
        <span style={{ color: "#999", fontSize: "0.6rem" }}>Sem cartas</span>
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
    },
    loss: {
      icon: "💔",
      title: "DERROTA!",
      titleColor: "#f44336",
      bgGradient: "linear-gradient(145deg, #3b0d0d, #6a1a1a)",
      borderColor: "#f44336",
      glowColor: "rgba(244, 67, 54, 0.3)",
    },
    tie: {
      icon: "🤝",
      title: "EMPATE!",
      titleColor: "#ffc107",
      bgGradient: "linear-gradient(145deg, #3b3a0d, #6a6a1a)",
      borderColor: "#ffc107",
      glowColor: "rgba(255, 193, 7, 0.3)",
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
      <motion.div
        style={{
          background: isDarkTheme ? config.bgGradient : "#ffffff",
          padding: isSmallScreen ? "8px 12px" : "16px 24px",
          borderRadius: isSmallScreen ? "12px" : "20px",
          maxWidth: isSmallScreen ? "100%" : "480px",
          width: "100%",
          maxHeight: "95vh",
          overflow: "hidden",
          color: isDarkTheme ? "white" : "#0d1f15",
          border: isDarkTheme
            ? `2px solid ${config.borderColor}`
            : "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
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
        {/* Botão Fechar - usando motion.button para animações */}
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

        {/* Header - Compacto */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isSmallScreen ? "6px" : "12px",
            marginBottom: isSmallScreen ? "4px" : "8px",
          }}
        >
          <span style={{ fontSize: isSmallScreen ? "1.4rem" : "2rem" }}>
            {config.icon}
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: isSmallScreen ? "1rem" : "1.5rem",
              fontWeight: 800,
              color: config.titleColor,
            }}
          >
            {config.title}
          </h2>
        </div>

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
              marginBottom: isSmallScreen ? "2px" : "4px",
              padding: isSmallScreen ? "2px 4px" : "4px 8px",
              background: "rgba(0,0,0,0.06)",
              borderRadius: 8,
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
              }}
            >
              🔥 MESA
            </span>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2px",
                padding: isSmallScreen ? "2px 0" : "4px 0",
              }}
            >
              {renderCards(data.communityCards)}
            </div>
          </div>
        )}

        {/* Comparação lado a lado - Compacta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            padding: isSmallScreen ? "2px 0" : "4px 0",
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
              background: isWin ? "rgba(76,175,80,0.08)" : "transparent",
            }}
          >
            <div
              style={{
                fontSize: isSmallScreen ? "0.5rem" : "0.65rem",
                fontWeight: 700,
                color: isWin ? "#4caf50" : "#999",
                marginBottom: isSmallScreen ? "1px" : "2px",
              }}
            >
              🃏 {playerName} {isWin && "🏆"}
            </div>
            <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
              {renderCards(data.playerCards)}
            </div>
            <div
              style={{
                fontSize: isSmallScreen ? "0.45rem" : "0.6rem",
                fontWeight: 600,
                color: isWin ? "#4caf50" : "#999",
                marginTop: isSmallScreen ? "1px" : "2px",
                background: "rgba(0,0,0,0.05)",
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
              fontSize: isSmallScreen ? "0.6rem" : "0.9rem",
              fontWeight: 800,
              color: "#666",
              padding: "0 2px",
            }}
          >
            ⚡
          </div>

          {/* CPU */}
          <div
            style={{
              flex: 1,
              textAlign: "right",
              padding: isSmallScreen ? "2px 4px" : "4px 8px",
              borderRadius: 8,
              background:
                !isWin && !isTie ? "rgba(244,67,54,0.08)" : "transparent",
            }}
          >
            <div
              style={{
                fontSize: isSmallScreen ? "0.5rem" : "0.65rem",
                fontWeight: 700,
                color: !isWin && !isTie ? "#f44336" : "#999",
                marginBottom: isSmallScreen ? "1px" : "2px",
              }}
            >
              {!isWin && !isTie && "💀"} {cpuName}{" "}
              {data.isMultiplayer ? "👤" : "🤖"}
            </div>
            <div
              style={{
                display: "flex",
                gap: "2px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {renderCards(data.cpuCards)}
            </div>
            <div
              style={{
                fontSize: isSmallScreen ? "0.45rem" : "0.6rem",
                fontWeight: 600,
                color: !isWin && !isTie ? "#f44336" : "#999",
                marginTop: isSmallScreen ? "1px" : "2px",
                background: "rgba(0,0,0,0.05)",
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
            padding: isSmallScreen ? "2px 6px" : "4px 12px",
            fontSize: isSmallScreen ? "0.55rem" : "0.75rem",
            background: "rgba(0,0,0,0.06)",
            borderRadius: 8,
            marginBottom: isSmallScreen ? "2px" : "4px",
          }}
        >
          <span style={{ fontWeight: "bold" }}>💰 Pote: {data.pot}</span>
          <div>
            {isWin && (
              <span style={{ color: "#4caf50", fontWeight: 800 }}>
                + {data.chipsWon}
              </span>
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

        {/* CPU Thought - Compacto */}
        {data.cpuThought && (
          <div
            style={{
              textAlign: "center",
              fontSize: isSmallScreen ? "0.45rem" : "0.6rem",
              color: isDarkTheme ? "#bbb" : "#666",
              fontStyle: "italic",
              padding: isSmallScreen ? "2px 4px" : "4px 8px",
              marginBottom: isSmallScreen ? "2px" : "4px",
              background: "rgba(0,0,0,0.04)",
              borderRadius: 8,
            }}
          >
            💭 {data.cpuThought}
          </div>
        )}

        {/* Botão Continuar - usando motion.button para animações */}
        <motion.button
          onClick={handleClose}
          disabled={isClosing}
          style={{
            background: "linear-gradient(145deg, #f7d97c, #d6a12e)",
            border: "none",
            fontWeight: 700,
            fontSize: isSmallScreen ? "0.6rem" : "0.85rem",
            padding: isSmallScreen ? "6px 12px" : "10px 20px",
            borderRadius: 30,
            boxShadow: "0 3px 0 #7a4c1a",
            color: "#2e241f",
            width: "100%",
            cursor: isClosing ? "not-allowed" : "pointer",
            opacity: isClosing ? 0.5 : 1,
            marginTop: isSmallScreen ? "2px" : "4px",
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
