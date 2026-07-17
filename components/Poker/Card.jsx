// components/Poker/Card.jsx
"use client";

import { useState, useEffect } from "react";
import { getCardDisplayName, getCardColor } from "@/lib/poker/deck.js";

export default function Card({
  card,
  faceDown = false,
  delay = 0,
  isRevealing = false,
}) {
  const [isFlipped, setIsFlipped] = useState(faceDown);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
    setIsVisible(true);
  }, [delay]);

  useEffect(() => {
    if (isRevealing && faceDown) {
      const timer = setTimeout(() => setIsFlipped(false), 300);
      return () => clearTimeout(timer);
    }
    setIsFlipped(faceDown);
  }, [faceDown, isRevealing]);

  if (!isVisible) {
    return <div style={cardPlaceholderStyle()} />;
  }

  const isRed = card && (card.suit === "♥" || card.suit === "♦");
  const displayName = card ? getCardDisplayName(card) : "???";

  return (
    <div style={cardContainerStyle(isFlipped)}>
      {isFlipped ? (
        <div style={cardBackStyle()} />
      ) : (
        <div style={cardFrontStyle(isRed)}>
          <div style={cardContentStyle()}>
            <span style={cardRankStyle(isRed)}>{card?.rank || "?"}</span>
            <span style={cardSuitStyle(isRed)}>{card?.suit || "?"}</span>
            <span style={cardDisplayNameStyle()}>{displayName}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================
function cardContainerStyle(isFlipped) {
  return {
    display: "inline-block",
    width: 60,
    height: 85,
    margin: "0 3px",
    perspective: "600px",
    transition: "transform 0.3s ease",
  };
}

function cardBackStyle() {
  return {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    background:
      "repeating-linear-gradient(45deg, #2b5797, #2b5797 12px, #1d3f6e 12px, #1d3f6e 24px)",
    border: "2px solid #1a3a6e",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    position: "relative",
  };
}

function cardFrontStyle(isRed) {
  return {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    background: "#fff",
    border: "2px solid #ccc",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    color: isRed ? "#cc0000" : "#000",
    fontSize: "0.8rem",
    fontWeight: "bold",
    padding: "4px",
  };
}

function cardContentStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  };
}

function cardRankStyle(isRed) {
  return {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: isRed ? "#cc0000" : "#000",
    lineHeight: 1,
  };
}

function cardSuitStyle(isRed) {
  return {
    fontSize: "1.5rem",
    color: isRed ? "#cc0000" : "#000",
    lineHeight: 1,
  };
}

function cardDisplayNameStyle() {
  return {
    fontSize: "0.45rem",
    color: "#666",
    marginTop: "2px",
    textAlign: "center",
    fontWeight: "normal",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

function cardPlaceholderStyle() {
  return {
    display: "inline-block",
    width: 60,
    height: 85,
    margin: "0 3px",
    opacity: 0,
  };
}
