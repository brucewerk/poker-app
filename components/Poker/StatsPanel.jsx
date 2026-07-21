// components/Poker/StatsPanel.jsx - VERSÃO COM GRÁFICOS
"use client";

import { useState, useEffect, useRef, useMemo } from "react";

export default function StatsPanel({
  username,
  onShowAchievements,
  refreshInterval = 15000,
  isResultModalOpen = false,
}) {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState(false);
  const [lastAchievement, setLastAchievement] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchStats = async (silent = false) => {
    if (!username || !mountedRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      if (!silent) setLoading(true);
      setError(false);

      const url = `/api/get-stats?username=${encodeURIComponent(username)}&t=${Date.now()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && mountedRef.current) {
        const newAchievements = data.newAchievements || [];

        if (newAchievements.length > 0 && !silent) {
          setLastAchievement(newAchievements[0]);
          window.dispatchEvent(
            new CustomEvent("new-achievements", {
              detail: { achievements: newAchievements },
            }),
          );
        }

        setStats(data.stats || {});
        setAchievements(data.achievements || []);
        setAdvancedStats(data.advancedStats || null);
      }
    } catch (error) {
      if (!silent) {
        setError(true);
      }
    } finally {
      if (mountedRef.current) {
        isFetchingRef.current = false;
        if (!silent) setLoading(false);
      }
    }
  };

  // 🔥 COMPONENTE DE GRÁFICO DE BARRAS MINIATURA
  const MiniBarChart = ({
    data,
    colors = ["#4caf50", "#ff9800", "#2196f3"],
  }) => {
    if (!data || Object.keys(data).length === 0) return null;

    const entries = Object.entries(data).filter(([_, value]) => value > 0);
    if (entries.length === 0) return null;

    const max = Math.max(...entries.map(([_, value]) => value));

    return (
      <div style={miniChartStyle()}>
        {entries.slice(0, 6).map(([label, value], index) => (
          <div key={label} style={miniBarItemStyle()}>
            <div style={miniBarLabelStyle()}>{label}</div>
            <div style={miniBarTrackStyle()}>
              <div
                style={{
                  ...miniBarFillStyle(colors[index % colors.length]),
                  width: `${max > 0 ? (value / max) * 100 : 0}%`,
                }}
              />
            </div>
            <div style={miniBarValueStyle()}>{value}</div>
          </div>
        ))}
      </div>
    );
  };

  // 🔥 COMPONENTE DE PROGRESSO MENSAL
  const MonthlyProgress = ({ data }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map((d) => d.hands || 0), 1);

    return (
      <div style={monthlyChartStyle()}>
        <div style={monthlyBarContainerStyle()}>
          {data.map((month, index) => (
            <div key={month.month} style={monthlyBarItemStyle()}>
              <div style={monthlyBarTrackStyle()}>
                <div
                  style={{
                    ...monthlyBarFillStyle(),
                    height: `${(month.hands / max) * 100}%`,
                    background: `linear-gradient(to top, #4caf50, ${index % 2 === 0 ? "#ff9800" : "#2196f3"})`,
                  }}
                />
              </div>
              <div style={monthlyLabelStyle()}>{month.month}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    mountedRef.current = true;

    if (username) {
      fetchStats();
    } else {
      setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username]);

  useEffect(() => {
    if (!username) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      if (mountedRef.current && !isResultModalOpen && username) {
        fetchStats(true);
      }
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [username, refreshInterval, isResultModalOpen]);

  useEffect(() => {
    if (!isResultModalOpen && username && mountedRef.current) {
      fetchStats(true);
    }
  }, [isResultModalOpen]);

  useEffect(() => {
    if (!username) return;

    const handleNewAchievements = () => {
      if (mountedRef.current) {
        fetchStats(true);
      }
    };

    window.addEventListener("new-achievements", handleNewAchievements);
    return () => {
      window.removeEventListener("new-achievements", handleNewAchievements);
    };
  }, [username]);

  if (!username || error) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <p style={textStyle()}>
          Jogue algumas mãos para ver suas estatísticas!
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <p style={textStyle()}>Carregando...</p>
      </div>
    );
  }

  if (!stats || stats.handsPlayed === 0) {
    return (
      <div style={panelStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <p style={textStyle()}>
          Jogue algumas mãos para ver suas estatísticas!
        </p>
      </div>
    );
  }

  const winRate =
    stats.winRate ||
    (stats.handsPlayed > 0
      ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
      : 0);
  const achievementCount = achievements.length;

  return (
    <div style={panelStyle()}>
      <div style={headerStyle()}>
        <h3 style={titleStyle()}>📊 ESTATÍSTICAS</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={toggleButtonStyle()}
        >
          {showDetails ? "▲" : "▼"}
        </button>
      </div>

      {lastAchievement && (
        <div style={achievementNotificationStyle()}>
          🏅 Nova conquista: {lastAchievement.name}!
        </div>
      )}

      <div style={statsGridStyle()}>
        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>🎯 Mãos</span>
          <span style={statValueStyle()}>{stats.handsPlayed || 0}</span>
        </div>

        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>🏆 Vitórias</span>
          <span style={statValueStyle()}>{stats.handsWon || 0}</span>
        </div>

        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>📊 Taxa</span>
          <span style={statValueStyle(winRate > 50 ? "#4caf50" : "#ff9800")}>
            {winRate}%
          </span>
        </div>

        <div style={statItemStyle()}>
          <span style={statLabelStyle()}>💰 Total</span>
          <span style={statValueStyle()}>${stats.totalChipsWon || 0}</span>
        </div>
      </div>

      {showDetails && (
        <div style={detailsStyle()}>
          <div style={detailRowStyle()}>
            <span>🔥 Maior vitória:</span>
            <span style={detailValueStyle()}>${stats.biggestWin || 0}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>📈 Melhor streak:</span>
            <span style={detailValueStyle()}>{stats.bestStreak || 0}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>🃏 Melhor mão:</span>
            <span style={detailValueStyle()}>{stats.bestHand || "-"}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>⚡ All-in wins:</span>
            <span style={detailValueStyle()}>{stats.allInWins || 0}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>💔 Derrotas:</span>
            <span style={detailValueStyle()}>{stats.handsLost || 0}</span>
          </div>

          <div style={detailRowStyle()}>
            <span>🤝 Empates:</span>
            <span style={detailValueStyle()}>{stats.handsTied || 0}</span>
          </div>

          {/* 🔥 MÉTRICAS AVANÇADAS */}
          {advancedStats && (
            <>
              <div style={advancedToggleStyle()}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={advancedButtonStyle()}
                >
                  {showAdvanced
                    ? "📊 Ocultar métricas avançadas"
                    : "📈 Mostrar métricas avançadas"}
                </button>
              </div>

              {showAdvanced && (
                <div style={advancedStatsStyle()}>
                  <h4 style={advancedTitleStyle()}>🎯 Métricas Avançadas</h4>

                  <div style={advancedGridStyle()}>
                    <div style={advancedMetricStyle()}>
                      <span style={advancedLabelStyle()}>VPIP</span>
                      <span
                        style={advancedValueStyle(
                          advancedStats.vpip > 40 ? "#ff9800" : "#4caf50",
                        )}
                      >
                        {advancedStats.vpip || 0}%
                      </span>
                      <span style={advancedDescStyle()}>Mãos jogadas</span>
                    </div>

                    <div style={advancedMetricStyle()}>
                      <span style={advancedLabelStyle()}>PFR</span>
                      <span
                        style={advancedValueStyle(
                          advancedStats.pfr > 30 ? "#ff9800" : "#4caf50",
                        )}
                      >
                        {advancedStats.pfr || 0}%
                      </span>
                      <span style={advancedDescStyle()}>Aumentos pré-flop</span>
                    </div>

                    <div style={advancedMetricStyle()}>
                      <span style={advancedLabelStyle()}>AF</span>
                      <span
                        style={advancedValueStyle(
                          advancedStats.aggressionFactor > 2
                            ? "#ff9800"
                            : "#4caf50",
                        )}
                      >
                        {advancedStats.aggressionFactor || 0}
                      </span>
                      <span style={advancedDescStyle()}>Fator de agressão</span>
                    </div>
                  </div>

                  {/* Distribuição de Mãos */}
                  {advancedStats.handDistribution && (
                    <div style={chartSectionStyle()}>
                      <div style={chartTitleStyle()}>
                        🃏 Distribuição de Mãos
                      </div>
                      <MiniBarChart data={advancedStats.handDistribution} />
                    </div>
                  )}

                  {/* Progresso Mensal */}
                  {advancedStats.monthlyProgress && (
                    <div style={chartSectionStyle()}>
                      <div style={chartTitleStyle()}>📈 Progresso Mensal</div>
                      <MonthlyProgress data={advancedStats.monthlyProgress} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={achievementsStyle()}>
        <div style={achievementHeaderStyle()}>
          <span>🏅 Conquistas: {achievementCount}</span>
          <button onClick={onShowAchievements} style={viewButtonStyle()}>
            Ver todas
          </button>
        </div>
        <div style={achievementBadgesStyle()}>
          {achievements.slice(0, 3).map((ach, i) => (
            <span key={i} style={badgeStyle()}>
              {ach.icon || "🏅"}
            </span>
          ))}
          {achievements.length > 3 && (
            <span style={badgeStyle()}>+{achievements.length - 3}</span>
          )}
        </div>
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
    fontSize: "1.2rem",
    cursor: "pointer",
    padding: "0 5px",
  };
}

function textStyle() {
  return {
    textAlign: "center",
    color: "#ffefb9",
    padding: "10px 0",
    fontSize: "0.85rem",
  };
}

function statsGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  };
}

function statItemStyle() {
  return {
    background: "rgba(255,255,255,0.05)",
    padding: "8px",
    borderRadius: 10,
    textAlign: "center",
  };
}

function statLabelStyle() {
  return {
    display: "block",
    fontSize: "0.7rem",
    color: "#aaa",
    marginBottom: "2px",
  };
}

function statValueStyle(color = "gold") {
  return {
    display: "block",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: color,
  };
}

function detailsStyle() {
  return {
    marginTop: "10px",
    padding: "10px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
  };
}

function detailRowStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: "0.85rem",
    color: "#ddd",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };
}

function detailValueStyle() {
  return {
    color: "gold",
    fontWeight: "bold",
  };
}

function advancedToggleStyle() {
  return {
    marginTop: "8px",
    textAlign: "center",
  };
}

function advancedButtonStyle() {
  return {
    background: "rgba(255,215,0,0.1)",
    border: "1px solid rgba(255,215,0,0.2)",
    borderRadius: 15,
    padding: "4px 12px",
    color: "gold",
    fontSize: "0.7rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function advancedStatsStyle() {
  return {
    marginTop: "8px",
    padding: "8px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 10,
  };
}

function advancedTitleStyle() {
  return {
    color: "#ffd700",
    fontSize: "0.8rem",
    margin: "0 0 8px",
    textAlign: "center",
  };
}

function advancedGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  };
}

function advancedMetricStyle() {
  return {
    textAlign: "center",
    background: "rgba(255,255,255,0.03)",
    padding: "6px",
    borderRadius: 8,
  };
}

function advancedLabelStyle() {
  return {
    display: "block",
    fontSize: "0.6rem",
    color: "#888",
    fontWeight: "bold",
  };
}

function advancedValueStyle(color = "#4caf50") {
  return {
    display: "block",
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: color,
  };
}

function advancedDescStyle() {
  return {
    display: "block",
    fontSize: "0.5rem",
    color: "#666",
  };
}

function chartSectionStyle() {
  return {
    marginTop: "8px",
    padding: "8px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
  };
}

function chartTitleStyle() {
  return {
    fontSize: "0.7rem",
    color: "#aaa",
    marginBottom: "6px",
    textAlign: "center",
  };
}

function miniChartStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  };
}

function miniBarItemStyle() {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };
}

function miniBarLabelStyle() {
  return {
    fontSize: "0.55rem",
    color: "#888",
    minWidth: "60px",
    textAlign: "right",
  };
}

function miniBarTrackStyle() {
  return {
    flex: 1,
    height: "6px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
  };
}

function miniBarFillStyle(color) {
  return {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.5s ease",
    background: color,
  };
}

function miniBarValueStyle() {
  return {
    fontSize: "0.55rem",
    color: "#666",
    minWidth: "20px",
    textAlign: "left",
  };
}

function monthlyChartStyle() {
  return {
    marginTop: "4px",
  };
}

function monthlyBarContainerStyle() {
  return {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "60px",
    gap: "4px",
  };
}

function monthlyBarItemStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  };
}

function monthlyBarTrackStyle() {
  return {
    width: "100%",
    height: "45px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "3px 3px 0 0",
    overflow: "hidden",
    display: "flex",
    alignItems: "flex-end",
  };
}

function monthlyBarFillStyle() {
  return {
    width: "100%",
    borderRadius: "3px 3px 0 0",
    transition: "height 0.5s ease",
    minHeight: "2px",
  };
}

function monthlyLabelStyle() {
  return {
    fontSize: "0.5rem",
    color: "#666",
    marginTop: "2px",
  };
}

function achievementsStyle() {
  return {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,215,0,0.2)",
  };
}

function achievementHeaderStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.85rem",
    color: "#ddd",
  };
}

function viewButtonStyle() {
  return {
    background: "rgba(255,215,0,0.2)",
    border: "none",
    borderRadius: 15,
    padding: "4px 12px",
    color: "gold",
    fontSize: "0.75rem",
    cursor: "pointer",
  };
}

function achievementBadgesStyle() {
  return {
    display: "flex",
    gap: "5px",
    marginTop: "5px",
    flexWrap: "wrap",
  };
}

function badgeStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: "0.8rem",
    border: "1px solid rgba(255,215,0,0.2)",
  };
}

function achievementNotificationStyle() {
  return {
    background: "rgba(255,215,0,0.15)",
    border: "1px solid gold",
    borderRadius: 10,
    padding: "6px 10px",
    marginBottom: "8px",
    color: "gold",
    fontSize: "0.8rem",
    textAlign: "center",
    animation: "fadeIn 0.3s ease-out",
  };
}
