// components/Poker/Card.jsx - COMPLETO CORRIGIDO (SEM document e SEM conflitos de estilo)
"use client";

import { motion } from "framer-motion";
import { memo } from "react";

const Card = memo(function Card({
  card,
  faceDown = false,
  delay = 0,
  size = "normal",
  isHighlighted = false,
  isRevealing = false,
  className = "",
}) {
  if (!card) return null;

  const isRed = card.suit === "♥" || card.suit === "♦";

  // 🔥 TAMANHOS DAS CARTAS - SEM CONFLITOS DE ESTILO
  const getSizeStyles = () => {
    switch (size) {
      case "tiny":
        return {
          width: "32px",
          height: "45px",
          fontSize: "0.45rem",
          borderRadius: "4px",
          padding: "2px",
        };
      case "small":
        return {
          width: "45px",
          height: "63px",
          fontSize: "0.6rem",
          borderRadius: "5px",
          padding: "3px",
        };
      case "normal":
        return {
          width: "52px",
          height: "74px",
          fontSize: "0.7rem",
          borderRadius: "6px",
          padding: "4px",
        };
      case "large":
        return {
          width: "60px",
          height: "84px",
          fontSize: "0.8rem",
          borderRadius: "7px",
          padding: "5px",
        };
      default:
        return {
          width: "52px",
          height: "74px",
          fontSize: "0.7rem",
          borderRadius: "6px",
          padding: "4px",
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // 🔥 RANK DISPLAY
  const getRankDisplay = () => {
    const rank = card.rank;
    if (rank === 14) return "A";
    if (rank === 13) return "K";
    if (rank === 12) return "Q";
    if (rank === 11) return "J";
    if (rank === 10) return "10";
    return rank;
  };

  // 🔥 ESTILO DA CARTA - SEM MISTURAR SHORTHAND COM PROPRIEDADES ESPECÍFICAS
  const cardStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: sizeStyles.width,
    height: sizeStyles.height,
    fontSize: sizeStyles.fontSize,
    borderRadius: sizeStyles.borderRadius,
    padding: sizeStyles.padding,
    background: faceDown
      ? "repeating-linear-gradient(45deg, #2b5797, #2b5797 6px, #1d3f6e 6px, #1d3f6e 12px)"
      : "linear-gradient(145deg, #ffffff, #f0f0f0)",
    border: faceDown
      ? "2px solid #1a3a6e"
      : `1.5px solid ${isRed ? "#cc0000" : "#333"}`,
    color: isRed ? "#cc0000" : "#000",
    boxShadow: isHighlighted
      ? "0 0 20px rgba(255,215,0,0.6), 0 4px 15px rgba(0,0,0,0.3)"
      : "0 2px 8px rgba(0,0,0,0.2)",
    flexShrink: 0,
    fontWeight: 700,
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
    transition: "all 0.3s ease",
    position: "relative",
    transform: isHighlighted ? "scale(1.05)" : "scale(1)",
    ...(isHighlighted && {
      animation: "glowPulse 1.5s ease-in-out infinite",
    }),
  };

  // 🔥 ANIMAÇÃO DE REVELAÇÃO
  const cardVariants = {
    hidden: {
      rotateY: 180,
      scale: 0.8,
      opacity: 0,
    },
    visible: {
      rotateY: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: delay / 1000,
      },
    },
    faceDown: {
      rotateY: 0,
      scale: 1,
      opacity: 1,
    },
  };

  // 🔥 CONTEÚDO DA CARTA
  const renderContent = () => {
    if (faceDown) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            color: "rgba(255,255,255,0.3)",
            fontSize: `calc(${sizeStyles.fontSize} * 1.5)`,
            fontWeight: 900,
          }}
        >
          ♠
        </div>
      );
    }

    const rankDisplay = getRankDisplay();
    const suitDisplay = card.suit;

    // 🔥 PARA CARTAS PEQUENAS (TINY/SMALL) - LAYOUT SIMPLIFICADO
    if (size === "tiny" || size === "small") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            gap: "0px",
          }}
        >
          <span
            style={{
              fontSize: sizeStyles.fontSize,
              fontWeight: 800,
              lineHeight: 1,
              color: isRed ? "#cc0000" : "#000",
            }}
          >
            {rankDisplay}
          </span>
          <span
            style={{
              fontSize: `calc(${sizeStyles.fontSize} * 1.2)`,
              lineHeight: 1,
              color: isRed ? "#cc0000" : "#000",
            }}
          >
            {suitDisplay}
          </span>
        </div>
      );
    }

    // 🔥 PARA CARTAS NORMAIS/GRANDES - LAYOUT COMPLETO
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: "1px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 2px",
          }}
        >
          <span
            style={{
              fontSize: sizeStyles.fontSize,
              fontWeight: 800,
              lineHeight: 1,
              color: isRed ? "#cc0000" : "#000",
            }}
          >
            {rankDisplay}
          </span>
          <span
            style={{
              fontSize: `calc(${sizeStyles.fontSize} * 0.8)`,
              lineHeight: 1,
              color: isRed ? "#cc0000" : "#000",
            }}
          >
            {suitDisplay}
          </span>
        </div>
        <span
          style={{
            fontSize: `calc(${sizeStyles.fontSize} * 1.8)`,
            lineHeight: 1,
            color: isRed ? "#cc0000" : "#000",
            marginTop: "-2px",
          }}
        >
          {suitDisplay}
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 2px",
            transform: "rotate(180deg)",
          }}
        >
          <span
            style={{
              fontSize: sizeStyles.fontSize,
              fontWeight: 800,
              lineHeight: 1,
              color: isRed ? "#cc0000" : "#000",
            }}
          >
            {rankDisplay}
          </span>
          <span
            style={{
              fontSize: `calc(${sizeStyles.fontSize} * 0.8)`,
              lineHeight: 1,
              color: isRed ? "#cc0000" : "#000",
            }}
          >
            {suitDisplay}
          </span>
        </div>
      </div>
    );
  };

  // 🔥 ANIMAÇÃO DE REVELAÇÃO (SHOWDOWN)
  if (isRevealing && !faceDown) {
    return (
      <motion.div
        className={`card-container ${className}`}
        style={cardStyle}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={!faceDown ? { scale: 1.08, y: -5 } : {}}
        whileTap={!faceDown ? { scale: 0.95 } : {}}
      >
        {renderContent()}
      </motion.div>
    );
  }

  // 🔥 CARTA NORMAL
  return (
    <motion.div
      className={`card-container ${className}`}
      style={cardStyle}
      initial={faceDown ? "faceDown" : "hidden"}
      animate="visible"
      variants={cardVariants}
      whileHover={!faceDown ? { scale: 1.08, y: -5 } : {}}
      whileTap={!faceDown ? { scale: 0.95 } : {}}
    >
      {renderContent()}
    </motion.div>
  );
});

// 🔥 ANIMAÇÃO GLOBAL - USANDO CSS INJECTADO VIA STYLE TAG (APENAS NO CLIENTE)
if (typeof window !== "undefined") {
  // Verifica se o estilo já existe para não duplicar
  if (!document.getElementById("card-glow-style")) {
    const style = document.createElement("style");
    style.id = "card-glow-style";
    style.textContent = `
      @keyframes glowPulse {
        0%, 100% {
          box-shadow: 0 0 20px rgba(255,215,0,0.4), 0 4px 15px rgba(0,0,0,0.3);
        }
        50% {
          box-shadow: 0 0 40px rgba(255,215,0,0.8), 0 4px 25px rgba(0,0,0,0.4);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default Card;
