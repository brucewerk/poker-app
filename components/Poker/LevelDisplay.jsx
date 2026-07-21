// components/Poker/LevelDisplay.jsx - CORREÇÃO DO "Failed to fetch"
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
  const [showLevelUp, setShowLevelUp] = useState(false);
  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const intervalRef = useRef(null);

  const fetchLevelInfo = async () => {
    // 🔥 CORREÇÃO: Verificar se está montado, se tem username e se não está em fetch
    if (!isMounted.current || !username || isFetching.current) {
      return;
    }

    isFetching.current = true;

    try {
      const url = `/api/get-level?username=${encodeURIComponent(username)}&t=${Date.now()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!isMounted.current) return;

      if (data.success) {
        const oldLevel = levelInfo.level;
        const newLevelInfo = {
          level: data.level || 1,
          xp: data.xp || 0,
          xpToNextLevel: data.xpToNextLevel || 100,
          levelTitle: data.levelTitle || "Iniciante",
          levelIcon: data.levelIcon || "🎴",
          findings: data.findings || [],
          findingsCount: data.findingsCount || 0,
          achievements: data.achievements || [],
          achievementsCount: data.achievementsCount || 0,
        };

        if (newLevelInfo.level > oldLevel && oldLevel > 0) {
          setShowLevelUp(true);
          setTimeout(() => {
            if (isMounted.current) setShowLevelUp(false);
          }, 3000);
        }

        setLevelInfo(newLevelInfo);
      }
    } catch (error) {
      // 🔥 SILENCIAR ERROS DE FETCH PARA EVITAR POLUIÇÃO DO CONSOLE
      if (error.name !== "AbortError") {
        // Só loga erros que não são de abort
      }
    } finally {
      if (isMounted.current) {
        isFetching.current = false;
        setLoading(false);
      }
    }
  };

  // 🔥 BUSCAR DADOS INICIALMENTE (APENAS QUANDO USERNAME EXISTIR)
  useEffect(() => {
    isMounted.current = true;

    if (username) {
      fetchLevelInfo();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username]);

  // 🔥 OUVIR EVENTOS DE ATUALIZAÇÃO
  useEffect(() => {
    if (!username) return;

    const handleUpdate = () => {
      if (isMounted.current) {
        fetchLevelInfo();
      }
    };

    window.addEventListener("level-updated", handleUpdate);
    window.addEventListener("chips-updated", handleUpdate);
    window.addEventListener("new-achievements", handleUpdate);

    return () => {
      window.removeEventListener("level-updated", handleUpdate);
      window.removeEventListener("chips-updated", handleUpdate);
      window.removeEventListener("new-achievements", handleUpdate);
    };
  }, [username]);

  // 🔥 ATUALIZAR QUANDO O MODAL DE RESULTADO FECHAR
  useEffect(() => {
    if (!isResultModalOpen && username && isMounted.current) {
      fetchLevelInfo();
    }
  }, [isResultModalOpen]);

  // 🔥 POLLING A CADA 15 SEGUNDOS (MAIS EFICIENTE)
  useEffect(() => {
    if (!username) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      if (isMounted.current && !isResultModalOpen && username) {
        fetchLevelInfo();
      }
    }, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username, isResultModalOpen]);

  // Títulos por nível
  const levelTitles = [
    { min: 1, title: "Iniciante", icon: "🎴" },
    { min: 5, title: "Aprendiz", icon: "🃏" },
    { min: 10, title: "Jogador", icon: "🎯" },
    { min: 20, title: "Apostador", icon: "💰" },
    { min: 35, title: "Mestre", icon: "👑" },
    { min: 50, title: "Lenda", icon: "🏆" },
    { min: 75, title: "Mito", icon: "⭐" },
    { min: 100, title: "Deus do Poker", icon: "🔥" },
  ];

  const getLevelTitle = (level) => {
    let result = levelTitles[0];
    for (const lt of levelTitles) {
      if (level >= lt.min) result = lt;
    }
    return result;
  };

  const currentLevelTitle = getLevelTitle(levelInfo.level);

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
      <motion.div
        style={levelStyle()}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <span style={iconStyle()}>{levelInfo.levelIcon}</span>
        <span style={levelTextStyle()}>Nível {levelInfo.level}</span>
        <span style={titleStyle()}>{levelInfo.levelTitle}</span>
      </motion.div>

      <div style={xpBarStyle()}>
        <motion.div
          style={{
            ...xpFillStyle(),
            width: `${progress}%`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div style={xpTextStyle()}>
        {levelInfo.xp} / {levelInfo.xpToNextLevel} XP
        <span style={{ marginLeft: "8px", fontSize: "0.6rem", color: "#666" }}>
          ({Math.round(progress)}%)
        </span>
      </div>

      <div style={badgesStyle()}>
        <motion.button
          onClick={() => {
            if (onShowAchievements) {
              onShowAchievements();
            }
          }}
          style={badgeButtonStyle()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🏅 {levelInfo.achievementsCount || 0} conquistas
        </motion.button>
        <motion.button
          onClick={() => {
            if (onShowFindings) {
              onShowFindings();
            }
          }}
          style={badgeButtonStyle()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔍 {levelInfo.findingsCount || 0} achados
        </motion.button>
      </div>

      {showLevelUp && (
        <motion.div
          style={levelUpNotificationStyle()}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
        >
          🎊 Subiu para Nível {levelInfo.level}! {levelInfo.levelTitle}
        </motion.div>
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

function levelStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    cursor: "default",
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
    fontSize: "0.75rem",
    color: "#aaa",
    marginLeft: "auto",
    padding: "2px 10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
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
    background: "linear-gradient(90deg, #4caf50, gold, #ff8c00)",
    borderRadius: 10,
    transition: "width 0.5s ease",
  };
}

function xpTextStyle() {
  return {
    fontSize: "0.65rem",
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
    padding: "4px 12px",
    borderRadius: 12,
    fontSize: "0.7rem",
    color: "#aaa",
    border: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    flex: 1,
  };
}

function levelUpNotificationStyle() {
  return {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #1a5a2a, #0d4a1d)",
    border: "2px solid gold",
    borderRadius: 15,
    padding: "8px 16px",
    color: "gold",
    fontSize: "0.85rem",
    fontWeight: "bold",
    boxShadow: "0 0 40px rgba(255,215,0,0.2)",
    whiteSpace: "nowrap",
    zIndex: 10,
  };
}
