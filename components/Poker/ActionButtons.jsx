// components/Poker/ActionButtons.jsx
"use client";

import { useState, useEffect } from "react";

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
  cpuAction, // NOVO: Ação da CPU para feedback
}) {
  // NOVO: Estado para histórico de ações
  const [actionHistory, setActionHistory] = useState([]);
  const [isHovering, setIsHovering] = useState(null);

  // NOVO: Adicionar ação ao histórico
  const addActionToHistory = (action, amount = 0) => {
    const newAction = {
      action,
      amount,
      timestamp: Date.now(),
    };
    setActionHistory((prev) => [newAction, ...prev].slice(0, 5));
  };

  // NOVO: Acompanhar ação da CPU para feedback
  useEffect(() => {
    if (cpuAction) {
      addActionToHistory(cpuAction.action, cpuAction.amount);
    }
  }, [cpuAction]);

  // NOVO: Handler com feedback
  const handleAction = (action, callback, amount = 0) => {
    if (disabled) return;
    addActionToHistory(action, amount);
    callback();
  };

  // NOVO: Componente de histórico de ações
  const ActionHistory = () => {
    if (actionHistory.length === 0) return null;

    return (
      <div style={historyContainerStyle()}>
        <div style={historyLabelStyle()}>Últimas ações:</div>
        <div style={historyListStyle()}>
          {actionHistory.map((item, index) => (
            <span key={index} style={historyItemStyle(item.action)}>
              {item.action.toUpperCase()}
              {item.amount > 0 && ` R$ ${item.amount}`}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle()}>
      <div style={buttonsGridStyle()}>
        {/* Botão FOLD */}
        <button
          onClick={() => handleAction("fold", onFold)}
          disabled={disabled}
          style={buttonStyle("#f44336", disabled, isHovering === "fold")}
          onMouseEnter={() => setIsHovering("fold")}
          onMouseLeave={() => setIsHovering(null)}
        >
          <span style={buttonIconStyle()}>🏳️</span>
          DESISTIR
        </button>

        {/* Botão CALL/CHECK */}
        <button
          onClick={() =>
            handleAction(toCall <= 0 ? "check" : "call", onCall, toCall)
          }
          disabled={disabled}
          style={buttonStyle(
            toCall <= 0 ? "#2196F3" : "#4caf50",
            disabled,
            isHovering === "call",
          )}
          onMouseEnter={() => setIsHovering("call")}
          onMouseLeave={() => setIsHovering(null)}
        >
          <span style={buttonIconStyle()}>{toCall <= 0 ? "✅" : "💰"}</span>
          {toCall <= 0 ? "CHECK" : `PAGAR ${toCall}`}
        </button>

        {/* Botão RAISE */}
        <button
          onClick={() => handleAction("raise", onRaise, nextRaise)}
          disabled={!canRaise || disabled}
          style={buttonStyle(
            "#ff9800",
            !canRaise || disabled,
            isHovering === "raise",
          )}
          onMouseEnter={() => setIsHovering("raise")}
          onMouseLeave={() => setIsHovering(null)}
        >
          <span style={buttonIconStyle()}>📈</span>
          AUMENTAR {nextRaise}
        </button>

        {/* Botão ALL-IN */}
        <button
          onClick={() => handleAction("all-in", onAllIn)}
          disabled={disabled}
          style={buttonStyle("#e91e63", disabled, isHovering === "all-in")}
          onMouseEnter={() => setIsHovering("all-in")}
          onMouseLeave={() => setIsHovering(null)}
        >
          <span style={buttonIconStyle()}>⚡</span>
          ALL-IN
        </button>
      </div>

      {/* Botão RESET */}
      <button
        onClick={() => handleAction("reset", onReset)}
        style={resetButtonStyle(isHovering === "reset")}
        onMouseEnter={() => setIsHovering("reset")}
        onMouseLeave={() => setIsHovering(null)}
      >
        🔄 RENOVAR FICHAS
      </button>

      {/* Histórico de ações */}
      <ActionHistory />
    </div>
  );
}

// ====================== ESTILOS ======================

function containerStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
  };
}

function buttonsGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  };
}

function buttonStyle(color, disabled, hover) {
  return {
    background: disabled
      ? "#444"
      : hover
        ? `linear-gradient(145deg, ${adjustColor(color, 20)}, ${color})`
        : `linear-gradient(145deg, ${color}, ${adjustColor(color, -30)})`,
    border: "none",
    borderRadius: "12px",
    padding: "12px 8px",
    fontWeight: "bold",
    fontSize: "0.7rem",
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? "#888" : "white",
    boxShadow: disabled
      ? "none"
      : hover
        ? "0 6px 0 rgba(0,0,0,0.4)"
        : "0 4px 0 rgba(0,0,0,0.3)",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s ease",
    minWidth: "60px",
    textShadow: disabled ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    transform: hover && !disabled ? "translateY(-2px)" : "translateY(0)",
  };
}

function buttonIconStyle() {
  return {
    fontSize: "1.2rem",
  };
}

function resetButtonStyle(hover) {
  return {
    background: hover
      ? "radial-gradient(#f7d97c, #e6b800)"
      : "radial-gradient(#f7d97c, #d6a12e)",
    border: "none",
    borderRadius: "12px",
    padding: "10px 16px",
    fontWeight: "bold",
    fontSize: "0.75rem",
    cursor: "pointer",
    color: "#2e241f",
    boxShadow: hover ? "0 6px 0 #7a4c1a" : "0 4px 0 #7a4c1a",
    transition: "all 0.2s ease",
    minWidth: "70px",
    textShadow: "0 1px 2px rgba(255,255,255,0.3)",
    transform: hover ? "translateY(-2px)" : "translateY(0)",
  };
}

// NOVO: Estilos para histórico
function historyContainerStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "8px",
    marginTop: "4px",
    flexWrap: "wrap",
    justifyContent: "center",
  };
}

function historyLabelStyle() {
  return {
    color: "#aaa",
    fontSize: "0.65rem",
    fontWeight: "bold",
  };
}

function historyListStyle() {
  return {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  };
}

function historyItemStyle(action) {
  const colors = {
    fold: "#f44336",
    call: "#4caf50",
    check: "#2196F3",
    raise: "#ff9800",
    "all-in": "#e91e63",
    reset: "#d6a12e",
  };

  return {
    background: colors[action] || "#666",
    color: "white",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.6rem",
    fontWeight: "bold",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
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
