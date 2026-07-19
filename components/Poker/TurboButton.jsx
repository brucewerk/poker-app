// components/Poker/TurboButton.jsx
"use client";

import { useState, useEffect } from "react";

export default function TurboButton({ onToggle, isTurbo: externalIsTurbo }) {
  const [isTurbo, setIsTurbo] = useState(externalIsTurbo || false);

  useEffect(() => {
    if (externalIsTurbo !== undefined) {
      setIsTurbo(externalIsTurbo);
    }
  }, [externalIsTurbo]);

  const toggleTurbo = () => {
    const newState = !isTurbo;
    setIsTurbo(newState);
    localStorage.setItem("turbo-mode", String(newState));
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <button
      onClick={toggleTurbo}
      style={buttonStyle(isTurbo)}
      title={isTurbo ? "Modo Turbo (Desativar)" : "Modo Turbo (Ativar)"}
    >
      {isTurbo ? "⚡" : "🐢"}
      {isTurbo && <span style={activeDotStyle()} />}
    </button>
  );
}

// ====================== ESTILOS ======================
function buttonStyle(isActive) {
  return {
    width: 44,
    height: 44,
    background: isActive ? "rgba(76,175,80,0.2)" : "rgba(0,0,0,0.6)",
    border: isActive
      ? "1px solid rgba(76,175,80,0.4)"
      : "1px solid rgba(255,255,255,0.2)",
    borderRadius: "50%",
    color: "white",
    fontSize: "1.2rem",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.3s ease",
    boxShadow: isActive ? "0 0 20px rgba(76,175,80,0.15)" : "none",
    position: "relative",
  };
}

function activeDotStyle() {
  return {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    background: "#4caf50",
    borderRadius: "50%",
    border: "2px solid #0a2f1f",
  };
}
