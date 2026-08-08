// components/Poker/GlobalRanking.jsx
"use client";

import { useState, useEffect } from "react";

export default function GlobalRanking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch("/api/ranking");
        const data = await res.json();
        if (data.success) {
          setRanking(data.ranking);
        }
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div style={containerStyle()}>
        <h3 style={titleStyle()}>🏆 RANKING GLOBAL</h3>
        <p style={{ textAlign: "center", color: "#666" }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle()}>
      <h3 style={titleStyle()}>🏆 RANKING GLOBAL</h3>
      <div style={listStyle()}>
        {ranking.slice(0, 10).map((player, index) => (
          <div key={player.username} style={itemStyle(index)}>
            <span style={positionStyle(index)}>#{index + 1}</span>
            <span style={nameStyle()}>{player.username}</span>
            <span style={chipsStyle()}>💰 {player.chips}</span>
            <span style={levelStyle()}>Nv. {player.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function containerStyle() {
  return {
    background: "var(--bg-panel)",
    borderRadius: 20,
    padding: 15,
    marginTop: 10,
    border: "1px solid var(--border-gold)",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
    fontWeight: "700",
    borderBottom: "2px solid var(--border-gold)",
    paddingBottom: 8,
  };
}

function listStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };
}

function itemStyle(index) {
  const colors = ["#ffd700", "#c0c0c0", "#cd7f32"];
  return {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 12px",
    background: index < 3 ? `rgba(255,215,0,0.05)` : "rgba(255,255,255,0.02)",
    borderRadius: 8,
    border:
      index < 3 ? `1px solid ${colors[index]}33` : "1px solid transparent",
  };
}

function positionStyle(index) {
  const colors = ["#ffd700", "#c0c0c0", "#cd7f32"];
  return {
    fontWeight: "bold",
    color: index < 3 ? colors[index] : "#666",
    minWidth: "30px",
    fontSize: "0.8rem",
  };
}

function nameStyle() {
  return {
    flex: 1,
    fontSize: "0.85rem",
    color: "var(--text-primary)",
  };
}

function chipsStyle() {
  return {
    color: "#4caf50",
    fontSize: "0.8rem",
    fontWeight: "bold",
  };
}

function levelStyle() {
  return {
    color: "gold",
    fontSize: "0.7rem",
  };
}
