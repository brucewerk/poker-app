// components/Poker/FindingsModal.jsx - CORRIGIDO
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FindingsModal({ onClose, newFindings = [], username }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayNewFindings, setDisplayNewFindings] = useState(newFindings);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔥 TODOS OS ACHADOS DISPONÍVEIS
  const ALL_FINDINGS = useMemo(
    () => [
      {
        id: "first_hand",
        name: "🎴 Primeira Mão",
        description: "Jogue sua primeira mão",
        icon: "🎴",
        xp: 10,
      },
      {
        id: "first_win_finding",
        name: "🏆 Primeira Vitória",
        description: "Ganhe sua primeira mão",
        icon: "🏆",
        xp: 15,
      },
      {
        id: "ten_hands_finding",
        name: "🎯 10 Mãos",
        description: "Jogue 10 mãos",
        icon: "🎯",
        xp: 20,
      },
      {
        id: "twenty_hands_finding",
        name: "🎯 20 Mãos",
        description: "Jogue 20 mãos",
        icon: "🎯",
        xp: 30,
      },
      {
        id: "fifty_hands_finding",
        name: "🎯 50 Mãos",
        description: "Jogue 50 mãos",
        icon: "🎯",
        xp: 40,
      },
      {
        id: "hundred_hands_finding",
        name: "🎯 100 Mãos",
        description: "Jogue 100 mãos",
        icon: "🎯",
        xp: 50,
      },
      {
        id: "five_wins_finding",
        name: "⭐ 5 Vitórias",
        description: "Ganhe 5 mãos",
        icon: "⭐",
        xp: 25,
      },
      {
        id: "ten_wins_finding",
        name: "🏆 10 Vitórias",
        description: "Ganhe 10 mãos",
        icon: "🏆",
        xp: 35,
      },
      {
        id: "twenty_wins_finding",
        name: "🏆 20 Vitórias",
        description: "Ganhe 20 mãos",
        icon: "🏆",
        xp: 50,
      },
      {
        id: "all_in_win_finding",
        name: "⚡ All-in Vitorioso",
        description: "Ganhe com All-in",
        icon: "⚡",
        xp: 40,
      },
      {
        id: "big_win_finding",
        name: "💰 Grande Vitória",
        description: "Ganhe mais de 300 fichas",
        icon: "💰",
        xp: 35,
      },
      {
        id: "mega_win_finding",
        name: "💎 Mega Vitória",
        description: "Ganhe mais de 1000 fichas",
        icon: "💎",
        xp: 60,
      },
    ],
    [],
  );

  useEffect(() => {
    if (newFindings && newFindings.length > 0) {
      setDisplayNewFindings(newFindings);
    }
  }, [newFindings]);

  useEffect(() => {
    fetchFindings();
  }, [username]);

  const fetchFindings = async () => {
    try {
      const url = username
        ? `/api/get-level?username=${encodeURIComponent(username)}&t=${Date.now()}`
        : "/api/get-level";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        // 🔥 CORREÇÃO: Usar os findings retornados pela API
        setFindings(data.findings || []);
      }
    } catch (error) {
      console.error("Erro ao carregar achados:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CORREÇÃO: Filtrar achados desbloqueados
  const unlockedFindings = useMemo(() => {
    return findings.filter((f) => f && f.id);
  }, [findings]);

  // 🔥 CORREÇÃO: Contar apenas os desbloqueados
  const unlockedCount = unlockedFindings.length;
  const totalCount = ALL_FINDINGS.length;

  // Filtrar por busca
  const filteredFindings = useMemo(() => {
    if (!searchTerm) return ALL_FINDINGS;
    const term = searchTerm.toLowerCase();
    return ALL_FINDINGS.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term),
    );
  }, [ALL_FINDINGS, searchTerm]);

  if (loading) {
    return (
      <div style={overlayStyle()}>
        <div style={modalStyle()}>
          <h2 style={titleStyle()}>🔍 ACHADOS</h2>
          <p style={{ textAlign: "center", color: "#aaa" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // 🔥 IDs dos achados desbloqueados
  const unlockedIds = new Set(unlockedFindings.map((f) => f.id));

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

        <h2 style={titleStyle()}>🔍 ACHADOS</h2>

        {/* 🔥 CORREÇÃO: Mostrar progresso CORRETO */}
        <div style={progressStyle()}>
          <span style={{ color: "#ddd" }}>
            Progresso:{" "}
            <strong style={{ color: "gold" }}>{unlockedCount}</strong> /{" "}
            {totalCount} descobertos
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

        {/* Novos achados */}
        <AnimatePresence>
          {displayNewFindings.length > 0 && (
            <motion.div
              style={newFindingsStyle()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3 style={{ color: "gold", margin: "0 0 10px" }}>
                🎉 Novos Achados!
              </h3>
              <div style={newFindingsListStyle()}>
                {displayNewFindings.map((finding, i) => (
                  <motion.div
                    key={`new-finding-${i}-${finding.id}`}
                    style={newFindingItemStyle()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span style={achievementIconStyle()}>
                      {finding.icon || "🔍"}
                    </span>
                    <div>
                      <div style={achievementNameStyle(true)}>
                        {finding.name}
                      </div>
                      <div style={achievementDescStyle()}>
                        {finding.description}
                      </div>
                    </div>
                    <span style={newBadgeStyle()}>🎉 NOVO!</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Busca */}
        <div style={searchContainerStyle()}>
          <input
            type="text"
            placeholder="🔍 Buscar achado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle()}
          />
        </div>

        {/* Lista de achados */}
        <div style={findingsListStyle()}>
          {filteredFindings.map((finding) => {
            const unlocked = unlockedIds.has(finding.id);
            return (
              <motion.div
                key={finding.id}
                style={findingItemStyle(unlocked)}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span style={achievementIconStyle()}>
                  {unlocked ? finding.icon || "✅" : "🔒"}
                </span>
                <div style={achievementContentStyle()}>
                  <div style={achievementNameStyle(unlocked)}>
                    {finding.name}
                    {unlocked && (
                      <span style={unlockedBadgeStyle()}>✅ DESBLOQUEADO</span>
                    )}
                    {!unlocked && (
                      <span style={lockedBadgeStyle()}>🔒 BLOQUEADO</span>
                    )}
                  </div>
                  <div style={achievementDescStyle()}>
                    {finding.description}
                  </div>
                  {unlocked && (
                    <div style={xpBonusStyle()}>✨ +{finding.xp || 0} XP</div>
                  )}
                </div>
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

// ====================== ESTILOS ======================
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
    maxWidth: 600,
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

function searchContainerStyle() {
  return {
    marginBottom: "15px",
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

function findingsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
    maxHeight: "350px",
    overflowY: "auto",
  };
}

function findingItemStyle(unlocked) {
  return {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 15px",
    borderRadius: 12,
    background: unlocked ? "rgba(76,175,80,0.08)" : "rgba(255,255,255,0.02)",
    border: unlocked
      ? "1px solid rgba(76,175,80,0.2)"
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

function achievementDescStyle() {
  return {
    fontSize: "0.75rem",
    color: "#ccc",
    marginTop: "2px",
  };
}

function unlockedBadgeStyle() {
  return {
    fontSize: "0.55rem",
    color: "#4caf50",
    background: "rgba(76,175,80,0.15)",
    padding: "1px 8px",
    borderRadius: 10,
    fontWeight: "600",
  };
}

function lockedBadgeStyle() {
  return {
    fontSize: "0.55rem",
    color: "#666",
    background: "rgba(255,255,255,0.05)",
    padding: "1px 8px",
    borderRadius: 10,
    fontWeight: "600",
  };
}

function xpBonusStyle() {
  return {
    fontSize: "0.65rem",
    color: "#4caf50",
    marginTop: "2px",
  };
}

function newFindingsStyle() {
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

function newFindingsListStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
  };
}

function newFindingItemStyle() {
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
