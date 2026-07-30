// components/Poker/MultiplayerButton.jsx - CORRIGIDO
"use client";

export default function MultiplayerButton({ onClick, isActive = false }) {
  return (
    <button
      onClick={onClick}
      className={`toolbar-btn ${isActive ? "toolbar-btn-active" : ""}`}
      title={isActive ? "Sair do Modo 2 Jogadores" : "Modo 2 Jogadores"}
    >
      👥
      {isActive && <span className="toolbar-dot toolbar-dot-green" />}
    </button>
  );
}
