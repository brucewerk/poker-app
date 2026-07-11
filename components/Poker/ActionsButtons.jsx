// components/Poker/ActionButtons.jsx

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
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 20,
      }}
    >
      <button disabled={disabled} onClick={onFold} style={btnStyle(disabled)}>
        ❌ FOLD
      </button>
      <button disabled={disabled} onClick={onCall} style={btnStyle(disabled)}>
        💰 {!disabled && toCall > 0 ? `CALL (${toCall})` : "CALL"}
      </button>
      <button
        disabled={!canRaise}
        onClick={onRaise}
        style={btnStyle(!canRaise)}
      >
        📈 RAISE +{nextRaise}
      </button>
      <button
        disabled={disabled}
        onClick={onAllIn}
        style={{
          ...btnStyle(disabled),
          background: "radial-gradient(#e0852c,#b85c0e)",
          color: "white",
        }}
      >
        ⚡ ALL-IN
      </button>
      <button
        onClick={onReset}
        style={{
          ...btnStyle(false),
          background: "radial-gradient(#b34242,#6e1e1e)",
          color: "#ffddbb",
          boxShadow: "0 4px 0 #3e1515",
        }}
      >
        🔄 NOVA MÃO
      </button>
    </div>
  );
}

function btnStyle(disabled = false) {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "0.9rem",
    padding: "8px 20px",
    borderRadius: 60,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.5 : 1,
    minHeight: 44,
  };
}
