// components/Poker/LevelDisplay.jsx
"use client";

import { useState, useEffect } from "react";

export default function LevelDisplay({ username }) {
  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchLevelData();
    }
  }, [username]);

  const fetchLevelData = async () => {
    try {
      const res = await fetch("/api/get-level");
      const data = await res.json();
      if (data.success) {
        setLevelData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar nível:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !levelData) {
    return (
      <div style={panelStyle()}>
        <p style={loadingStyle()}>Carregando nível...</p>
      </div>
    );
  }

  const { level, xp, xpToNextLevel, levelTitle, levelIcon, findings } =
    levelData;
  const progress = Math.min((xp / xpToNextLevel) * 100, 100);

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <span style={levelIconStyle()}>{levelIcon || "🎴"}</span>
        <div style={levelInfoStyle()}>
          <span style={levelNumberStyle()}>Nível {level}</span>
          <span style={levelTitleStyle()}>{levelTitle}</span>
        </div>
        {findings && findings.length > 0 && (
          <span style={findingsBadgeStyle()}>🏅 {findings.length}</span>
        )}
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
        <span>
          {xp} / {xpToNextLevel} XP
        </span>
        <span style={xpProgressStyle()}>{Math.round(progress)}%</span>
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
    padding: "12px 15px",
    color: "white",
    border: "1px solid rgba(255,215,0,0.2)",
    marginTop: "10px",
  };
}

function loadingStyle() {
  return {
    textAlign: "center",
    color: "#888",
    fontSize: "0.8rem",
    margin: "5px 0",
  };
}

function headerStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };
}

function levelIconStyle() {
  return {
    fontSize: "2rem",
  };
}

function levelInfoStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  };
}

function levelNumberStyle() {
  return {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "gold",
  };
}

function levelTitleStyle() {
  return {
    fontSize: "0.7rem",
    color: "#aaa",
  };
}

function findingsBadgeStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: "0.7rem",
    color: "gold",
    border: "1px solid rgba(255,215,0,0.2)",
  };
}

function xpBarStyle() {
  return {
    width: "100%",
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    marginTop: "8px",
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
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7rem",
    color: "#888",
    marginTop: "4px",
  };
}

function xpProgressStyle() {
  return {
    color: "gold",
  };
}
