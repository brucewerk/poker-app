// components/Poker/LiveStats.jsx
"use client";

import { useState, useEffect } from "react";

export default function LiveStats({ username }) {
  const [stats, setStats] = useState({
    onlinePlayers: 0,
    totalHands: 0,
    biggestPot: 0,
    topPlayer: null,
  });

  useEffect(() => {
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
    );

    ws.onopen = () => {
      console.log("🔌 Conectado ao WebSocket de stats");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "stats") {
          setStats(data.payload);
        }
      } catch (e) {
        console.error("Erro ao processar stats:", e);
      }
    };

    ws.onerror = (error) => {
      console.warn("⚠️ Erro no WebSocket de stats:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div style={containerStyle()}>
      <div style={statItemStyle()}>
        <span>🟢 Online</span>
        <span style={statValueStyle()}>{stats.onlinePlayers}</span>
      </div>
      <div style={statItemStyle()}>
        <span>🎯 Mãos Totais</span>
        <span style={statValueStyle()}>{stats.totalHands}</span>
      </div>
      <div style={statItemStyle()}>
        <span>💰 Maior Pote</span>
        <span style={statValueStyle()}>${stats.biggestPot}</span>
      </div>
    </div>
  );
}

function containerStyle() {
  return {
    display: "flex",
    gap: "15px",
    padding: "10px 15px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "12px",
    flexWrap: "wrap",
  };
}

function statItemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
  };
}

function statValueStyle() {
  return {
    fontWeight: "bold",
    color: "gold",
    fontSize: "0.9rem",
  };
}
