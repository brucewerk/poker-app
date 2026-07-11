// components/Poker/TurboButton.jsx
"use client";

import { useState, useEffect } from "react";

export default function TurboButton({ onToggle, isTurbo }) {
  const [turbo, setTurbo] = useState(isTurbo || false);

  useEffect(() => {
    const saved = localStorage.getItem("turbo-mode");
    if (saved !== null) {
      const isTurboMode = saved === "true";
      setTurbo(isTurboMode);
      onToggle(isTurboMode);
    }
  }, []);

  const toggleTurbo = () => {
    const newState = !turbo;
    setTurbo(newState);
    localStorage.setItem("turbo-mode", String(newState));
    onToggle(newState);
  };

  return (
    <button
      onClick={toggleTurbo}
      style={{
        position: "fixed",
        bottom: 20,
        left: 80,
        zIndex: 100,
        background: turbo ? "rgba(255,152,0,0.4)" : "rgba(255,255,255,0.1)",
        color: "white",
        border: `2px solid ${turbo ? "#ff9800" : "rgba(255,255,255,0.3)"}`,
        borderRadius: "50%",
        width: 50,
        height: 50,
        fontSize: "1.3rem",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        transition: "all 0.3s ease",
        boxShadow: turbo
          ? "0 0 20px rgba(255,152,0,0.3)"
          : "0 4px 15px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "scale(1)";
      }}
      title={turbo ? "Modo Turbo: Ativado 🚀" : "Modo Turbo: Desativado"}
    >
      {turbo ? "🚀" : "🐢"}
    </button>
  );
}
