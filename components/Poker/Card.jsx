// components/Poker/Card.jsx - COM EFEITOS PREMIUM
"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCardDisplayName } from "@/lib/poker/deck.js";

const Card = memo(function Card({
  card,
  faceDown = false,
  delay = 0,
  isRevealing = false,
  size = "normal",
  onRevealComplete,
  isHighlighted = false,
}) {
  const [isFlipped, setIsFlipped] = useState(faceDown);
  const [isVisible, setIsVisible] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);

  const dimensions = useMemo(() => {
    const sizeMap = {
      small: { width: 50, height: 70, fontSize: "0.7rem" },
      normal: { width: 60, height: 85, fontSize: "0.8rem" },
      large: { width: 75, height: 105, fontSize: "1rem" },
    };
    return sizeMap[size] || sizeMap.normal;
  }, [size]);

  // Efeito de entrada com delay
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
    setIsVisible(true);
  }, [delay]);

  // Efeito de revelação
  useEffect(() => {
    if (isRevealing && faceDown) {
      const timer = setTimeout(() => {
        setIsFlipped(false);
        if (onRevealComplete) onRevealComplete();
      }, 300 + delay);
      return () => clearTimeout(timer);
    }
    setIsFlipped(faceDown);
  }, [faceDown, isRevealing, delay, onRevealComplete]);

  // Efeito de brilho para cartas altas
  useEffect(() => {
    if (card && (card.rank === 14 || card.rank === 13)) {
      const timer = setTimeout(() => setIsGlowing(true), 100);
      return () => clearTimeout(timer);
    }
  }, [card]);

  if (!card) {
    return <div style={cardPlaceholderStyle(dimensions)} />;
  }

  const isRed = card.suit === "♥" || card.suit === "♦";
  const displayName = getCardDisplayName(card);

  // Variantes de animação com efeitos premium
  const cardVariants = {
    hidden: {
      scale: 0.85,
      opacity: 0,
      rotateY: faceDown ? 180 : 0,
      y: -30,
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotateY: isFlipped ? 180 : 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: delay / 1000,
      },
    },
    flip: {
      rotateY: isFlipped ? 180 : 0,
      transition: {
        type: "spring",
        stiffness: 450,
        damping: 20,
      },
    },
    glow: {
      boxShadow: [
        "0 0 15px rgba(255,215,0,0.2)",
        "0 0 35px rgba(255,215,0,0.5)",
        "0 0 15px rgba(255,215,0,0.2)",
      ],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    highlight: {
      y: -8,
      scale: 1.05,
      boxShadow: "0 8px 30px rgba(255,215,0,0.4)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20,
      },
    },
  };

  const renderRank = useMemo(() => {
    const rank = card.rank;
    if (rank === 14) return "A";
    if (rank === 13) return "K";
    if (rank === 12) return "Q";
    if (rank === 11) return "J";
    if (rank === 10) return "10";
    return rank;
  }, [card.rank]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate={isHighlighted ? ["visible", "highlight"] : "visible"}
          variants={cardVariants}
          style={{
            ...cardContainerStyle(dimensions),
            perspective: "900px",
            willChange: "transform, opacity",
          }}
        >
          <motion.div
            animate={{
              rotateY: isFlipped ? 180 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
            style={{
              ...cardWrapperStyle(),
              willChange: "transform",
            }}
          >
            {/* Frente da carta com design premium */}
            <motion.div
              style={{
                ...cardFrontStyle(isRed, dimensions),
                backfaceVisibility: "hidden",
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 8,
              }}
              animate={isGlowing ? "glow" : {}}
              variants={cardVariants}
            >
              {/* Brilho premium no canto */}
              <div style={cardShineStyle()} />

              <div style={cardContentStyle()}>
                <div style={cardCornerStyle("top-left", isRed)}>
                  <span style={cardRankStyle(isRed, dimensions)}>
                    {renderRank}
                  </span>
                  <span style={cardSuitStyle(isRed)}>{card.suit}</span>
                </div>
                <div style={cardCenterStyle()}>
                  <span style={cardCenterSuitStyle(isRed, dimensions)}>
                    {card.suit}
                  </span>
                  {card.rank >= 11 && (
                    <span style={cardCenterRankStyle(isRed)}>{renderRank}</span>
                  )}
                </div>
                <div style={cardCornerStyle("bottom-right", isRed)}>
                  <span style={cardRankStyle(isRed, dimensions)}>
                    {renderRank}
                  </span>
                  <span style={cardSuitStyle(isRed)}>{card.suit}</span>
                </div>
              </div>
            </motion.div>

            {/* Verso da carta com design premium */}
            <motion.div
              style={{
                ...cardBackStyle(dimensions),
                backfaceVisibility: "hidden",
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 8,
                transform: "rotateY(180deg)",
              }}
            >
              {/* Padrão premium no verso */}
              <div style={cardBackPatternStyle()} />
              <div style={cardBackCenterStyle()}>♠</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ====================== ESTILOS PREMIUM ======================
function cardContainerStyle(dimensions) {
  return {
    display: "inline-block",
    width: dimensions.width,
    height: dimensions.height,
    margin: "0 4px",
    flexShrink: 0,
  };
}

function cardWrapperStyle() {
  return {
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
  };
}

function cardFrontStyle(isRed, dimensions) {
  return {
    background: isRed
      ? "linear-gradient(145deg, #ffffff, #f8f0f0)"
      : "linear-gradient(145deg, #ffffff, #f5f5f5)",
    border: "2px solid #ddd",
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    color: isRed ? "#cc0000" : "#000",
    fontSize: dimensions.fontSize,
    fontWeight: "bold",
    padding: "4px",
    position: "relative",
    overflow: "hidden",
  };
}

function cardShineStyle() {
  return {
    position: "absolute",
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    background:
      "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
    pointerEvents: "none",
    opacity: 0.3,
  };
}

function cardBackStyle(dimensions) {
  return {
    background: "linear-gradient(145deg, #1a3a6e, #2b5797)",
    border: "2px solid #1a3a6e",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    position: "relative",
    overflow: "hidden",
  };
}

function cardBackPatternStyle() {
  return {
    position: "absolute",
    inset: 0,
    background: `
      repeating-linear-gradient(
        45deg,
        rgba(255,255,255,0.05) 0px,
        rgba(255,255,255,0.05) 8px,
        rgba(255,255,255,0.02) 8px,
        rgba(255,255,255,0.02) 16px
      ),
      repeating-linear-gradient(
        -45deg,
        rgba(255,255,255,0.05) 0px,
        rgba(255,255,255,0.05) 8px,
        rgba(255,255,255,0.02) 8px,
        rgba(255,255,255,0.02) 16px
      )
    `,
    borderRadius: 6,
  };
}

function cardBackCenterStyle() {
  return {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "2rem",
    color: "rgba(255,255,255,0.15)",
    fontWeight: "bold",
  };
}

function cardContentStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    padding: "4px",
    position: "relative",
    zIndex: 1,
  };
}

function cardCornerStyle(position, isRed) {
  const posStyles = {
    "top-left": { top: 4, left: 4, alignItems: "flex-start" },
    "bottom-right": {
      bottom: 4,
      right: 4,
      alignItems: "flex-end",
      transform: "rotate(180deg)",
    },
  };
  return {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    ...posStyles[position],
    color: isRed ? "#cc0000" : "#000",
    lineHeight: 1,
  };
}

function cardRankStyle(isRed, dimensions) {
  return {
    fontSize: `calc(${dimensions.fontSize} * 1.2)`,
    fontWeight: "800",
    color: isRed ? "#cc0000" : "#000",
  };
}

function cardSuitStyle(isRed) {
  return {
    fontSize: "0.8rem",
    color: isRed ? "#cc0000" : "#000",
    marginTop: "-2px",
  };
}

function cardCenterStyle() {
  return {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };
}

function cardCenterSuitStyle(isRed, dimensions) {
  return {
    fontSize: `calc(${dimensions.fontSize} * 2.8)`,
    color: isRed ? "#cc0000" : "#000",
    opacity: 0.25,
    lineHeight: 1,
  };
}

function cardCenterRankStyle(isRed) {
  return {
    fontSize: "0.8rem",
    fontWeight: "800",
    color: isRed ? "#cc0000" : "#000",
    marginTop: "-4px",
    opacity: 0.5,
  };
}

function cardPlaceholderStyle(dimensions) {
  return {
    display: "inline-block",
    width: dimensions.width,
    height: dimensions.height,
    margin: "0 4px",
    opacity: 0,
    flexShrink: 0,
  };
}

export default Card;
