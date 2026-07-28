// components/Poker/TournamentButton.jsx
"use client";

export default function TournamentButton({ onClick, isActive = false }) {
  return (
    <button
      onClick={onClick}
      className={`toolbar-btn toolbar-btn-tournament ${isActive ? "toolbar-btn-tournament-active" : ""}`}
      title={isActive ? "Torneios (Ativo)" : "Abrir Torneios"}
    >
      🏅
      {isActive && <span className="toolbar-dot toolbar-dot-gold" />}
    </button>
  );
}
