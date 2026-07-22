// components/Poker/LevelDisplay.jsx - CORRIGIDO
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LevelDisplay({
  username,
  isResultModalOpen,
  onShowAchievements,
  onShowFindings,
}) {
  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [ranksData, setRanksData] = useState([]);
  const [error, setError] = useState(null);

  // 🔥 BUSCAR DADOS DO NÍVEL
  const fetchLevelData = useCallback(async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch(
        `/api/get-level?username=${encodeURIComponent(username)}&t=${Date.now()}`,
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success) {
        setLevelData(data);
      } else {
        setError(data.error || "Erro ao carregar nível");
      }
    } catch (error) {
      console.error("Erro ao buscar nível:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  // 🔥 BUSCAR DADOS DOS GRAUS (usando query param)
  const fetchRanksData = useCallback(async () => {
    try {
      const res = await fetch(`/api/get-level?ranks=true&t=${Date.now()}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success) {
        setRanksData(data.ranks || []);
      }
    } catch (error) {
      console.error("Erro ao buscar graus:", error);
    }
  }, []);

  useEffect(() => {
    fetchLevelData();
    fetchRanksData();
  }, [fetchLevelData, fetchRanksData]);

  // 🔥 ATUALIZAR QUANDO O MODAL DE RESULTADO FECHAR
  useEffect(() => {
    if (!isResultModalOpen) {
      fetchLevelData();
    }
  }, [isResultModalOpen, fetchLevelData]);

  if (loading) {
    return (
      <div style={containerStyle()}>
        <div style={cardStyle()}>
          <div style={loadingStyle()}>Carregando nível...</div>
        </div>
      </div>
    );
  }

  if (error || !levelData) {
    return (
      <div style={containerStyle()}>
        <div style={cardStyle()}>
          <div style={errorStyle()}>⚠️ {error || "Erro ao carregar nível"}</div>
        </div>
      </div>
    );
  }

  const { level, title, xp, xpToNext, progress, achievements, findings } =
    levelData;

  // 🔥 COMPONENTE MODAL DE GRAUS
  const RanksModal = () => {
    if (!showRanksModal) return null;

    // 🔥 Definir cores por tipo de grau
    const getRankColor = (rankType) => {
      const colors = {
        Comum: "#8a8a8a",
        Incomum: "#4caf50",
        Raro: "#2196f3",
        Épico: "#9c27b0",
        Lendário: "#ff9800",
        Mítico: "#f44336",
      };
      return colors[rankType] || "#888";
    };

    // 🔥 Definir ícone por tipo de grau
    const getRankIcon = (rankType) => {
      const icons = {
        Comum: "🟤",
        Incomum: "🟢",
        Raro: "🔵",
        Épico: "🟣",
        Lendário: "🟠",
        Mítico: "🔴",
      };
      return icons[rankType] || "⭐";
    };

    // 🔥 Calcular progresso para o próximo grau
    const getProgressToNextRank = (currentLevel, currentRankIndex) => {
      if (currentRankIndex >= ranksData.length - 1) return 100;
      const nextRank = ranksData[currentRankIndex + 1];
      const currentRank = ranksData[currentRankIndex];
      const minLevel = currentRank.minLevel;
      const nextMinLevel = nextRank.minLevel;
      const progress =
        ((currentLevel - minLevel) / (nextMinLevel - minLevel)) * 100;
      return Math.min(100, Math.max(0, progress));
    };

    // 🔥 Encontrar índice do grau atual
    let currentRankIndex = 0;
    for (let i = ranksData.length - 1; i >= 0; i--) {
      if (level >= ranksData[i].minLevel) {
        currentRankIndex = i;
        break;
      }
    }

    return (
      <motion.div
        style={ranksOverlayStyle()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowRanksModal(false)}
      >
        <motion.div
          style={ranksModalStyle()}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={ranksHeaderStyle()}>
            <h2 style={ranksTitleStyle()}>🏆 GRAUS E TÍTULOS</h2>
            <button
              onClick={() => setShowRanksModal(false)}
              style={ranksCloseStyle()}
            >
              ✕
            </button>
          </div>

          <div style={ranksDescriptionStyle()}>
            <p>
              Progressão de graus conforme você sobe de nível. Cada grau
              desbloqueia novos títulos e conquistas!
            </p>
          </div>

          <div style={ranksListStyle()}>
            {ranksData.length === 0 ? (
              <p style={ranksEmptyStyle()}>Nenhum grau disponível</p>
            ) : (
              ranksData.map((rank, index) => {
                const isUnlocked = level >= rank.minLevel;
                const isCurrent = index === currentRankIndex;
                const progressToNext = getProgressToNextRank(level, index);
                const isLast = index === ranksData.length - 1;

                return (
                  <motion.div
                    key={rank.id || index}
                    style={rankItemStyle(isUnlocked, isCurrent)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div style={rankIconStyle()}>{getRankIcon(rank.type)}</div>
                    <div style={rankInfoStyle()}>
                      <div style={rankNameStyle(isUnlocked, isCurrent)}>
                        {rank.title}
                        {isCurrent && (
                          <span style={currentBadgeStyle()}>ATUAL</span>
                        )}
                        {!isUnlocked && (
                          <span style={lockedBadgeStyle()}>🔒</span>
                        )}
                      </div>
                      <div style={rankDetailsStyle()}>
                        <span style={rankTypeStyle(rank.type)}>
                          {rank.type}
                        </span>
                        <span style={rankLevelStyle()}>
                          Nv. {rank.minLevel}
                        </span>
                        {rank.xpBonus > 0 && (
                          <span style={rankBonusStyle()}>
                            +{rank.xpBonus}% XP
                          </span>
                        )}
                      </div>
                      {isUnlocked && !isLast && (
                        <div style={rankProgressStyle()}>
                          <span style={rankNextStyle()}>
                            Próximo: {ranksData[index + 1]?.title || "Máximo"}{" "}
                            (Nv. {ranksData[index + 1]?.minLevel || "∞"})
                          </span>
                          <div style={rankProgressBarStyle()}>
                            <div
                              style={{
                                ...rankProgressFillStyle(),
                                width: `${progressToNext}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {isLast && isUnlocked && (
                        <div style={rankMaxStyle()}>🏆 MÁXIMO ALCANÇADO!</div>
                      )}
                      {!isUnlocked && (
                        <div style={rankLockedProgressStyle()}>
                          <div style={rankProgressBarStyle()}>
                            <div
                              style={{
                                ...rankProgressFillStyle(),
                                width: `${Math.min(100, ((level - (index > 0 ? ranksData[index - 1]?.minLevel || 0 : 0)) / (rank.minLevel - (index > 0 ? ranksData[index - 1]?.minLevel || 0 : 0))) * 100)}%`,
                              }}
                            />
                          </div>
                          <span style={rankProgressTextStyle()}>
                            {level}/{rank.minLevel} para desbloquear
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={rankStatusStyle(isUnlocked)}>
                      {isUnlocked ? "✅" : "⏳"}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div style={ranksFooterStyle()}>
            <button
              onClick={() => setShowRanksModal(false)}
              style={ranksFooterButtonStyle()}
            >
              FECHAR
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <AnimatePresence>
        <RanksModal />
      </AnimatePresence>

      <div style={containerStyle()}>
        <motion.div
          style={cardStyle()}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div style={headerStyle()}>
            <div style={levelInfoStyle()}>
              <span style={levelNumberStyle()}>Nível {level}</span>
              <span style={levelTitleStyle()}>{title}</span>
            </div>
            <button
              onClick={() => setShowRanksModal(true)}
              style={rankButtonStyle()}
              title="Ver todos os graus e títulos"
            >
              🏆 Graus
            </button>
          </div>

          <div style={progressContainerStyle()}>
            <div style={progressBarStyle()}>
              <motion.div
                style={{
                  ...progressFillStyle(),
                  width: `${Math.min(100, progress)}%`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div style={progressTextStyle()}>
              {xp} / {xpToNext} XP ({Math.round(progress)}%)
            </div>
          </div>

          <div style={statsRowStyle()}>
            <motion.div
              style={statItemStyle()}
              whileHover={{ scale: 1.05 }}
              onClick={onShowAchievements}
            >
              <span style={statIconStyle()}>🏅</span>
              <span style={statValueStyle()}>{achievements || 0}</span>
              <span style={statLabelStyle()}>conquistas</span>
            </motion.div>
            <motion.div
              style={statItemStyle()}
              whileHover={{ scale: 1.05 }}
              onClick={onShowFindings}
            >
              <span style={statIconStyle()}>🔍</span>
              <span style={statValueStyle()}>{findings || 0}</span>
              <span style={statLabelStyle()}>achados</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ============================================================
// 🎨 ESTILOS (MANTIDOS IGUAIS)
// ============================================================

function containerStyle() {
  return {
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  };
}

function cardStyle() {
  return {
    background: "var(--bg-card)",
    borderRadius: 16,
    padding: "16px 18px",
    border: "1px solid var(--border-gold)",
    transition: "var(--transition-theme)",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  };
}

function loadingStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    padding: "10px 0",
  };
}

function errorStyle() {
  return {
    textAlign: "center",
    color: "#f44336",
    fontSize: "0.8rem",
    padding: "10px 0",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "6px",
  };
}

function levelInfoStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function levelNumberStyle() {
  return {
    color: "gold",
    fontWeight: "bold",
    fontSize: "1.1rem",
  };
}

function levelTitleStyle() {
  return {
    color: "var(--text-primary)",
    fontWeight: "600",
    fontSize: "0.9rem",
    opacity: 0.8,
  };
}

function rankButtonStyle() {
  return {
    background: "rgba(255,215,0,0.12)",
    border: "1px solid rgba(255,215,0,0.25)",
    borderRadius: "20px",
    padding: "4px 14px",
    color: "gold",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  };
}

function progressContainerStyle() {
  return {
    marginBottom: "12px",
  };
}

function progressBarStyle() {
  return {
    width: "100%",
    height: "8px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "4px",
    overflow: "hidden",
    position: "relative",
  };
}

function progressFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, #f7d97c, #d6a12e)",
    borderRadius: "4px",
    transition: "width 0.8s ease",
  };
}

function progressTextStyle() {
  return {
    textAlign: "right",
    fontSize: "0.65rem",
    color: "var(--text-muted)",
    marginTop: "3px",
  };
}

function statsRowStyle() {
  return {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  };
}

function statItemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.03)",
    padding: "4px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    flexWrap: "wrap",
    justifyContent: "center",
  };
}

function statIconStyle() {
  return {
    fontSize: "1rem",
  };
}

function statValueStyle() {
  return {
    fontWeight: "bold",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
  };
}

function statLabelStyle() {
  return {
    color: "var(--text-muted)",
    fontSize: "0.6rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };
}

// ============================================================
// 🔥 ESTILOS DO MODAL DE GRAUS
// ============================================================

function ranksOverlayStyle() {
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

function ranksModalStyle() {
  return {
    background: "var(--bg-modal)",
    borderRadius: 24,
    padding: "28px 30px",
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

function ranksHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-light)",
  };
}

function ranksTitleStyle() {
  return {
    color: "gold",
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: "bold",
  };
}

function ranksCloseStyle() {
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

function ranksDescriptionStyle() {
  return {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginBottom: "16px",
    padding: "8px 14px",
    background: "rgba(255,215,0,0.05)",
    borderRadius: 10,
    border: "1px solid rgba(255,215,0,0.08)",
    textAlign: "center",
  };
}

function ranksListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "400px",
    overflowY: "auto",
    paddingRight: "4px",
    overflowX: "hidden",
  };
}

function ranksEmptyStyle() {
  return {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "20px 0",
  };
}

function rankItemStyle(isUnlocked, isCurrent) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 16px",
    background: isCurrent
      ? "rgba(255,215,0,0.12)"
      : isUnlocked
        ? "rgba(76,175,80,0.06)"
        : "rgba(255,255,255,0.02)",
    borderRadius: 12,
    border: isCurrent
      ? "2px solid gold"
      : isUnlocked
        ? "1px solid rgba(76,175,80,0.2)"
        : "1px solid rgba(255,255,255,0.05)",
    transition: "all 0.3s ease",
    width: "100%",
    boxSizing: "border-box",
  };
}

function rankIconStyle() {
  return {
    fontSize: "1.8rem",
    flexShrink: 0,
    width: "36px",
    textAlign: "center",
  };
}

function rankInfoStyle() {
  return {
    flex: 1,
    minWidth: 0,
  };
}

function rankNameStyle(isUnlocked, isCurrent) {
  return {
    fontWeight: "bold",
    fontSize: "0.95rem",
    color: isCurrent
      ? "gold"
      : isUnlocked
        ? "var(--text-primary)"
        : "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function currentBadgeStyle() {
  return {
    fontSize: "0.55rem",
    background: "gold",
    color: "#1a1a1a",
    padding: "1px 10px",
    borderRadius: 10,
    fontWeight: "700",
  };
}

function lockedBadgeStyle() {
  return {
    fontSize: "0.55rem",
    opacity: 0.5,
  };
}

function rankDetailsStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "2px",
  };
}

function rankTypeStyle(type) {
  const colors = {
    Comum: "#8a8a8a",
    Incomum: "#4caf50",
    Raro: "#2196f3",
    Épico: "#9c27b0",
    Lendário: "#ff9800",
    Mítico: "#f44336",
  };
  return {
    fontSize: "0.65rem",
    color: colors[type] || "#888",
    fontWeight: "600",
    background: "rgba(255,255,255,0.05)",
    padding: "1px 10px",
    borderRadius: 10,
  };
}

function rankLevelStyle() {
  return {
    fontSize: "0.6rem",
    color: "var(--text-muted)",
  };
}

function rankBonusStyle() {
  return {
    fontSize: "0.6rem",
    color: "#4caf50",
    fontWeight: "600",
  };
}

function rankProgressStyle() {
  return {
    marginTop: "3px",
  };
}

function rankMaxStyle() {
  return {
    fontSize: "0.65rem",
    color: "gold",
    fontWeight: "700",
    marginTop: "3px",
  };
}

function rankNextStyle() {
  return {
    fontSize: "0.6rem",
    color: "var(--text-muted)",
    opacity: 0.7,
    display: "block",
    marginBottom: "2px",
  };
}

function rankLockedProgressStyle() {
  return {
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  };
}

function rankProgressBarStyle() {
  return {
    flex: 1,
    height: "4px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "2px",
    overflow: "hidden",
    minWidth: "60px",
  };
}

function rankProgressFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, #f7d97c, #d6a12e)",
    borderRadius: "2px",
    transition: "width 0.8s ease",
  };
}

function rankProgressTextStyle() {
  return {
    fontSize: "0.55rem",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
  };
}

function rankStatusStyle(isUnlocked) {
  return {
    fontSize: "1.2rem",
    flexShrink: 0,
  };
}

function ranksFooterStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid var(--border-light)",
  };
}

function ranksFooterButtonStyle() {
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
