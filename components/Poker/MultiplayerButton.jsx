// components/Poker/MultiplayerButton.jsx
"use client";

export default function MultiplayerButton({ onClick, isActive = false }) {
  return (
    <button
      onClick={onClick}
      style={buttonStyle(isActive)}
      title="Modo 2 Jogadores"
    >
      👥
      {isActive && <span style={activeDotStyle("#4caf50")} />}
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
    position: "relative",
  };
}

function activeDotStyle(color) {
  return {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    background: color || "#4caf50",
    borderRadius: "50%",
    border: "2px solid #0a2f1f",
  };
}
