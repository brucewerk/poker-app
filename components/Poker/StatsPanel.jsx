// components/Poker/StatsPanel.jsx
"use client";

import { useState, useEffect } from "react";

export default function StatsPanel({ username, onShowAchievements }) {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (username) {
      fetchStats();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [username]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch("/api/get-stats");
      const data = await res.json();

      if (data.success) {
        setStats(data.stats || {});
        setAchievements(data.achievements || []);
      } else {
        setError(true);
        console.error("Erro ao carregar estatísticas:", data.error);
      }
    } catch (error) {
      setError(true);
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Se não tem usuário ou erro, mostra mensagem amigável
  if (!username || error) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <p style={textStyle()}>
          Jogue algumas mãos para ver suas estatísticas!
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <p style={textStyle()}>Carregando estatísticas...</p>
      </div>
    );
  }

  // Se não tem dados, mostra mensagem
  if (!stats || stats.handsPlayed === 0) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <p style={textStyle()}>
          Jogue algumas mãos para ver suas estatísticas!
        </p>
      </div>
    );
  }

  const winRate =
    stats.winRate ||
    (stats.handsPlayed > 0
      ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
      : 0);
  const achievementCount = achievements.length;

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={toggleButtonStyle()}
        >
          {showDetails ? "▲" : "▼"}
        </button>
      </div>

      <div style={statsGridStyle()}>
        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>🎯 Mãos</span>
          <span style={statValueStyle()}>{stats.handsPlayed || 0}</span>
        </div>

        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>🏆 Vitórias</span>
          <span style={statValueStyle()}>{stats.handsWon || 0}</span>
        </div>

        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>📊 Taxa</span>
          <span style={statValueStyle(winRate > 50 ? "#4caf50" : "#ff9800")}>
            {winRate}%
          </span>
        </div>

        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>💰 Total</span>
          <span style={statValueStyle()}>${stats.totalChipsWon || 0}</span>
        </div>
      </div>

      {showDetails && (
        <div style={detailsStyle()}>
          <div style={detailRowStyle()}>
            <span>🔥 Maior vitória:</span>
            <span style={detailValueStyle()}>${stats.biggestWin || 0}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>📈 Melhor streak:</span>
            <span style={detailValueStyle()}>{stats.bestStreak || 0}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>🃏 Melhor mão:</span>
            <span style={detailValueStyle()}>{stats.bestHand || "-"}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>⚡ All-in wins:</span>
            <span style={detailValueStyle()}>{stats.allInWins || 0}</span>
          </div>
        </div>
      )}

      {achievementCount > 0 && (
        <div style={achievementsStyle()}>
          <div style={achievementHeaderStyle()}>
            <span>🏅 Conquistas: {achievementCount}</span>
            <button onClick={onShowAchievements} style={viewButtonStyle()}>
              Ver todas
            </button>
          </div>
          <div style={achievementBadgesStyle()}>
            {achievements.slice(0, 3).map((ach, i) => (
              <span key={i} style={badgeStyle()}>
                {ach.icon || "🏅"}
              </span>
            ))}
            {achievements.length > 3 && (
              <span style={badgeStyle()}>+{achievements.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS (mesmos de antes) ======================
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

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: "0 0 10px",
    fontSize: "1rem",
  };
}

function toggleButtonStyle() {
  return {
    background: "none",
    border: "none",
    color: "gold",
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "0 5px",
  };
}

function textStyle() {
  return {
    textAlign: "center",
    color: "#ffefb9",
    padding: "10px 0",
    fontSize: "0.85rem",
  };
}

function statsGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  };
}

function statItemStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "8px",
    borderRadius: 10,
    textAlign: "center",
  };
}

function statLabelStyle() {
  return {
    display: "block",
    fontSize: "0.7rem",
    color: "#aaa",
    marginBottom: "2px",
  };
}

function statValueStyle(color = "gold") {
  return {
    display: "block",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: color,
  };
}

function detailsStyle() {
  return {
    marginTop: "10px",
    padding: "10px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
  };
}

function detailRowStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: "0.85rem",
    color: "#ddd",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };
}

function detailValueStyle() {
  return {
    color: "gold",
    fontWeight: "bold",
  };
}

function achievementsStyle() {
  return {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,215,0,0.2)",
  };
}

function achievementHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.85rem",
    color: "#ddd",
  };
}

function viewButtonStyle() {
  return {
    background: "rgba(255,215,0,0.2)",
    border: "none",
    borderRadius: 15,
    padding: "4px 12px",
    color: "gold",
    fontSize: "0.75rem",
    cursor: "pointer",
  };
}

function achievementBadgesStyle() {
  return {
    display: "flex",
    gap: "5px",
    marginTop: "5px",
    flexWrap: "wrap",
  };
}

function badgeStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: "0.8rem",
    border: "1px solid rgba(255,215,0,0.2)",
  };
}
