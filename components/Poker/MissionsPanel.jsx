// components/Poker/MissionsPanel.jsx
"use client";

import { useState, useEffect, useRef } from "react";

export default function MissionsPanel({ username, onChipsUpdated }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMissions, setShowMissions] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const intervalRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [claimedIds, setClaimedIds] = useState(new Set());

  // 🔥 CARREGAR MISSÕES
  const fetchMissions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(
        `/api/missions?username=${encodeURIComponent(username)}`,
      );
      const data = await res.json();

      if (data.success) {
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
        setCompletedCount(data.completedCount || 0);
        setTotalCount(data.totalCount || validMissions.length);

        // 🔥 ATUALIZAR SET DE IDs REIVINDICADOS
        const claimed = new Set(
          validMissions.filter((m) => m.claimed === true).map((m) => m.id),
        );
        setClaimedIds(claimed);

        // 🔥 VERIFICAR NOVAS MISSÕES COMPLETADAS
        if (!silent) {
          const newCompleted = validMissions.filter(
            (m) => m.completed && !m.claimed,
          );
          if (newCompleted.length > 0) {
            const names = newCompleted.map((m) => m.name).join(", ");
            setNotification(`🎉 Missões completadas: ${names}!`);
            setTimeout(() => setNotification(null), 5000);
          }
        }
      } else {
        setMissions([]);
      }
    } catch (error) {
      if (!silent) console.log("ℹ️ Erro ao carregar missões:", error);
      setMissions([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 🔥 INICIALIZAR
  useEffect(() => {
    if (username) {
      fetchMissions();
      startAutoRefresh();
    } else {
      setLoading(false);
    }

    const handleChipsUpdate = (event) => {
      if (event.detail?.chips !== undefined && onChipsUpdated) {
        onChipsUpdated(event.detail.chips);
      }
    };
    window.addEventListener("chips-updated", handleChipsUpdate);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("chips-updated", handleChipsUpdate);
    };
  }, [username]);

  const startAutoRefresh = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (username) fetchMissions(true);
    }, 10000);
  };

  // 🔥 REIVINDICAR RECOMPENSA
  const claimReward = async (missionId) => {
    // 🔥 VERIFICAR SE JÁ FOI REIVINDICADA
    if (claimedIds.has(missionId)) {
      setNotification("⚠️ Esta missão já foi reivindicada!");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (claiming) return;
    setClaiming(missionId);

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ missionId }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        setNotification("❌ Erro ao processar recompensa.");
        setTimeout(() => setNotification(null), 3000);
        setClaiming(null);
        return;
      }

      if (data.success) {
        // 🔥 ATUALIZAR ESTADO LOCAL IMEDIATAMENTE
        setClaimedIds((prev) => new Set([...prev, missionId]));

        // 🔥 ATUALIZAR MISSÃO LOCALMENTE
        setMissions((prev) =>
          prev.map((m) =>
            m.id === missionId ? { ...m, claimed: true, completed: true } : m,
          ),
        );

        // 🔥 ATUALIZAR FICHAS
        if (data.chips !== undefined && onChipsUpdated) {
          onChipsUpdated(data.chips);
        }

        window.dispatchEvent(
          new CustomEvent("chips-updated", {
            detail: { chips: data.chips },
          }),
        );

        setNotification(`🎉 ${data.message}`);
        setTimeout(() => setNotification(null), 5000);

        if (data.leveledUp) {
          setTimeout(() => {
            setNotification(`🎊 Subiu para Nível ${data.level}!`);
            setTimeout(() => setNotification(null), 5000);
          }, 1000);
        }

        // 🔥 FORÇAR RECARREGAMENTO PARA SINCRONIZAR
        setTimeout(() => fetchMissions(true), 100);
      } else {
        // 🔥 SE O SERVIDOR DISSE QUE JÁ FOI REIVINDICADA
        if (data.error?.includes("já foi reivindicada")) {
          setClaimedIds((prev) => new Set([...prev, missionId]));
          setMissions((prev) =>
            prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
          );
          setNotification("⚠️ Esta missão já foi reivindicada!");
          setTimeout(() => setNotification(null), 3000);
        } else {
          setNotification(`❌ ${data.error || "Erro ao reivindicar"}`);
          setTimeout(() => setNotification(null), 3000);
        }
      }
    } catch (error) {
      console.error("❌ Erro:", error);
      setNotification("❌ Erro de conexão. Tente novamente.");
      setTimeout(() => setNotification(null), 3000);
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
        <p style={emptyStyle()}>Nenhuma missão disponível.</p>
      </div>
    );
  }

  const completed = missions.filter((m) => m.completed).length;

  return (
    <div style={panelStyle()}>
      {notification && <div style={notificationStyle()}>{notification}</div>}

      <div style={headerStyle()}>
        <h3 style={titleStyle()}>🎯 MISSÕES DIÁRIAS</h3>
        <button
          onClick={() => setShowMissions(!showMissions)}
          style={toggleButtonStyle()}
        >
          {showMissions ? "▲" : "▼"} ({completed}/{missions.length})
        </button>
      </div>

      {showMissions && (
        <div style={missionsListStyle()}>
          {missions.map((mission, index) => {
            const isCompleted = mission.completed || false;
            // 🔥 VERIFICAR SE FOI REIVINDICADA (PELO ESTADO LOCAL OU PELO BANCO)
            const isClaimed = mission.claimed || claimedIds.has(mission.id);
            const progress = mission.progress || 0;
            const progressPercent = Math.round(progress * 100);
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
                    {isClaimed
                      ? "✅"
                      : isCompleted
                        ? "🎯"
                        : mission.icon || "📋"}
                  </span>
                  <span style={missionNameStyle(isCompleted)}>
                    {mission.name || "Missão"}
                  </span>
                  <span style={missionStatusStyle(isCompleted, isClaimed)}>
                    {isClaimed
                      ? "✅ Reivindicada"
                      : isCompleted
                        ? "🎉 Completada!"
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

                  {/* 🔥 BOTÃO SÓ APARECE SE COMPLETADA E NÃO REIVINDICADA */}
                  {isCompleted && !isClaimed && (
                    <button
                      onClick={() => claimReward(mission.id)}
                      disabled={claiming === mission.id}
                      style={claimButtonStyle(claiming === mission.id)}
                    >
                      {claiming === mission.id ? "⏳" : "🎁 Reivindicar"}
                    </button>
                  )}

                  {isClaimed && (
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
    position: "relative",
  };
}

function notificationStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    border: "1px solid gold",
    borderRadius: 10,
    padding: "8px 12px",
    marginBottom: "10px",
    color: "gold",
    fontSize: "0.85rem",
    textAlign: "center",
    animation: "fadeIn 0.3s ease-out",
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

function missionStatusStyle(isCompleted, isClaimed) {
  if (isClaimed) {
    return {
      fontSize: "0.75rem",
      color: "#4caf50",
      fontWeight: "bold",
    };
  }
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

function claimButtonStyle(isLoading) {
  return {
    background: isLoading ? "#666" : "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "0.7rem",
    padding: "4px 12px",
    borderRadius: 15,
    cursor: isLoading ? "not-allowed" : "pointer",
    boxShadow: isLoading ? "none" : "0 2px 0 #7a4c1a",
    color: isLoading ? "#888" : "#2e241f",
    marginLeft: "auto",
    opacity: isLoading ? 0.5 : 1,
    transition: "all 0.3s ease",
  };
}

function claimedStyle() {
  return {
    fontSize: "0.7rem",
    color: "#4caf50",
    marginLeft: "auto",
    fontWeight: "bold",
  };
}
