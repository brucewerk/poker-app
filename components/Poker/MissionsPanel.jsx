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
    } else {
      setLoading(false);
    }
  }, [username]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/missions?username=${encodeURIComponent(username)}`,
      );
      const data = await res.json();
      if (data.success) {
        // 🔥 Garantir que todas as missões tenham campos válidos
        const validMissions = (data.missions || []).map((m) => ({
          id: m.id || `mission_${Math.random().toString(36).substr(2, 9)}`,
          name: m.name || "Missão",
          description: m.description || "Complete a missão",
          icon: m.icon || "📋",
          completed: m.completed || false,
          claimed: m.claimed || false,
          progress: m.progress || 0,
          required: m.required || 5,
          current: m.current || 0,
          xpReward: m.xpReward || 50,
          chipsReward: m.chipsReward || 100,
        }));
        setMissions(validMissions);
      } else {
        // ✅ Se a API não existir, cria missões padrão
        console.log("ℹ️ API de missões não disponível, usando dados padrão");
        setMissions([
          {
            id: "mission_1",
            name: "Jogar 5 mãos",
            description: "Complete 5 mãos de poker",
            icon: "🎯",
            completed: false,
            claimed: false,
            progress: 0,
            required: 5,
            current: 0,
            xpReward: 50,
            chipsReward: 100,
          },
          {
            id: "mission_2",
            name: "Ganhar 3 mãos",
            description: "Vença 3 mãos contra a CPU",
            icon: "🏆",
            completed: false,
            claimed: false,
            progress: 0,
            required: 3,
            current: 0,
            xpReward: 100,
            chipsReward: 200,
          },
          {
            id: "mission_3",
            name: "Ganhar 500 fichas",
            description: "Acumule 500 fichas em vitórias",
            icon: "💰",
            completed: false,
            claimed: false,
            progress: 0,
            required: 500,
            current: 0,
            xpReward: 150,
            chipsReward: 300,
          },
        ]);
      }
    } catch (error) {
      // ✅ Em caso de erro, mostra missões padrão
      console.log("ℹ️ Erro ao carregar missões, usando dados padrão");
      setMissions([
        {
          id: "mission_1",
          name: "Jogar 5 mãos",
          description: "Complete 5 mãos de poker",
          icon: "🎯",
          completed: false,
          claimed: false,
          progress: 0,
          required: 5,
          current: 0,
          xpReward: 50,
          chipsReward: 100,
        },
        {
          id: "mission_2",
          name: "Ganhar 3 mãos",
          description: "Vença 3 mãos contra a CPU",
          icon: "🏆",
          completed: false,
          claimed: false,
          progress: 0,
          required: 3,
          current: 0,
          xpReward: 100,
          chipsReward: 200,
        },
      ]);
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
        await fetchMissions();
        alert(`🎉 ${data.message}`);
      } else {
        alert(`❌ ${data.error || "Erro ao reivindicar recompensa"}`);
      }
    } catch (error) {
      console.error("Erro ao reivindicar recompensa:", error);
      alert("❌ Erro ao reivindicar recompensa. Tente novamente.");
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
            const isCompleted = mission.completed || false;
            const progress = mission.progress || 0;
            const progressPercent = Math.round(progress * 100);

            // 🔥 Valores seguros para exibição
            const current = mission.current || 0;
            const required = mission.required || 5;
            const xpReward = mission.xpReward || 50;
            const chipsReward = mission.chipsReward || 100;

            return (
              <div
                key={mission.id || index}
                style={missionItemStyle(isCompleted)}
              >
                <div style={missionHeaderStyle()}>
                  <span style={missionIconStyle()}>
                    {isCompleted ? "✅" : mission.icon || "📋"}
                  </span>
                  <span style={missionNameStyle(isCompleted)}>
                    {mission.name || "Missão"}
                  </span>
                  <span style={missionStatusStyle(isCompleted)}>
                    {isCompleted
                      ? "Concluída"
                      : `${Math.min(current, required)}/${required}`}
                  </span>
                </div>

                <div style={missionDescStyle()}>
                  {mission.description || "Complete a missão"}
                </div>

                <div style={progressBarStyle()}>
                  <div
                    style={{
                      ...progressFillStyle(),
                      width: `${Math.min(progressPercent, 100)}%`,
                    }}
                  />
                </div>

                <div style={missionRewardsStyle()}>
                  {xpReward > 0 && (
                    <span style={rewardBadgeStyle("xp")}>
                      ✨ +{xpReward} XP
                    </span>
                  )}
                  {chipsReward > 0 && (
                    <span style={rewardBadgeStyle("chips")}>
                      💰 +{chipsReward}
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
