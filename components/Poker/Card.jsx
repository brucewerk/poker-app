// components/Poker/Card.jsx - RESPONSIVO COM CLAMP() (corrigido)
"use client";

import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";

// ====================== ÍCONES DE NAIPE (SVG) ======================
// 🔥 NOTA: o SVG aceita APENAS número em width/height, não clamp().
// Por isso os tamanhos aqui são números fixos — quem escala é o CSS
// do container (via --card-width com clamp()).
function SuitIcon({ suit, size = 14, color }) {
  // Garante que size seja sempre número (fallback seguro)
  const safeSize = Number.isFinite(size) ? size : 14;

  const common = {
    width: safeSize,
    height: safeSize,
    viewBox: "0 0 32 32",
    style: { display: "block" },
  };

  switch (suit) {
    case "♥":
      return (
        <svg {...common}>
          <path
            fill={color}
            d="M16 28.5S3 20.7 3 12.2C3 7.2 6.9 4 11 4c2.6 0 4.5 1.3 5 3.1C16.5 5.3 18.4 4 21 4c4.1 0 8 3.2 8 8.2 0 8.5-13 16.3-13 16.3z"
          />
        </svg>
      );
    case "♦":
      return (
        <svg {...common}>
          <path fill={color} d="M16 2 L28 16 L16 30 L4 16 Z" />
        </svg>
      );
    case "♣":
      return (
        <svg {...common}>
          <path
            fill={color}
            d="M16 3a5.2 5.2 0 0 0-5.2 5.2c0 .5.07 1 .2 1.4A5.2 5.2 0 1 0 13.4 19.6c-.8 2.8-2.4 5-4.6 6.6h14.4c-2.2-1.6-3.8-3.8-4.6-6.6a5.2 5.2 0 1 0 2.4-10 5.4 5.4 0 0 0 .2-1.4A5.2 5.2 0 0 0 16 3z"
          />
        </svg>
      );
    case "♠":
    default:
      return (
        <svg {...common}>
          <path
            fill={color}
            d="M16 2c-3 6-11 10.5-11 17a6.3 6.3 0 0 0 10.4 4.8c-.6 2.4-1.9 4.3-3.7 5.7h8.6c-1.8-1.4-3.1-3.3-3.7-5.7A6.3 6.3 0 0 0 27 19c0-6.5-8-11-11-17z"
          />
        </svg>
      );
  }
}

const PIP_LAYOUTS = {
  2: [
    [50, 22],
    [50, 78],
  ],
  3: [
    [50, 18],
    [50, 50],
    [50, 82],
  ],
  4: [
    [30, 22],
    [70, 22],
    [30, 78],
    [70, 78],
  ],
  5: [
    [30, 22],
    [70, 22],
    [50, 50],
    [30, 78],
    [70, 78],
  ],
  6: [
    [30, 20],
    [70, 20],
    [30, 50],
    [70, 50],
    [30, 80],
    [70, 80],
  ],
  7: [
    [30, 16],
    [70, 16],
    [30, 42],
    [70, 42],
    [50, 30],
    [30, 84],
    [70, 84],
  ],
  8: [
    [30, 15],
    [70, 15],
    [30, 38],
    [70, 38],
    [50, 50],
    [30, 62],
    [70, 62],
    [30, 85],
    [70, 85],
  ],
  9: [
    [30, 14],
    [70, 14],
    [30, 36],
    [70, 36],
    [50, 50],
    [30, 64],
    [70, 64],
    [30, 86],
    [70, 86],
  ],
  10: [
    [30, 12],
    [70, 12],
    [30, 32],
    [70, 32],
    [30, 50],
    [70, 50],
    [30, 68],
    [70, 68],
    [30, 88],
    [70, 88],
  ],
};

const FACE_LABEL = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const FACE_NAME = { 11: "Valete", 12: "Rainha", 13: "Rei", 14: "Ás" };

// 🔥 TAMANHOS COM CLAMP — usados APENAS no CSS (width/height/fontSize)
// Os valores de SVG (indexSuit, pipSize, centerSuit) voltaram a ser NÚMEROS fixos.
const SIZE_MAP = {
  tiny: {
    width: "clamp(28px, 8vw, 40px)",
    height: "clamp(39px, 11.2vw, 56px)",
    indexFont: "clamp(0.42rem, 1.6vw, 0.55rem)",
    indexSuit: 7,
    pipSize: 7,
    centerSuit: 16,
  },
  small: {
    width: "clamp(34px, 9vw, 50px)",
    height: "clamp(48px, 12.6vw, 70px)",
    indexFont: "clamp(0.5rem, 1.8vw, 0.62rem)",
    indexSuit: 8,
    pipSize: 8,
    centerSuit: 18,
  },
  normal: {
    width: "clamp(38px, 10vw, 62px)",
    height: "clamp(53px, 14vw, 87px)",
    indexFont: "clamp(0.55rem, 2vw, 0.72rem)",
    indexSuit: 9,
    pipSize: 9,
    centerSuit: 22,
  },
  large: {
    width: "clamp(42px, 11vw, 74px)",
    height: "clamp(59px, 15.4vw, 103px)",
    indexFont: "clamp(0.6rem, 2.2vw, 0.82rem)",
    indexSuit: 10,
    pipSize: 10,
    centerSuit: 28,
  },
  board: {
    width: "clamp(36px, 9.5vw, 58px)",
    height: "clamp(50px, 13.3vw, 81px)",
    indexFont: "clamp(0.55rem, 2vw, 0.7rem)",
    indexSuit: 9,
    pipSize: 9,
    centerSuit: 24,
  },
};

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

  const rankRaw = card.value || card.rank;
  const isRed = card.suit === "♥" || card.suit === "♦";
  const suitColor = isRed ? "#d21313" : isDarkTheme ? "#1c2733" : "#14201c";
  const rankDisplay = FACE_LABEL[rankRaw] || String(rankRaw);
  const isFaceCard = rankRaw >= 11 && rankRaw <= 13;
  const isAce = rankRaw === 14;
  const pipPositions = PIP_LAYOUTS[rankRaw];

  const cfg = SIZE_MAP[size] || SIZE_MAP.normal;

  // ====================== VERSO DA CARTA ======================
  if (faceDown) {
    const backGrad = isDarkTheme
      ? "linear-gradient(135deg, #1a3d7a 0%, #0d2452 45%, #142d63 100%)"
      : "linear-gradient(135deg, #e9dfce 0%, #d7c8ab 45%, #ece1cb 100%)";
    const latticeColor = isDarkTheme
      ? "rgba(255,215,0,0.18)"
      : "rgba(90,60,20,0.14)";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          rotateY: isFlipping ? [0, 90, 0] : 0,
        }}
        transition={{
          delay: delay / 1000,
          type: "spring",
          stiffness: 400,
          damping: 25,
          rotateY: { duration: 0.55, ease: "easeInOut" },
        }}
        style={{
          display: "inline-flex",
          width: cfg.width,
          height: cfg.height,
          margin: "1px",
          borderRadius: "clamp(4px, 1vw, 8px)",
          flexShrink: 0,
          position: "relative",
          background: backGrad,
          border: isDarkTheme
            ? "1.5px solid rgba(255,215,0,0.35)"
            : "1.5px solid rgba(120,90,40,0.35)",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 2,
            borderRadius: "clamp(3px, 0.8vw, 5px)",
            border: `1px solid ${latticeColor}`,
            backgroundImage: `repeating-linear-gradient(45deg, ${latticeColor} 0, ${latticeColor} 1px, transparent 1px, transparent 6px), repeating-linear-gradient(-45deg, ${latticeColor} 0, ${latticeColor} 1px, transparent 1px, transparent 6px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.8rem, 3vw, 1.4rem)",
              opacity: isDarkTheme ? 0.55 : 0.4,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}
          >
            ♠
          </span>
        </div>
      </motion.div>
    );
  }

  // ====================== FRENTE DA CARTA ======================
  const faceBg = isDarkTheme
    ? "linear-gradient(160deg, #ffffff 0%, #f2efe8 100%)"
    : "linear-gradient(160deg, #ffffff 0%, #fbf8f0 100%)";

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
        y: -20,
        rotateY: isRevealing ? -90 : 0,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        rotateY: 0,
      }}
      transition={{
        delay: delay / 1000,
        type: "spring",
        stiffness: 380,
        damping: 24,
      }}
      whileHover={{ scale: 1.04, y: -3, transition: { duration: 0.15 } }}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        width: cfg.width,
        height: cfg.height,
        margin: "1px",
        borderRadius: "clamp(4px, 1vw, 8px)",
        flexShrink: 0,
        position: "relative",
        background: faceBg,
        border: isRed ? "1px solid #e3b8b8" : "1px solid #cfd4d0",
        boxShadow: isHighlighted
          ? "0 0 0 2px rgba(255,215,0,0.75), 0 0 18px rgba(255,215,0,0.55), 0 4px 12px rgba(0,0,0,0.3)"
          : "0 2px 8px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.15)",
        transformStyle: "preserve-3d",
        transition: "box-shadow 0.25s ease",
      }}
    >
      {/* Índice superior-esquerdo */}
      <div
        style={{
          position: "absolute",
          top: "clamp(1px, 0.5vw, 3px)",
          left: "clamp(2px, 0.7vw, 4px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
          color: suitColor,
        }}
      >
        <span style={{ fontSize: cfg.indexFont, fontWeight: 800 }}>
          {rankDisplay}
        </span>
        <SuitIcon suit={card.suit} size={cfg.indexSuit} color={suitColor} />
      </div>

      {/* Índice inferior-direito (invertido) */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(1px, 0.5vw, 3px)",
          right: "clamp(2px, 0.7vw, 4px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
          color: suitColor,
          transform: "rotate(180deg)",
        }}
      >
        <span style={{ fontSize: cfg.indexFont, fontWeight: 800 }}>
          {rankDisplay}
        </span>
        <SuitIcon suit={card.suit} size={cfg.indexSuit} color={suitColor} />
      </div>

      {/* Miolo da carta */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isAce && (
          <SuitIcon suit={card.suit} size={cfg.centerSuit} color={suitColor} />
        )}

        {isFaceCard && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              color: suitColor,
            }}
            title={FACE_NAME[rankRaw]}
          >
            <SuitIcon
              suit={card.suit}
              size={cfg.centerSuit * 0.8}
              color={suitColor}
            />
            <span
              style={{
                fontSize: "clamp(0.7rem, 2.5vw, 1.1rem)",
                fontWeight: 900,
                fontFamily: "Georgia, 'Times New Roman', serif",
                letterSpacing: "-0.5px",
                textShadow: "0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {rankDisplay}
            </span>
          </div>
        )}

        {pipPositions && (
          <div style={{ position: "absolute", inset: "12% 14%" }}>
            {pipPositions.map(([x, y], i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) ${y > 55 ? "rotate(180deg)" : ""}`,
                }}
              >
                <SuitIcon
                  suit={card.suit}
                  size={cfg.pipSize}
                  color={suitColor}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verniz sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "clamp(4px, 1vw, 8px)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%)",
          pointerEvents: "none",
        }}
      />

      {isHighlighted && (
        <motion.div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "clamp(6px, 1.3vw, 10px)",
            border: "2px solid rgba(255,215,0,0.5)",
            boxShadow: "0 0 18px rgba(255,215,0,0.35)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});

export default Card;
