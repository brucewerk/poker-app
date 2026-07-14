// components/Poker/MissionsPanel.jsx
"use client";

import { useState, useEffect } from "react";

export default function MissionsPanel({ username }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMissions, setShowMissions] = useState(false);
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    if (username) {
      fetchMissions();
    }
  }, [username]);

  const fetchMissions = async () => {
    try {
      const res = await fetch("/api/missions");
      const data = await res.json();
      if (data.success) {
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error("Erro ao buscar missões:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (missionId) => {
    setClaiming(missionId);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (data.success) {
        // Atualizar a lista
        await fetchMissions();
        alert(`🎉 ${data.message}`);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao reivindicar recompensa:", error);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>🎯 MISSÕES DIÁRIAS</h3>
        <p style={emptyStyle()}>Carregando missões...</p>
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>🎯 MISSÕES DIÁRIAS</h3>
        <p style={emptyStyle()}>Nenhuma missão disponível hoje.</p>
      </div>
    );
  }

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <h3 style={titleStyle()}>🎯 MISSÕES DIÁRIAS</h3>
        <button
          onClick={() => setShowMissions(!showMissions)}
          style={toggleButtonStyle()}
        >
          {showMissions ? "▲" : "▼"} ({completedCount}/{totalCount})
        </button>
      </div>

      {showMissions && (
        <div style={missionsListStyle()}>
          {missions.map((mission, index) => {
            const isCompleted = mission.completed;
            const progress = mission.progress || 0;
            const progressPercent = Math.round(progress * 100);

            return (
              <div key={index} style={missionItemStyle(isCompleted)}>
                <div style={missionHeaderStyle()}>
                  <span style={missionIconStyle()}>
                    {isCompleted ? "✅" : mission.icon || "📋"}
                  </span>
                  <span style={missionNameStyle(isCompleted)}>
                    {mission.name}
                  </span>
                  <span style={missionStatusStyle(isCompleted)}>
                    {isCompleted
                      ? "Concluída"
                      : `${Math.min(mission.current || 0, mission.required)}/${mission.required}`}
                  </span>
                </div>

                <div style={missionDescStyle()}>{mission.description}</div>

                <div style={progressBarStyle()}>
                  <div
                    style={{
                      ...progressFillStyle(),
                      width: `${Math.min(progressPercent, 100)}%`,
                    }}
                  />
                </div>

                <div style={missionRewardsStyle()}>
                  {mission.xpReward > 0 && (
                    <span style={rewardBadgeStyle("xp")}>
                      ✨ +{mission.xpReward} XP
                    </span>
                  )}
                  {mission.chipsReward > 0 && (
                    <span style={rewardBadgeStyle("chips")}>
                      💰 +{mission.chipsReward}
                    </span>
                  )}
                  {isCompleted && !mission.claimed && (
                    <button
                      onClick={() => claimReward(mission.id)}
                      disabled={claiming === mission.id}
                      style={claimButtonStyle()}
                    >
                      {claiming === mission.id ? "⏳" : "🎁 Reivindicar"}
                    </button>
                  )}
                  {isCompleted && mission.claimed && (
                    <span style={claimedStyle()}>✅ Recompensa recebida</span>
                  )}
                </div>
              </div>
            );
          })}
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
    fontSize: "1rem",
    cursor: "pointer",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    color: "#888",
    fontSize: "0.85rem",
    padding: "10px 0",
  };
}

function missionsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto",
  };
}

function missionItemStyle(isCompleted) {
  return {
    background: isCompleted ? "rgba(76,175,80,0.1)" : "rgba(255,255,255,0.05)",
    border: isCompleted
      ? "1px solid rgba(76,175,80,0.3)"
      : "1px solid rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: "10px 12px",
    opacity: isCompleted ? 0.8 : 1,
  };
}

function missionHeaderStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  };
}

function missionIconStyle() {
  return {
    fontSize: "1.2rem",
  };
}

function missionNameStyle(isCompleted) {
  return {
    fontWeight: "bold",
    flex: 1,
    fontSize: "0.9rem",
    color: isCompleted ? "#4caf50" : "#fff",
  };
}

function missionStatusStyle(isCompleted) {
  return {
    fontSize: "0.75rem",
    color: isCompleted ? "#4caf50" : "#888",
  };
}

function missionDescStyle() {
  return {
    fontSize: "0.75rem",
    color: "#aaa",
    marginBottom: "5px",
  };
}

function progressBarStyle() {
  return {
    width: "100%",
    height: "4px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: "6px",
  };
}

function progressFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, #4caf50, gold)",
    borderRadius: 5,
    transition: "width 0.5s ease",
  };
}

function missionRewardsStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function rewardBadgeStyle(type) {
  const colors = {
    xp: "rgba(255,215,0,0.2)",
    chips: "rgba(76,175,80,0.2)",
  };
  const textColors = {
    xp: "gold",
    chips: "#4caf50",
  };
  return {
    background: colors[type] || "rgba(255,255,255,0.1)",
    color: textColors[type] || "#fff",
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: "0.7rem",
  };
}

function claimButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "0.7rem",
    padding: "4px 12px",
    borderRadius: 15,
    cursor: "pointer",
    boxShadow: "0 2px 0 #7a4c1a",
    color: "#2e241f",
    marginLeft: "auto",
  };
}

function claimedStyle() {
  return {
    fontSize: "0.7rem",
    color: "#4caf50",
    marginLeft: "auto",
  };
}
