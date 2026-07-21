// components/Poker/AchievementsModal.jsx - VERSÃO PREMIUM
"use client";

import { useState, useEffect, useMemo } from "react";
import { ACHIEVEMENTS, getAchievementsByRarity } from "@/lib/achievements";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedRarity, setSelectedRarity] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedIds = achievements.map((a) => a.id);
  const totalCount = allAchievements.length;
  const unlockedCount = unlockedIds.length;

  // Conquistas por raridade
  const achievementsByRarity = useMemo(() => getAchievementsByRarity(), []);

  // Filtrar conquistas
  const filteredAchievements = useMemo(() => {
    let filtered = allAchievements;

    if (selectedRarity !== "todos") {
      filtered = filtered.filter(
        (a) => (a.rarity || "comum") === selectedRarity,
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [allAchievements, selectedRarity, searchTerm]);

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

  // Cores por raridade
  const rarityColors = {
    comum: "#8BC34A",
    incomum: "#4CAF50",
    raro: "#2196F3",
    épico: "#9C27B0",
    lendário: "#FF6F00",
  };

  const rarityLabels = {
    comum: "Comum",
    incomum: "Incomum",
    raro: "Raro",
    épico: "Épico",
    lendário: "Lendário",
  };

  const rarityOrder = ["comum", "incomum", "raro", "épico", "lendário"];

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
    <motion.div
      style={overlayStyle()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={modalStyle()}
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <button onClick={onClose} style={closeButtonStyle()}>
          ✕
        </button>

        <h2 style={titleStyle()}>🏅 CONQUISTAS</h2>

        {/* Novas conquistas */}
        <AnimatePresence>
          {displayNewAchievements.length > 0 && (
            <motion.div
              style={newAchievementsStyle()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3 style={{ color: "gold", margin: "0 0 10px" }}>
                🎉 Novas Conquistas!
              </h3>
              <div style={newAchievementListStyle()}>
                {displayNewAchievements.map((ach, i) => (
                  <motion.div
                    key={`new-ach-${i}-${ach.id || ach.name}`}
                    style={newAchievementItemStyle()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span style={achievementIconStyle()}>
                      {ach.icon || "🏅"}
                    </span>
                    <div>
                      <div style={achievementNameStyle(true)}>{ach.name}</div>
                      <div style={achievementDescStyle()}>
                        {ach.description}
                      </div>
                    </div>
                    <span style={newBadgeStyle()}>🎉 NOVA!</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de progresso */}
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

        {/* Filtros */}
        <div style={filtersStyle()}>
          <div style={rarityFiltersStyle()}>
            <button
              onClick={() => setSelectedRarity("todos")}
              style={filterButtonStyle(selectedRarity === "todos")}
            >
              Todos ({totalCount})
            </button>
            {rarityOrder.map((rarity) => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                style={{
                  ...filterButtonStyle(selectedRarity === rarity),
                  color:
                    selectedRarity === rarity ? rarityColors[rarity] : "#888",
                  borderColor:
                    selectedRarity === rarity
                      ? rarityColors[rarity]
                      : "transparent",
                }}
              >
                {rarityLabels[rarity]} (
                {achievementsByRarity[rarity]?.length || 0})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="🔍 Buscar conquista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle()}
          />
        </div>

        {/* Lista de conquistas */}
        <div style={achievementsListStyle()}>
          {filteredAchievements.map((ach) => {
            const unlocked = unlockedIds.includes(ach.id);
            const rarity = ach.rarity || "comum";
            return (
              <motion.div
                key={ach.id}
                style={achievementItemStyle(unlocked, rarity)}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span style={achievementIconStyle()}>
                  {unlocked ? ach.icon || "✅" : "🔒"}
                </span>
                <div style={achievementContentStyle()}>
                  <div style={achievementNameStyle(unlocked)}>
                    {ach.name}
                    <span
                      style={{
                        ...rarityBadgeStyle(),
                        color: rarityColors[rarity],
                        borderColor: rarityColors[rarity],
                      }}
                    >
                      {rarityLabels[rarity]}
                    </span>
                  </div>
                  <div style={achievementDescStyle()}>{ach.description}</div>
                  {unlocked && (
                    <div style={xpBonusStyle()}>✨ +{ach.xpBonus} XP</div>
                  )}
                </div>
                {unlocked && <span style={unlockedBadgeStyle()}>✅</span>}
              </motion.div>
            );
          })}
        </div>

        <button onClick={onClose} style={buttonStyle()}>
          FECHAR
        </button>
      </motion.div>
    </motion.div>
  );
}

// ====================== ESTILOS PREMIUM ======================
function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 20,
    backdropFilter: "blur(8px)",
  };
}

function modalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 35px",
    borderRadius: 30,
    maxWidth: 650,
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    color: "white",
    border: "2px solid gold",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  };
}

function closeButtonStyle() {
  return {
    position: "absolute",
    top: 15,
    right: 20,
    background: "rgba(255,255,255,0.05)",
    border: "none",
    color: "white",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  };
}

function titleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 20px",
    fontSize: "1.8rem",
    fontWeight: "800",
    letterSpacing: "1px",
  };
}

function progressStyle() {
  return {
    marginBottom: "20px",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
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
    background: "linear-gradient(90deg, #4caf50, gold, #ff8c00)",
    borderRadius: 10,
    transition: "width 0.8s ease",
  };
}

function filtersStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
  };
}

function rarityFiltersStyle() {
  return {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  };
}

function filterButtonStyle(active) {
  return {
    background: active ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid gold" : "1px solid rgba(255,255,255,0.05)",
    borderRadius: 15,
    padding: "4px 12px",
    color: active ? "gold" : "#888",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function searchInputStyle() {
  return {
    width: "100%",
    padding: "8px 14px",
    borderRadius: 15,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.3s ease",
  };
}

function achievementsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
    maxHeight: "350px",
    overflowY: "auto",
  };
}

function achievementItemStyle(unlocked, rarity) {
  const rarityColors = {
    comum: "rgba(139,195,74,0.1)",
    incomum: "rgba(76,175,80,0.1)",
    raro: "rgba(33,150,243,0.1)",
    épico: "rgba(156,39,176,0.1)",
    lendário: "rgba(255,111,0,0.1)",
  };
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 15px",
    borderRadius: 12,
    background: unlocked
      ? rarityColors[rarity] || "rgba(255,215,0,0.05)"
      : "rgba(255,255,255,0.02)",
    border: unlocked
      ? `1px solid ${rarityColors[rarity] || "rgba(255,215,0,0.2)"}`
      : "1px solid rgba(255,255,255,0.03)",
    opacity: unlocked ? 1 : 0.5,
    cursor: "default",
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
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function rarityBadgeStyle() {
  return {
    fontSize: "0.55rem",
    padding: "1px 8px",
    borderRadius: 10,
    border: "1px solid",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };
}

function achievementDescStyle() {
  return {
    fontSize: "0.75rem",
    color: "#ccc",
    marginTop: "2px",
  };
}

function xpBonusStyle() {
  return {
    fontSize: "0.65rem",
    color: "#4caf50",
    marginTop: "2px",
  };
}

function unlockedBadgeStyle() {
  return {
    fontSize: "1.2rem",
    opacity: 0.6,
  };
}

function newAchievementsStyle() {
  return {
    background:
      "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))",
    padding: "15px",
    borderRadius: 15,
    marginBottom: "20px",
    border: "2px solid gold",
    boxShadow: "0 0 40px rgba(255,215,0,0.1)",
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

function newBadgeStyle() {
  return {
    fontSize: "0.6rem",
    fontWeight: "bold",
    color: "gold",
    background: "rgba(255,215,0,0.2)",
    padding: "2px 10px",
    borderRadius: 10,
    animation: "pulse 1.5s ease-in-out infinite",
    marginLeft: "auto",
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
    transition: "all 0.3s ease",
  };
}
