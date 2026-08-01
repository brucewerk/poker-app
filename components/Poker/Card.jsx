// components/Poker/Card.jsx - COMPLETO CORRIGIDO
"use client";

import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";

const Card = memo(function Card({
  card,
  faceDown = false,
  delay = 0,
  size = "normal",
  isHighlighted = false,
  isRevealing = false,
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkTheme(theme === "dark");
    }
  }, []);

  useEffect(() => {
    if (isRevealing && faceDown) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isRevealing, faceDown]);

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

  // 🔥 CORRIGIDO: Garantir que todos os tamanhos tenham valores definidos
  const sizeMap = {
    small: { width: 40, height: 56, fontSize: "0.95rem", suitSize: "1.1rem" },
    normal: { width: 48, height: 67, fontSize: "1rem", suitSize: "1.2rem" },
    large: { width: 55, height: 77, fontSize: "1.1rem", suitSize: "1.3rem" },
  };

  // 🔥 CORRIGIDO: Fallback para "normal" se o size não existir
  const sizeConfig = sizeMap[size] || sizeMap.normal;

  // 🔥 DESIGN DAS CARTAS POR TEMA
  const getCardStyles = () => {
    if (faceDown) {
      // 🔥 Costas das cartas - DIFERENTE POR TEMA
      if (isDarkTheme) {
        return {
          background:
            "repeating-linear-gradient(45deg, #2b5797, #2b5797 10px, #1d3f6e 10px, #1d3f6e 20px)",
          border: "2px solid #1a3a6e",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          color: "rgba(255,255,255,0.3)",
        };
      } else {
        return {
          background: "linear-gradient(145deg, #e8e0d8, #d5ccc4)",
          border: "2px solid #c4b8ae",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          color: "rgba(0,0,0,0.15)",
        };
      }
    }

    return {
      background: isDarkTheme
        ? "linear-gradient(145deg, #ffffff, #f0ece8)"
        : "linear-gradient(145deg, #ffffff, #f8f5f0)",
      border: isDarkTheme ? "1px solid #ddd" : "1px solid #c4b8ae",
      boxShadow: isDarkTheme
        ? "0 4px 12px rgba(0,0,0,0.25)"
        : "0 6px 16px rgba(0,0,0,0.12)",
      color: isRed ? "#cc0000" : "#1f2a2f",
    };
  };

  const cardStyles = getCardStyles();

  // 🔥 CORRIGIDO: Calcular tamanhos em pixels para evitar NaN
  const fontSize = sizeConfig.fontSize;
  const suitSize = sizeConfig.suitSize;
  const suitSizeLarge = `calc(${suitSize} * 1.8)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: delay / 1000,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileHover={
        !faceDown ? { scale: 1.05, y: -4, transition: { duration: 0.2 } } : {}
      }
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: sizeConfig.width,
        height: sizeConfig.height,
        margin: "2px",
        borderRadius: 8,
        boxShadow:
          isHighlighted && !faceDown
            ? "0 0 20px rgba(255,215,0,0.5), 0 4px 16px rgba(0,0,0,0.2)"
            : cardStyles.boxShadow,
        flexShrink: 0,
        position: "relative",
        background: cardStyles.background,
        border: cardStyles.border,
        transition: "var(--transition-theme)",
        transform: isHighlighted && !faceDown ? "translateY(-4px)" : "none",
      }}
    >
      {faceDown ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            borderRadius: 6,
            background: cardStyles.background,
            position: "relative",
          }}
        >
          {!isDarkTheme && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 6,
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 10,
                  border: "1px solid rgba(0,0,0,0.04)",
                  borderRadius: 3,
                }}
              />
              <span
                style={{
                  fontSize: "1.2rem",
                  color: "rgba(0,0,0,0.08)",
                  fontWeight: 300,
                  letterSpacing: "2px",
                }}
              >
                ♠
              </span>
            </>
          )}
          {isDarkTheme && (
            <div
              style={{
                width: "60%",
                height: "60%",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "1.5rem", opacity: 0.1 }}>♠</span>
            </div>
          )}
        </div>
      ) : (
        <>
          <span
            style={{
              fontSize: fontSize,
              fontWeight: 800,
              color: cardStyles.color,
              lineHeight: 1,
              position: "absolute",
              top: 4,
              left: 6,
            }}
          >
            {rankDisplay}
          </span>
          <span
            style={{
              fontSize: suitSize,
              color: cardStyles.color,
              lineHeight: 1,
              position: "absolute",
              top: 18,
              left: 6,
            }}
          >
            {card.suit}
          </span>
          <span
            style={{
              fontSize: suitSize,
              color: cardStyles.color,
              lineHeight: 1,
              position: "absolute",
              bottom: 4,
              right: 6,
              transform: "rotate(180deg)",
            }}
          >
            {rankDisplay}
          </span>
          <span
            style={{
              fontSize: suitSize,
              color: cardStyles.color,
              lineHeight: 1,
              position: "absolute",
              bottom: 18,
              right: 6,
              transform: "rotate(180deg)",
            }}
          >
            {card.suit}
          </span>
          {/* 🔥 CORRIGIDO: Usar string para o fontSize */}
          <span
            style={{
              fontSize: suitSizeLarge,
              color: cardStyles.color,
              opacity: 0.15,
              lineHeight: 1,
            }}
          >
            {card.suit}
          </span>
        </>
      )}

      {isHighlighted && !faceDown && (
        <motion.div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: 10,
            border: "2px solid rgba(255,215,0,0.4)",
            boxShadow: "0 0 20px rgba(255,215,0,0.2)",
            pointerEvents: "none",
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
});

export default Card;
