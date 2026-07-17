// components/Poker/ActionButtons.jsx
"use client";

export default function ActionButtons({
  disabled,
  canRaise,
  toCall,
  nextRaise,
  onFold,
  onCall,
  onRaise,
  onAllIn,
  onReset,
}) {
  return (
    <div style={containerStyle()}>
      <button
        onClick={onFold}
        disabled={disabled}
        style={buttonStyle("#f44336", disabled)}
      >
        DESISTIR
      </button>

      <button
        onClick={onCall}
        disabled={disabled}
        style={buttonStyle("#4caf50", disabled)}
      >
        {toCall <= 0 ? "✅ CHECK" : `💰 PAGAR ${toCall}`}
      </button>

      <button
        onClick={onRaise}
        disabled={!canRaise || disabled}
        style={buttonStyle("#ff9800", !canRaise || disabled)}
      >
        📈 AUMENTAR {nextRaise}
      </button>

      <button
        onClick={onAllIn}
        disabled={disabled}
        style={buttonStyle("#e91e63", disabled)}
      >
        ⚡ ALL-IN
      </button>

      <button onClick={onReset} style={resetButtonStyle()}>
        🔄 RENOVAR FICHAS
      </button>
    </div>
  );
}

// ====================== ESTILOS ======================
function containerStyle() {
  return {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "12px",
    justifyContent: "center",
  };
}

function buttonStyle(color, disabled) {
  return {
    background: disabled
      ? "#444"
      : `linear-gradient(145deg, ${color}, ${adjustColor(color, -30)})`,
    border: "none",
    borderRadius: 30,
    padding: "8px 16px",
    fontWeight: "bold",
    fontSize: "0.75rem",
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? "#888" : "white",
    boxShadow: disabled ? "none" : "0 4px 0 rgba(0,0,0,0.3)",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s ease",
    minWidth: "70px",
    textShadow: disabled ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
    flex: 1,
  };
}

function resetButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    borderRadius: 30,
    padding: "8px 16px",
    fontWeight: "bold",
    fontSize: "0.75rem",
    cursor: "pointer",
    color: "#2e241f",
    boxShadow: "0 4px 0 #7a4c1a",
    transition: "all 0.2s ease",
    minWidth: "70px",
    textShadow: "0 1px 2px rgba(255,255,255,0.3)",
    flex: 1,
  };
}

function adjustColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
