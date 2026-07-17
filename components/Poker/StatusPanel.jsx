// components/Poker/StatusPanel.jsx
"use client";

export default function StatusPanel({
  stage,
  pot,
  currentBet,
  playerBet,
  cpuBet,
  nextRaise,
  notification,
  stageNames,
  gameStatus,
  winnerMsg,
  isTurbo,
}) {
  return (
    <div style={panelStyle()}>
      <h3 style={titleStyle()}>📊 STATUS</h3>

      {notification?.visible && (
        <div
          style={{
            background: notification.isError
              ? "rgba(244,67,54,0.15)"
              : "rgba(76,175,80,0.15)",
            border: notification.isError
              ? "1px solid #f44336"
              : "1px solid #4caf50",
            borderRadius: 10,
            padding: "6px 10px",
            marginBottom: "8px",
            color: notification.isError ? "#f44336" : "#4caf50",
            fontSize: "0.8rem",
            textAlign: "center",
          }}
        >
          {notification.msg}
        </div>
      )}

      <div style={statusGridStyle()}>
        <div style={statusItemStyle()}>
          <span style={statusLabelStyle()}>🎯 Fase</span>
          <span style={statusValueStyle()}>
            {stageNames?.[stage] || stage || "Aguardando"}
          </span>
        </div>

        <div style={statusItemStyle()}>
          <span style={statusLabelStyle()}>💰 Pote</span>
          <span style={statusValueStyle()}>${pot || 0}</span>
        </div>

        <div style={statusItemStyle()}>
          <span style={statusLabelStyle()}>📊 Aposta</span>
          <span style={statusValueStyle()}>${currentBet || 0}</span>
        </div>

        <div style={statusItemStyle()}>
          <span style={statusLabelStyle()}>🚀 Modo</span>
          <span style={statusValueStyle(isTurbo ? "#ff9800" : "#4caf50")}>
            {isTurbo ? "Turbo" : "Normal"}
          </span>
        </div>
      </div>

      <div style={betsStyle()}>
        <span style={betStyle()}>👤 Você: ${playerBet || 0}</span>
        <span style={betStyle()}>🤖 CPU: ${cpuBet || 0}</span>
        {nextRaise > 0 && (
          <span style={nextRaiseStyle()}>Próximo aumento: ${nextRaise}</span>
        )}
      </div>

      {gameStatus && !winnerMsg && (
        <div style={gameStatusStyle()}>{gameStatus}</div>
      )}

      {winnerMsg && (
        <div
          style={{
            ...gameStatusStyle(),
            background: "rgba(255,215,0,0.15)",
            border: "1px solid gold",
            color: "gold",
            fontWeight: "bold",
          }}
        >
          {winnerMsg}
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================
function panelStyle() {
  return {
    background: "#1a2a1ecc",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    color: "white",
    border: "1px solid rgba(255,215,0,0.2)",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
  };
}

function statusGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  };
}

function statusItemStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "6px 8px",
    borderRadius: 10,
    textAlign: "center",
  };
}

function statusLabelStyle() {
  return {
    display: "block",
    fontSize: "0.65rem",
    color: "#aaa",
    marginBottom: "2px",
  };
}

function statusValueStyle(color = "#fff") {
  return {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: color,
  };
}

function betsStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
    fontSize: "0.75rem",
    color: "#aaa",
    flexWrap: "wrap",
    gap: "4px",
  };
}

function betStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "2px 10px",
    borderRadius: 10,
  };
}

function nextRaiseStyle() {
  return {
    background: "rgba(255,215,0,0.1)",
    padding: "2px 10px",
    borderRadius: 10,
    color: "gold",
  };
}

function gameStatusStyle() {
  return {
    marginTop: "8px",
    padding: "6px 10px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    fontSize: "0.8rem",
    textAlign: "center",
    color: "#ffefb9",
  };
}
