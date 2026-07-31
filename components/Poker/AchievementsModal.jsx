// components/Poker/AchievementsModal.jsx - CORRIGIDO (sincronizado com backend)
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACHIEVEMENTS } from "@/lib/achievements";

// 🔥 Converter ACHIEVEMENTS do backend para o formato do modal
const ACHIEVEMENTS_LIST = Object.values(ACHIEVEMENTS).map((ach) => ({
  id: ach.id,
  name: ach.name,
  description: ach.description,
  category: ach.rarity === "comum" ? "Comum" : 
           ach.rarity === "incomum" ? "Incomum" :
           ach.rarity === "raro" ? "Raro" :
           ach.rarity === "épico" ? "Épico" :
           ach.rarity === "lendário" ? "Lendário" : "Mítico",
  xpBonus: ach.xpBonus,
  icon: ach.icon,
}));

const CATEGORY_COLORS = {
  Comum: "#8a8a8a",
  Incomum: "#4caf50",
  Raro: "#2196f3",
  Épico: "#9c27b0",
  Lendário: "#ff9800",
  Mítico: "#f44336",
};

const CATEGORY_ICONS = {
  Comum: "🟤",
  Incomum: "🟢",
  Raro: "🔵",
  Épico: "🟣",
  Lendário: "🟠",
  Mítico: "🔴",
};

export default function AchievementsModal({
  onClose,
  newAchievements = [],
  username,
}) {
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIds, setHighlightedIds] = useState([]);

  // 🔥 Buscar conquistas do usuário
  useEffect(() => {
    const fetchUserAchievements = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/get-stats?username=${encodeURIComponent(username)}`,
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.success && data.achievements) {
          setUserAchievements(data.achievements);
        }
      } catch (error) {
        console.error("Erro ao buscar conquistas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAchievements();
  }, [username]);

  // 🔥 Destacar novas conquistas
  useEffect(() => {
    if (newAchievements && newAchievements.length > 0) {
      const ids = newAchievements.map((a) => a.id);
      setHighlightedIds(ids);

      const timer = setTimeout(() => {
        setHighlightedIds([]);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newAchievements]);

  // 🔥 Categorias
  const categories = useMemo(() => {
    const cats = ["Todos", ...new Set(ACHIEVEMENTS_LIST.map((a) => a.category))];
    return cats;
  }, []);

  // 🔥 Conquistas filtradas
  const filteredAchievements = useMemo(() => {
    let filtered = ACHIEVEMENTS_LIST;

    if (selectedCategory !== "Todos") {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [selectedCategory, searchTerm]);

  // 🔥 Verificar se conquista está desbloqueada
  const isUnlocked = useCallback(
    (achievementId) => {
      // 🔥 VERIFICAÇÃO ROBUSTA: Verifica tanto por ID quanto por compatibilidade
      const idMatch = userAchievements.some((a) => a === achievementId || a.id === achievementId);
      console.log(`🔍 [AchievementsModal] Verificando ${achievementId}: ${idMatch ? '✅ DESBLOQUEADA' : '❌ NÃO DESBLOQUEADA'}`, userAchievements);
      return idMatch;
    },
    [userAchievements],
  );

  // 🔥 Verificar se é nova
  const isNew = useCallback(
    (achievementId) => {
      return highlightedIds.includes(achievementId);
    },
    [highlightedIds],
  );

  // 🔥 Contagem por categoria
  const getCategoryCount = useCallback((category) => {
    if (category === "Todos") {
      return ACHIEVEMENTS_LIST.length;
    }
    return ACHIEVEMENTS_LIST.filter((a) => a.category === category).length;
  }, []);

  // 🔥 Contagem desbloqueada por categoria
  const getUnlockedCount = useCallback(
    (category) => {
      const achievements =
        category === "Todos"
          ? ACHIEVEMENTS_LIST
          : ACHIEVEMENTS_LIST.filter((a) => a.category === category);
      // 🔥 Garantir que achievements seja sempre um array
      const achievementsArray = Array.isArray(achievements) ? achievements : [];
      return achievementsArray.filter((a) => isUnlocked(a.id)).length;
    },
    [isUnlocked],
  );

  if (loading) {
    return (
      <div style={overlayStyle()} onClick={onClose}>
        <div style={modalStyle()}>
          <div style={loadingStyle()}>Carregando conquistas...</div>
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
      onClick={onClose}
    >
      <motion.div
        style={modalStyle()}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle()}>
          <h2 style={titleStyle()}>🏆 CONQUISTAS</h2>
          <button onClick={onClose} style={closeStyle()}>
            ✕
          </button>
        </div>

        {newAchievements && newAchievements.length > 0 && (
          <div style={newBadgeContainerStyle()}>
            <span style={newBadgeStyle()}>🎉 Novas Conquistas!</span>
            <div style={newAchievementsListStyle()}>
              {newAchievements.map((ach) => (
                <span key={ach.id} style={newAchievementItemStyle()}>
                  {ach.icon || "🏅"} {ach.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={progressContainerStyle()}>
          <span style={progressTextStyle()}>
            Progresso: {getUnlockedCount("Todos")}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div style={categoriesStyle()}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={categoryButtonStyle(selectedCategory === cat, cat)}
            >
              {cat === "Todos" ? "📋" : CATEGORY_ICONS[cat] || "🏅"} {cat}
              <span style={categoryCountStyle()}>
                {getUnlockedCount(cat)}/{getCategoryCount(cat)}
              </span>
            </button>
          ))}
        </div>

        <div style={searchContainerStyle()}>
          <input
            type="text"
            placeholder="Buscar conquista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle()}
          />
        </div>

        <div style={achievementsListStyle()}>
          {filteredAchievements.length === 0 ? (
            <p style={emptyStyle()}>Nenhuma conquista encontrada</p>
          ) : (
            filteredAchievements.map((ach) => {
              const unlocked = isUnlocked(ach.id);
              const newAchievement = isNew(ach.id);
              return (
                <motion.div
                  key={ach.id}
                  style={achievementItemStyle(unlocked, newAchievement)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={achievementIconStyle(unlocked)}>
                    {unlocked ? ach.icon : "🔒"}
                  </div>
                  <div style={achievementInfoStyle()}>
                    <div style={achievementNameStyle(unlocked, newAchievement)}>
                      {ach.name}
                      {newAchievement && (
                        <span style={newTagStyle()}>NOVA</span>
                      )}
                    </div>
                    <div style={achievementDescStyle(unlocked)}>
                      {ach.description}
                    </div>
                    <div style={achievementMetaStyle()}>
                      <span style={achievementCategoryStyle(ach.category)}>
                        {CATEGORY_ICONS[ach.category] || "🏅"} {ach.category}
                      </span>
                      {ach.xpBonus > 0 && (
                        <span style={achievementXpStyle()}>
                          +{ach.xpBonus} XP
                        </span>
                      )}
                      {unlocked && (
                        <span style={unlockedBadgeStyle()}>
                          ✅ DESBLOQUEADA
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={achievementStatusStyle(unlocked)}>
                    {unlocked ? "✅" : "⏳"}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div style={footerStyle()}>
          <button onClick={onClose} style={footerButtonStyle()}>
            FECHAR
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// 🎨 ESTILOS (SEM ROLAGEM HORIZONTAL)
// ============================================================

function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
    padding: "20px",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  };
}

function modalStyle() {
  return {
    background: "var(--bg-modal)",
    borderRadius: 24,
    padding: "24px 28px",
    maxWidth: "540px",
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    color: "var(--text-primary)",
    border: "2px solid var(--border-gold)",
    boxShadow: "0 20px 60px var(--shadow-dark)",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,215,0,0.3) transparent",
    boxSizing: "border-box",
    overflowX: "hidden",
  };
}

function loadingStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "30px 0",
    fontSize: "1rem",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-light)",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "bold",
  };
}

function closeStyle() {
  return {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.3rem",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
    transition: "all 0.3s ease",
  };
}

function newBadgeContainerStyle() {
  return {
    background: "rgba(255,215,0,0.1)",
    border: "1px solid gold",
    borderRadius: 12,
    padding: "8px 14px",
    marginBottom: "14px",
  };
}

function newBadgeStyle() {
  return {
    display: "block",
    fontWeight: "bold",
    color: "gold",
    fontSize: "0.9rem",
    marginBottom: "4px",
  };
}

function newAchievementsListStyle() {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  };
}

function newAchievementItemStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: "0.8rem",
    color: "gold",
  };
}

function progressContainerStyle() {
  return {
    marginBottom: "12px",
    textAlign: "center",
  };
}

function progressTextStyle() {
  return {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
  };
}

function categoriesStyle() {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "12px",
    justifyContent: "center",
  };
}

function categoryButtonStyle(active, category) {
  const color =
    category === "Todos" ? "gold" : CATEGORY_COLORS[category] || "#888";
  return {
    padding: "4px 12px",
    borderRadius: "16px",
    border: active ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
    background: active ? `rgba(255,255,255,0.08)` : "transparent",
    color: active ? color : "var(--text-muted)",
    fontSize: "0.7rem",
    fontWeight: active ? "700" : "400",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
  };
}

function categoryCountStyle() {
  return {
    fontSize: "0.55rem",
    opacity: 0.6,
    marginLeft: "2px",
  };
}

function searchContainerStyle() {
  return {
    marginBottom: "12px",
  };
}

function searchInputStyle() {
  return {
    width: "100%",
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid var(--border-input)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    outline: "none",
    transition: "var(--transition-theme)",
    boxSizing: "border-box",
  };
}

function achievementsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "280px",
    overflowY: "auto",
    paddingRight: "4px",
    overflowX: "hidden",
  };
}

function emptyStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "20px 0",
  };
}

function achievementItemStyle(unlocked, newAchievement) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    background: unlocked
      ? newAchievement
        ? "rgba(255,215,0,0.12)"
        : "rgba(76,175,80,0.06)"
      : "rgba(255,255,255,0.02)",
    borderRadius: 12,
    border: unlocked
      ? newAchievement
        ? "2px solid gold"
        : "1px solid rgba(76,175,80,0.2)"
      : "1px solid rgba(255,255,255,0.05)",
    transition: "all 0.3s ease",
    width: "100%",
    boxSizing: "border-box",
  };
}

function achievementIconStyle(unlocked) {
  return {
    fontSize: "1.6rem",
    flexShrink: 0,
    width: "32px",
    textAlign: "center",
    opacity: unlocked ? 1 : 0.3,
  };
}

function achievementInfoStyle() {
  return {
    flex: 1,
    minWidth: 0,
  };
}

function achievementNameStyle(unlocked, newAchievement) {
  return {
    fontWeight: "bold",
    fontSize: "0.9rem",
    color: unlocked ? "var(--text-primary)" : "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  };
}

function newTagStyle() {
  return {
    fontSize: "0.55rem",
    background: "gold",
    color: "#1a1a1a",
    padding: "1px 8px",
    borderRadius: 8,
    fontWeight: "700",
  };
}

function achievementDescStyle(unlocked) {
  return {
    fontSize: "0.75rem",
    color: unlocked ? "var(--text-secondary)" : "var(--text-muted)",
    opacity: unlocked ? 1 : 0.6,
  };
}

function achievementMetaStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "2px",
  };
}

function achievementCategoryStyle(category) {
  return {
    fontSize: "0.6rem",
    color: CATEGORY_COLORS[category] || "#888",
    fontWeight: "600",
  };
}

function achievementXpStyle() {
  return {
    fontSize: "0.6rem",
    color: "#4caf50",
    fontWeight: "600",
  };
}

function unlockedBadgeStyle() {
  return {
    fontSize: "0.55rem",
    color: "#4caf50",
    fontWeight: "600",
  };
}

function achievementStatusStyle(unlocked) {
  return {
    fontSize: "1.2rem",
    flexShrink: 0,
  };
}

function footerStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-light)",
  };
}

function footerButtonStyle() {
  return {
    padding: "8px 32px",
    borderRadius: 30,
    border: "none",
    background: "radial-gradient(#f7d97c, #d6a12e)",
    color: "#2e241f",
    fontWeight: "bold",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}
