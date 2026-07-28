// components/Poker/OnlineButton.jsx - CORRIGIDO
"use client";

export default function OnlineButton({ onClick, isActive = false }) {
  return (
    <button
      onClick={onClick}
      className={`toolbar-btn ${isActive ? "toolbar-btn-online-active" : ""}`}
      title="Jogar Online"
    >
      🌐
      {isActive && <span className="toolbar-dot toolbar-dot-blue" />}
    </button>
  );
}
