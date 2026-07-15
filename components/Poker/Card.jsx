// components/Poker/Card.jsx
"use client";

import { useState, useEffect } from "react";

export default function Card({
  card,
  faceDown = false,
  delay = 0,
  isRevealing = false,
}) {
  const [isVisible, setIsVisible] = useState(!isRevealing);
  const [isFlipped, setIsFlipped] = useState(faceDown);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isRevealing && faceDown) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsFlipped(false);
        setIsVisible(true);
        setTimeout(() => setIsAnimating(false), 400);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isRevealing, faceDown, delay]);

  // ✅ Estilo base com animação suave
  const baseStyle = {
    width: 70,
    height: 100,
    borderRadius: 10,
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 3px",
    flexShrink: 0,
    transition:
      "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transform: "translateZ(0)",
    willChange: "transform, opacity",
  };

  if (faceDown && isFlipped) {
    return (
      <div
        style={{
          ...baseStyle,
          background:
            "repeating-linear-gradient(45deg,#2b5797,#2b5797 15px,#1d3f6e 15px,#1d3f6e 30px)",
          boxShadow: "-2px 2px 8px rgba(0,0,0,0.5)",
          transform: isVisible
            ? "rotateY(0deg) scale(1)"
            : "rotateY(180deg) scale(0.8)",
          opacity: isVisible ? 1 : 0,
          animation: isAnimating ? "cardReveal 0.5s ease-out forwards" : "none",
        }}
      >
        <span
          style={{
            fontSize: "1.8rem",
            color: "#ffd966",
            fontWeight: "bold",
          }}
        >
          ?
        </span>
      </div>
    );
  }

  let rank = card.rank;
  if (rank === 11) rank = "J";
  if (rank === 12) rank = "Q";
  if (rank === 13) rank = "K";
  if (rank === 14) rank = "A";

  const isRed = card.suit === "♥" || card.suit === "♦";

  return (
    <div
      style={{
        ...baseStyle,
        background: "linear-gradient(145deg,#fff,#f8f4e8)",
        boxShadow: "-2px 2px 8px rgba(0,0,0,0.5)",
        color: isRed ? "#c33" : "#1f2a2f",
        fontWeight: "bold",
        transform: isVisible
          ? "rotateY(0deg) scale(1)"
          : "rotateY(180deg) scale(0.8)",
        opacity: isVisible ? 1 : 0,
        animation: isAnimating ? "cardReveal 0.5s ease-out forwards" : "none",
      }}
    >
      <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{rank}</div>
      <div style={{ fontSize: "2rem", lineHeight: 1 }}>{card.suit}</div>
    </div>
  );
}
