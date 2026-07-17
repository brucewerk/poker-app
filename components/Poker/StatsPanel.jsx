// components/Poker/StatsPanel.jsx
"use client";

import { useState, useEffect, useRef } from "react";

// components/Poker/StatsPanel.jsx - Adicione a prop refreshInterval
export default function StatsPanel({
  username,
  onShowAchievements,
  refreshInterval = 10000,
}) {
  // ...
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(false);
  const [lastAchievement, setLastAchievement] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (username) {
      fetchStats();
      intervalRef.current = setInterval(() => {
        if (username && mountedRef.current) fetchStats(true);
      }, refreshInterval); // 🔥 USAR A PROP
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [username, refreshInterval]);

  const fetchStats = async (silent = false) => {
    if (!username || !mountedRef.current) return;

    try {
      if (!silent) setLoading(true);
      setError(false);

      const url = `/api/get-stats?username=${encodeURIComponent(username)}&t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (data.success && mountedRef.current) {
        const newAchievements = data.newAchievements || [];

        // 🔥 VERIFICAR NOVAS CONQUISTAS
        if (newAchievements.length > 0 && !silent) {
          setLastAchievement(newAchievements[0]);

          // 🔥 DISPARAR EVENTO PARA ABRIR MODAL
          window.dispatchEvent(
            new CustomEvent("new-achievements", {
              detail: { achievements: newAchievements },
            }),
          );
        }

        setStats(data.stats || {});
        setAchievements(data.achievements || []);
      }
    } catch (error) {
      if (!silent) {
        setError(true);
        console.error("Erro ao carregar estatísticas:", error);
      }
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  };

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
        <p style={textStyle()}>Carregando...</p>
      </div>
    );
  }

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

      {lastAchievement && (
        <div style={achievementNotificationStyle()}>
          🏅 Nova conquista: {lastAchievement.name}!
        </div>
      )}

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

function achievementNotificationStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    border: "1px solid gold",
    borderRadius: 10,
    padding: "6px 10px",
    marginBottom: "8px",
    color: "gold",
    fontSize: "0.8rem",
    textAlign: "center",
    animation: "fadeIn 0.3s ease-out",
  };
}
