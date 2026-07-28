// components/Poker/MissionsPanel.jsx - COMPLETO COM CORREÇÃO DE CONTRASTE
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

        const claimed = new Set(
          validMissions.filter((m) => m.claimed === true).map((m) => m.id),
        );
        setClaimedIds(claimed);

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

  const claimReward = async (missionId) => {
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
        setClaimedIds((prev) => new Set([...prev, missionId]));

        setMissions((prev) =>
          prev.map((m) =>
            m.id === missionId ? { ...m, claimed: true, completed: true } : m,
          ),
        );

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

        setTimeout(() => fetchMissions(true), 100);
      } else {
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
      <div
        className="missions-card"
        style={{
          background: "var(--bg-panel)",
          backdropFilter: "blur(4px)",
          borderRadius: 20,
          padding: 15,
          marginTop: 10,
          color: "var(--text-primary)",
          border: "1px solid var(--border-gold)",
          transition: "var(--transition-theme)",
        }}
      >
        <h3
          className="card-title"
          style={{
            color: "gold",
            margin: "0 0 10px",
            fontSize: "1rem",
            fontWeight: "700",
            borderBottom: "2px solid var(--border-gold)",
            paddingBottom: 8,
            transition: "var(--transition-theme)",
          }}
        >
          🎯 MISSÕES DIÁRIAS
        </h3>
        <p style={emptyStyle()}>Carregando missões...</p>
      </div>
    );
  }

  if (!missions || missions.length === 0) {
    return (
      <div
        className="missions-card"
        style={{
          background: "var(--bg-panel)",
          backdropFilter: "blur(4px)",
          borderRadius: 20,
          padding: 15,
          marginTop: 10,
          color: "var(--text-primary)",
          border: "1px solid var(--border-gold)",
          transition: "var(--transition-theme)",
        }}
      >
        <h3
          className="card-title"
          style={{
            color: "gold",
            margin: "0 0 10px",
            fontSize: "1rem",
            fontWeight: "700",
            borderBottom: "2px solid var(--border-gold)",
            paddingBottom: 8,
            transition: "var(--transition-theme)",
          }}
        >
          🎯 MISSÕES DIÁRIAS
        </h3>
        <p style={emptyStyle()}>Nenhuma missão disponível.</p>
      </div>
    );
  }

  const completed = missions.filter((m) => m.completed).length;

  return (
    <div
      className="missions-card"
      style={{
        background: "var(--bg-panel)",
        backdropFilter: "blur(4px)",
        borderRadius: 20,
        padding: 15,
        marginTop: 10,
        color: "var(--text-primary)",
        border: "1px solid var(--border-gold)",
        transition: "var(--transition-theme)",
        position: "relative",
      }}
    >
      {notification && (
        <div
          style={{
            background: "rgba(255,215,0,0.15)",
            border: "1px solid gold",
            borderRadius: 10,
            padding: "8px 12px",
            marginBottom: "10px",
            color: "gold",
            fontSize: "0.85rem",
            textAlign: "center",
            animation: "fadeIn 0.3s ease-out",
            transition: "var(--transition-theme)",
          }}
        >
          {notification}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          className="card-title"
          style={{
            color: "gold",
            margin: "0 0 10px",
            fontSize: "1rem",
            fontWeight: "700",
            borderBottom: "2px solid var(--border-gold)",
            paddingBottom: 8,
            transition: "var(--transition-theme)",
          }}
        >
          🎯 MISSÕES DIÁRIAS
        </h3>
        <button
          onClick={() => setShowMissions(!showMissions)}
          style={{
            background: "none",
            border: "none",
            color: "gold",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "var(--transition-theme)",
          }}
        >
          {showMissions ? "▲" : "▼"} ({completed}/{missions.length})
        </button>
      </div>

      {showMissions && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {missions.map((mission, index) => {
            const isCompleted = mission.completed || false;
            const isClaimed = mission.claimed || claimedIds.has(mission.id);
            const progress = mission.progress || 0;
            const progressPercent = Math.round(progress * 100);
            const current = mission.current || 0;
            const required = mission.required || 5;
            const xpReward = mission.xpReward || 50;
            const chipsReward = mission.chipsReward || 100;

            return (
              <div
                key={mission.id || `mission-${index}-${mission.name}`}
                style={{
                  background: isCompleted
                    ? "rgba(76,175,80,0.1)"
                    : "rgba(255,255,255,0.05)",
                  border: isCompleted
                    ? "1px solid rgba(76,175,80,0.3)"
                    : "1px solid var(--border-light)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  opacity: isCompleted ? 0.8 : 1,
                  transition: "var(--transition-theme)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>
                    {isClaimed
                      ? "✅"
                      : isCompleted
                        ? "🎯"
                        : mission.icon || "📋"}
                  </span>
                  <span
                    style={{
                      fontWeight: "bold",
                      flex: 1,
                      fontSize: "0.9rem",
                      color: isCompleted ? "#4caf50" : "var(--text-primary)",
                      transition: "var(--transition-theme)",
                    }}
                  >
                    {mission.name || "Missão"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: isClaimed
                        ? "#4caf50"
                        : isCompleted
                          ? "#4caf50"
                          : "var(--text-muted)",
                      fontWeight: isClaimed ? "bold" : "normal",
                      transition: "var(--transition-theme)",
                    }}
                  >
                    {isClaimed
                      ? "✅ Reivindicada"
                      : isCompleted
                        ? "🎉 Completada!"
                        : `${Math.min(current, required)}/${required}`}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "5px",
                    transition: "var(--transition-theme)",
                  }}
                >
                  {mission.description || "Complete a missão"}
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 5,
                    overflow: "hidden",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #4caf50, gold)",
                      borderRadius: 5,
                      transition: "width 0.5s ease",
                      width: `${Math.min(progressPercent, 100)}%`,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {xpReward > 0 && (
                    <span
                      style={{
                        background: "rgba(255,215,0,0.2)",
                        color: "gold",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: "0.7rem",
                        transition: "var(--transition-theme)",
                      }}
                    >
                      ✨ +{xpReward} XP
                    </span>
                  )}
                  {chipsReward > 0 && (
                    <span
                      style={{
                        background: "rgba(76,175,80,0.2)",
                        color: "#4caf50",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: "0.7rem",
                        transition: "var(--transition-theme)",
                      }}
                    >
                      💰 +{chipsReward}
                    </span>
                  )}

                  {isCompleted && !isClaimed && (
                    <button
                      onClick={() => claimReward(mission.id)}
                      disabled={claiming === mission.id}
                      style={{
                        background:
                          claiming === mission.id
                            ? "#666"
                            : "radial-gradient(#f7d97c,#d6a12e)",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "0.7rem",
                        padding: "4px 12px",
                        borderRadius: 15,
                        cursor:
                          claiming === mission.id ? "not-allowed" : "pointer",
                        boxShadow:
                          claiming === mission.id ? "none" : "0 2px 0 #7a4c1a",
                        color: claiming === mission.id ? "#888" : "#2e241f",
                        marginLeft: "auto",
                        opacity: claiming === mission.id ? 0.5 : 1,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {claiming === mission.id ? "⏳" : "🎁 Reivindicar"}
                    </button>
                  )}

                  {isClaimed && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#4caf50",
                        marginLeft: "auto",
                        fontWeight: "bold",
                      }}
                    >
                      ✅ Recompensa recebida
                    </span>
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
function emptyStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    padding: "10px 0",
  };
}
