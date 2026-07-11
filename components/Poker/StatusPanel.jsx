// components/Poker/StatusPanel.jsx
"use client";

import { useState, useEffect } from "react";

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
}) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (winnerMsg && stage === "showdown") {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(0);
    }
  }, [winnerMsg, stage]);

  return (
    <div
      style={{
        background: "#1a2a1ecc",
        backdropFilter: "blur(4px)",
        borderRadius: 20,
        padding: 15,
        color: "white",
        border: "1px solid rgba(255,215,0,0.2)",
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
          {stage === "showdown" && winnerMsg && (
            <span
              style={{
                display: "block",
                color: "#ffd700",
                fontSize: "0.8rem",
                marginTop: "4px",
                fontWeight: "bold",
              }}
            >
              {winnerMsg}
            </span>
          )}
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

      {countdown > 0 && (
        <div
          style={{
            background: "rgba(255,215,0,0.15)",
            borderRadius: 15,
            padding: "10px",
            marginTop: "10px",
            textAlign: "center",
            border: "1px solid gold",
          }}
        >
          <span style={{ fontSize: "0.9rem", color: "#ffd700" }}>
            ⏳ Próxima mão em {countdown}s...
          </span>
        </div>
      )}

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
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
  };
}

function statusPStyle() {
  return {
    margin: "4px 0",
    fontSize: "0.85rem",
    color: "#ffefb9",
    wordBreak: "break-word",
  };
}
