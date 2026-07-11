// components/Poker/StatusPanel.jsx

export default function StatusPanel({
  stage,
  pot,
  currentBet,
  playerBet,
  cpuBet,
  nextRaise,
  notification,
  stageNames,
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        background: "#1a2a1ecc",
        backdropFilter: "blur(4px)",
        borderRadius: 30,
        padding: 15,
        color: "white",
      }}
    >
      <h3
        style={{
          color: "gold",
          margin: "0 0 15px",
          textAlign: "center",
          fontSize: "1rem",
        }}
      >
        📋 STATUS DA PARTIDA
      </h3>

      <div style={statusCardStyle()}>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>🎯 Fase:</span>{" "}
          {stageNames[stage] || stage}
        </p>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>💰 Pote:</span>{" "}
          {pot}
        </p>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>
            🎴 Aposta atual:
          </span>{" "}
          {currentBet}
        </p>
      </div>

      <div style={statusCardStyle()}>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>
            👤 Você apostou:
          </span>{" "}
          {playerBet}
        </p>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>
            🤖 CPU apostou:
          </span>{" "}
          {cpuBet}
        </p>
      </div>

      <div style={statusCardStyle()}>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>
            📈 Próximo raise:
          </span>{" "}
          +{nextRaise} fichas
        </p>
        <p style={statusPStyle()}>
          <span style={{ color: "gold", fontWeight: "bold" }}>⚡ All-in:</span>{" "}
          Apostar tudo
        </p>
      </div>

      {notification.visible && (
        <div
          style={{
            background: notification.isError
              ? "linear-gradient(135deg,#ff4444,#cc0000)"
              : "linear-gradient(135deg,#ffd700,#ff8c00)",
            borderRadius: 20,
            padding: 10,
            marginTop: 15,
            textAlign: "center",
            color: "#2e241f",
            fontWeight: "bold",
            fontSize: "0.8rem",
          }}
        >
          {notification.msg}
        </div>
      )}
    </div>
  );
}

function statusCardStyle() {
  return {
    background: "#0a1a0eaa",
    borderRadius: 20,
    padding: 10,
    marginBottom: 15,
  };
}

function statusPStyle() {
  return {
    margin: "5px 0",
    fontSize: "0.85rem",
    color: "#ffefb9",
    wordBreak: "break-word",
  };
}
