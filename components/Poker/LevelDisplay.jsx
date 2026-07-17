// components/Poker/LevelDisplay.jsx
"use client";

import { useState, useEffect } from "react";

export default function LevelDisplay({
  username,
  onShowAchievements,
  onShowFindings,
  isResultModalOpen = false,
}) {
  const [levelInfo, setLevelInfo] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    levelTitle: "Iniciante",
    levelIcon: "🎴",
    findings: [],
    findingsCount: 0,
    achievements: [],
    achievementsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLevelInfo = async () => {
    if (!username) return;

    try {
      const res = await fetch(
        `/api/get-level?username=${encodeURIComponent(username)}&t=${Date.now()}`,
      );
      const data = await res.json();
      if (data.success) {
        setLevelInfo({
          level: data.level || 1,
          xp: data.xp || 0,
          xpToNextLevel: data.xpToNextLevel || 100,
          levelTitle: data.levelTitle || "Iniciante",
          levelIcon: data.levelIcon || "🎴",
          findings: data.findings || [],
          findingsCount: data.findingsCount || 0,
          achievements: data.achievements || [],
          achievementsCount: data.achievementsCount || 0,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar nível:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchLevelInfo();
    }
  }, [username]);

  useEffect(() => {
    const handleLevelUpdate = () => {
      fetchLevelInfo();
    };

    window.addEventListener("level-updated", handleLevelUpdate);
    window.addEventListener("chips-updated", handleLevelUpdate);

    return () => {
      window.removeEventListener("level-updated", handleLevelUpdate);
      window.removeEventListener("chips-updated", handleLevelUpdate);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isResultModalOpen) {
        return;
      }
      if (username) {
        fetchLevelInfo();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [username, isResultModalOpen]);

  if (loading) {
    return (
      <div style={panelStyle()}>
        <div style={levelStyle()}>
          <span style={iconStyle()}>🎴</span>
          <span style={levelTextStyle()}>Nível 1</span>
        </div>
      </div>
    );
  }

  const progress = Math.min(
    (levelInfo.xp / levelInfo.xpToNextLevel) * 100,
    100,
  );

  return (
    <div style={panelStyle()}>
      <div style={levelStyle()}>
        <span style={iconStyle()}>{levelInfo.levelIcon}</span>
        <span style={levelTextStyle()}>Nível {levelInfo.level}</span>
        <span style={titleStyle()}>{levelInfo.levelTitle}</span>
      </div>

      <div style={xpBarStyle()}>
        <div
          style={{
            ...xpFillStyle(),
            width: `${progress}%`,
          }}
        />
      </div>

      <div style={xpTextStyle()}>
        {levelInfo.xp} / {levelInfo.xpToNextLevel} XP
      </div>

      <div style={badgesStyle()}>
        <button
          onClick={() => {
            if (onShowAchievements) {
              onShowAchievements();
            }
          }}
          style={badgeButtonStyle()}
        >
          🏅 {levelInfo.achievementsCount || 0} conquistas
        </button>
        <button
          onClick={() => {
            if (onShowFindings) {
              onShowFindings();
            }
          }}
          style={badgeButtonStyle()}
        >
          🔍 {levelInfo.findingsCount || 0} achados
        </button>
      </div>
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

function levelStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  };
}

function iconStyle() {
  return {
    fontSize: "1.5rem",
  };
}

function levelTextStyle() {
  return {
    fontWeight: "bold",
    fontSize: "1.1rem",
    color: "gold",
  };
}

function titleStyle() {
  return {
    fontSize: "0.8rem",
    color: "#aaa",
    marginLeft: "auto",
  };
}

function xpBarStyle() {
  return {
    width: "100%",
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    overflow: "hidden",
  };
}

function xpFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, #4caf50, gold)",
    borderRadius: 10,
    transition: "width 0.5s ease",
  };
}

function xpTextStyle() {
  return {
    fontSize: "0.7rem",
    color: "#888",
    textAlign: "center",
    marginTop: "4px",
  };
}

function badgesStyle() {
  return {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    flexWrap: "wrap",
  };
}

function badgeButtonStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: "0.7rem",
    color: "#aaa",
    border: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}
