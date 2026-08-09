// components/Poker/TurboButton.jsx - CORRIGIDO
"use client";

import { useState, useEffect } from "react";
import { safeSetItem } from "@/lib/safeStorage";

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
    safeSetItem("turbo-mode", String(newState));
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <button
      onClick={toggleTurbo}
      className={`toolbar-btn ${isTurbo ? "toolbar-btn-active" : ""}`}
      title={isTurbo ? "Modo Turbo (Desativar)" : "Modo Turbo (Ativar)"}
    >
      {isTurbo ? "⚡" : "🐢"}
      {isTurbo && <span className="toolbar-dot toolbar-dot-green" />}
    </button>
  );
}
