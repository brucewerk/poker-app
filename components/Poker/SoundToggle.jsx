// components/Poker/SoundToggle.jsx
"use client";

import { useState, useEffect } from "react";
import { soundManager } from "@/lib/sound.js";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Carregar sons quando o componente montar
    soundManager.loadSounds();
    // Recuperar preferência salva
    const saved = localStorage.getItem("sound-enabled");
    if (saved !== null) {
      const isEnabled = saved === "true";
      setEnabled(isEnabled);
      soundManager.enabled = isEnabled;
    }
  }, []);

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setEnabled(newState);
    localStorage.setItem("sound-enabled", String(newState));
  };

  return (
    <button
      onClick={toggleSound}
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        zIndex: 100,
        background: enabled ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)",
        color: "white",
        border: `2px solid ${enabled ? "#4caf50" : "#f44336"}`,
        borderRadius: "50%",
        width: 50,
        height: 50,
        fontSize: "1.5rem",
        cursor: "pointer",
        backdropFilter: "blur(4px)",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
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
      title={enabled ? "Sons ativados" : "Sons desativados"}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
