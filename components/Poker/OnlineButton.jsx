// components/Poker/OnlineButton.jsx
"use client";

export default function OnlineButton({ onClick, isActive = false }) {
  return (
    <button
      onClick={onClick}
      style={buttonStyle(isActive)}
      title="Jogar Online"
    >
      🌐
      {isActive && <span style={activeDotStyle("#2196f3")} />}
    </button>
  );
}

// ====================== ESTILOS ======================
function buttonStyle(isActive) {
  return {
    width: 44,
    height: 44,
    background: isActive ? "rgba(33,150,243,0.2)" : "rgba(0,0,0,0.6)",
    border: isActive
      ? "1px solid rgba(33,150,243,0.4)"
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
    background: color || "#2196f3",
    borderRadius: "50%",
    border: "2px solid #0a2f1f",
  };
}
