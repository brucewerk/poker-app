// components/Poker/AchievementsModal.jsx
"use client";

import { useState, useEffect } from "react";
import { ACHIEVEMENTS } from "@/lib/achievements";

export default function AchievementsModal({
  onClose,
  newAchievements = [],
  username,
}) {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayNewAchievements, setDisplayNewAchievements] =
    useState(newAchievements);

  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      setDisplayNewAchievements(newAchievements);
    }
  }, [newAchievements]);

  useEffect(() => {
    fetchAchievements();
    const interval = setInterval(fetchAchievements, 5000);
    return () => clearInterval(interval);
  }, [username]);

  const fetchAchievements = async () => {
    try {
      const url = username
        ? `/api/get-stats?username=${encodeURIComponent(username)}&t=${Date.now()}`
        : "/api/get-stats";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setAchievements(data.achievements || []);
        setStats(data.stats);
        if (data.newAchievements && data.newAchievements.length > 0) {
          setDisplayNewAchievements(data.newAchievements);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar conquistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedIds = achievements.map((a) => a.id);
  const totalCount = allAchievements.length;
  const unlockedCount = unlockedIds.length;

  if (loading) {
    return (
      <div style={overlayStyle()}>
        <div style={modalStyle()}>
          <h2 style={titleStyle()}>🏅 CONQUISTAS</h2>
          <p style={{ textAlign: "center", color: "#aaa" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle()}>
      <div style={modalStyle()}>
        <button onClick={onClose} style={closeButtonStyle()}>
          ✕
        </button>

        <h2 style={titleStyle()}>🏅 CONQUISTAS</h2>

        {displayNewAchievements.length > 0 && (
          <div style={newAchievementsStyle()}>
            <h3 style={{ color: "gold", margin: "0 0 10px" }}>
              🎉 Novas Conquistas!
            </h3>
            <div style={newAchievementListStyle()}>
              {displayNewAchievements.map((ach, i) => (
                <div key={i} style={newAchievementItemStyle()}>
                  <span style={achievementIconStyle()}>{ach.icon || "🏅"}</span>
                  <div>
                    <div style={achievementNameStyle(true)}>{ach.name}</div>
                    <div style={achievementDescStyle()}>{ach.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={progressStyle()}>
          <span style={{ color: "#ddd" }}>
            Progresso: {unlockedCount}/{totalCount}
          </span>
          <div style={progressBarStyle()}>
            <div
              style={{
                ...progressFillStyle(),
                width: `${(unlockedCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>

        <div style={achievementsListStyle()}>
          {allAchievements.map((ach) => {
            const unlocked = unlockedIds.includes(ach.id);
            return (
              <div key={ach.id} style={achievementItemStyle(unlocked)}>
                <span style={achievementIconStyle()}>
                  {unlocked ? ach.icon || "✅" : "🔒"}
                </span>
                <div style={achievementContentStyle()}>
                  <div style={achievementNameStyle(unlocked)}>
                    {ach.name}
                    {unlocked && " ✅"}
                  </div>
                  <div style={achievementDescStyle()}>{ach.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={buttonStyle()}>
          FECHAR
        </button>
      </div>
    </div>
  );
}

// ====================== ESTILOS ======================
function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20,
  };
}

function modalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 35px",
    borderRadius: 30,
    maxWidth: 600,
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
    color: "white",
    border: "2px solid gold",
    position: "relative",
  };
}

function closeButtonStyle() {
  return {
    position: "absolute",
    top: 15,
    right: 20,
    background: "none",
    border: "none",
    color: "white",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "5px",
  };
}

function titleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 20px",
    fontSize: "1.8rem",
  };
}

function progressStyle() {
  return {
    marginBottom: "20px",
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10,
  };
}

function progressBarStyle() {
  return {
    width: "100%",
    height: "8px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    marginTop: "5px",
    overflow: "hidden",
  };
}

function progressFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, gold, #ff8c00)",
    borderRadius: 10,
    transition: "width 0.5s ease",
  };
}

function achievementsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  };
}

function achievementItemStyle(unlocked) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 15px",
    borderRadius: 10,
    background: unlocked ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)",
    border: unlocked
      ? "1px solid rgba(255,215,0,0.3)"
      : "1px solid rgba(255,255,255,0.05)",
    opacity: unlocked ? 1 : 0.6,
  };
}

function achievementIconStyle() {
  return {
    fontSize: "1.5rem",
    minWidth: "40px",
    textAlign: "center",
  };
}

function achievementContentStyle() {
  return {
    flex: 1,
  };
}

function achievementNameStyle(unlocked) {
  return {
    fontWeight: "bold",
    color: unlocked ? "gold" : "#aaa",
    fontSize: "0.95rem",
  };
}

function achievementDescStyle() {
  return {
    fontSize: "0.8rem",
    color: "#ccc",
    marginTop: "2px",
  };
}

function newAchievementsStyle() {
  return {
    background: "rgba(255,215,0,0.12)",
    padding: "15px",
    borderRadius: 15,
    marginBottom: "20px",
    border: "2px solid gold",
    animation: "pulse 2s ease-in-out infinite",
  };
}

function newAchievementListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  };
}

function newAchievementItemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  };
}

function buttonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 30px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    width: "100%",
  };
}
