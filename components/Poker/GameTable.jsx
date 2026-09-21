// components/Poker/GameTable.jsx - COMPLETO CORRIGIDO (SEM CONFLITOS DE ESTILO)
"use client";

import { useState, useEffect, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "./Card.jsx";

const GameTable = memo(function GameTable({
  communityCards,
  playerCards,
  cpuCards,
  playerHandName,
  cpuHandName,
  cpuThought,
  stage,
  pot,
  currentBet,
  playerBet,
  cpuBet,
  isTurbo,
  showCpuCards,
  isMultiplayer,
  multiplayerPlayers,
  currentPlayerIndex,
  onSwitchPlayer,
  currentUser,
}) {
  // 🔥 DETECTA MODO PAISAGEM
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode =
        window.innerHeight < window.innerWidth && window.innerHeight < 550;
      setIsLandscape(isLandscapeMode);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // 🔥 Otimização: Evitar re-renders desnecessários
  const memoizedCommunityCards = useMemo(
    () => communityCards,
    [communityCards],
  );
  const memoizedPlayerCards = useMemo(() => playerCards, [playerCards]);
  const memoizedCpuCards = useMemo(() => cpuCards, [cpuCards]);

  const [potAnimationKey, setPotAnimationKey] = useState(0);
  const [showPotEffect, setShowPotEffect] = useState(false);
  const chipKeyCounter = useRef(0);
  const potKeyCounter = useRef(0);

  useEffect(() => {
    if (pot > 0) {
      potKeyCounter.current += 1;
      setPotAnimationKey(potKeyCounter.current);
      setShowPotEffect(true);
      const timer = setTimeout(() => setShowPotEffect(false), 800);
      return () => clearTimeout(timer);
    }
  }, [pot]);

  const tableGlowVariants = useMemo(
    () => ({
      idle: {
        boxShadow: "0 0 50px rgba(0,200,0,0.1)",
      },
      active: {
        boxShadow: "0 0 70px rgba(0,200,0,0.25)",
      },
      showdown: {
        boxShadow: [
          "0 0 50px rgba(255,215,0,0.15)",
          "0 0 100px rgba(255,215,0,0.4)",
          "0 0 50px rgba(255,215,0,0.15)",
        ],
        transition: { duration: 2, repeat: Infinity },
      },
      allin: {
        boxShadow: [
          "0 0 50px rgba(255,0,0,0.15)",
          "0 0 100px rgba(255,0,0,0.4)",
          "0 0 50px rgba(255,0,0,0.15)",
        ],
        transition: { duration: 1, repeat: Infinity },
      },
    }),
    [],
  );

  const tableState = useMemo(() => {
    if (stage === "showdown") return "showdown";
    if (playerBet > 500 || cpuBet > 500) return "allin";
    if (playerBet > 0 || cpuBet > 0) return "active";
    return "idle";
  }, [stage, playerBet, cpuBet]);

  const renderChips = useMemo(() => {
    const chipCount = Math.min(Math.floor(pot / 25), 20);
    if (chipCount === 0) return null;

    const chips = [];
    for (let i = 0; i < chipCount; i++) {
      chipKeyCounter.current += 1;
      const angle = (i / chipCount) * Math.PI * 2 + Math.random() * 0.1;
      const radius = 12 + Math.random() * 10;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
      const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 4;
      const delay = i * 0.02;
      chips.push(
        <motion.div
          key={`chip-${chipKeyCounter.current}-${i}`}
          initial={{ scale: 0, rotate: 0, y: -20 }}
          animate={{
            scale: 1,
            rotate: 360 + Math.random() * 180,
            x: x,
            y: y,
          }}
          transition={{
            delay: delay,
            type: "spring",
            stiffness: 250,
            damping: 18,
            duration: 0.4,
          }}
          style={chipStyle(i)}
        />,
      );
    }
    return chips;
  }, [pot, chipKeyCounter.current]);

  const shouldRenderChips = pot > 0 && pot < 5000;

  const playerDisplayName = useMemo(() => {
    if (isMultiplayer && multiplayerPlayers && multiplayerPlayers.length > 0) {
      return (
        multiplayerPlayers[currentPlayerIndex]?.name || currentUser || "Jogador"
      );
    }
    return currentUser || "Jogador";
  }, [isMultiplayer, multiplayerPlayers, currentPlayerIndex, currentUser]);

  // 🔥 ESTILOS DINÂMICOS PARA PAISAGEM - SEM CONFLITOS (usando apenas propriedades específicas)
  const getFeltStyles = () => {
    if (isLandscape) {
      return {
        background: "var(--bg-felt)",
        borderRadius: "12px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "6px",
        paddingRight: "6px",
        position: "relative",
        minHeight: "140px",
        border: "3px solid var(--border-felt)",
        boxShadow: "inset 0 0 60px var(--shadow-felt)",
        transition: "var(--transition-theme)",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: "4px",
        flexWrap: "nowrap",
      };
    }
    return {
      background: "var(--bg-felt)",
      borderRadius: "50px",
      paddingTop: "30px",
      paddingBottom: "30px",
      paddingLeft: "20px",
      paddingRight: "20px",
      position: "relative",
      minHeight: "500px",
      border: "3px solid var(--border-felt)",
      boxShadow: "inset 0 0 60px var(--shadow-felt)",
      transition: "var(--transition-theme)",
    };
  };

  const getCpuAreaStyles = () => {
    if (isLandscape) {
      return {
        textAlign: "center",
        flex: "0 0 22%",
        marginTop: "0px",
        marginBottom: "0px",
        marginLeft: "0px",
        marginRight: "0px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "4px",
        paddingRight: "4px",
        background: "var(--bg-status-item)",
        borderRadius: "8px",
        border: "1px solid var(--border-element)",
        boxShadow: "0 2px 8px var(--shadow-element)",
        transition: "var(--transition-theme)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "0px",
      };
    }
    return {
      textAlign: "center",
      marginBottom: "20px",
      paddingTop: "10px",
      paddingBottom: "10px",
      paddingLeft: "10px",
      paddingRight: "10px",
      background: "var(--bg-status-item)",
      borderRadius: "20px",
      border: "1px solid var(--border-element)",
      boxShadow: "0 2px 8px var(--shadow-element)",
      transition: "var(--transition-theme)",
    };
  };

  const getPlayerAreaStyles = () => {
    if (isLandscape) {
      return {
        textAlign: "center",
        flex: "0 0 22%",
        marginTop: "0px",
        marginBottom: "0px",
        marginLeft: "0px",
        marginRight: "0px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "4px",
        paddingRight: "4px",
        background: "var(--bg-status-item)",
        borderRadius: "8px",
        border: "1px solid var(--border-element)",
        boxShadow: "0 2px 8px var(--shadow-element)",
        transition: "var(--transition-theme)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "0px",
      };
    }
    return {
      textAlign: "center",
      marginTop: "20px",
      paddingTop: "10px",
      paddingBottom: "10px",
      paddingLeft: "10px",
      paddingRight: "10px",
      background: "var(--bg-status-item)",
      borderRadius: "20px",
      border: "1px solid var(--border-element)",
      boxShadow: "0 2px 8px var(--shadow-element)",
      transition: "var(--transition-theme)",
    };
  };

  const getCommunityAreaStyles = () => {
    if (isLandscape) {
      return {
        textAlign: "center",
        flex: "1 1 auto",
        marginTop: "0px",
        marginBottom: "0px",
        marginLeft: "0px",
        marginRight: "0px",
        paddingTop: "4px",
        paddingBottom: "4px",
        paddingLeft: "6px",
        paddingRight: "6px",
        background: "rgba(0, 0, 0, 0.10)",
        borderRadius: "8px",
        border: "1px solid var(--border-gold)",
        position: "relative",
        transition: "var(--transition-theme)",
        minWidth: "0px",
        minHeight: "0px",
      };
    }
    return {
      textAlign: "center",
      paddingTop: "15px",
      paddingBottom: "15px",
      paddingLeft: "15px",
      paddingRight: "15px",
      background: "rgba(0, 0, 0, 0.10)",
      borderRadius: "25px",
      marginTop: "10px",
      marginBottom: "10px",
      marginLeft: "0px",
      marginRight: "0px",
      border: "1px solid var(--border-gold)",
      position: "relative",
      transition: "var(--transition-theme)",
    };
  };

  return (
    <motion.div
      className="game-table-container"
      style={tableContainerStyle()}
      variants={tableGlowVariants}
      animate={tableState}
      initial="idle"
    >
      <div className="game-table-felt" style={getFeltStyles()}>
        {/* Cartas da CPU */}
        <div
          className="game-table-player-area game-table-player-area-cpu"
          style={getCpuAreaStyles()}
        >
          <div
            className="game-table-player-label"
            style={
              isLandscape
                ? {
                    fontSize: "0.45rem",
                    gap: "2px",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }
                : {}
            }
          >
            <span className="game-table-player-label-text">🤖 CPU</span>
            <motion.span
              className="game-table-chips-label"
              key={`cpu-bet-${cpuBet}-${Date.now()}`}
              initial={{ scale: 1 }}
              animate={{ scale: cpuBet > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={isLandscape ? { fontSize: "0.4rem" } : {}}
            >
              💰 {cpuBet}
            </motion.span>
            <span
              className="game-table-dealer-inline"
              style={
                isLandscape
                  ? {
                      fontSize: "0.4rem",
                      paddingTop: "0px",
                      paddingBottom: "0px",
                      paddingLeft: "6px",
                      paddingRight: "6px",
                    }
                  : {}
              }
            >
              🎯 DEALER
            </span>
            {isTurbo && (
              <motion.span
                className="game-table-turbo-inline"
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={
                  isLandscape
                    ? {
                        fontSize: "0.4rem",
                        paddingTop: "0px",
                        paddingBottom: "0px",
                        paddingLeft: "6px",
                        paddingRight: "6px",
                      }
                    : {}
                }
              >
                🚀 TURBO
              </motion.span>
            )}
          </div>
          <div
            className="game-table-cards-row"
            style={
              isLandscape
                ? {
                    gap: "2px",
                    minHeight: "30px",
                    marginTop: "2px",
                  }
                : {}
            }
          >
            {cpuCards && cpuCards.length > 0 ? (
              cpuCards.map((card, i) => (
                <Card
                  key={`cpu-${i}-${card.rank}${card.suit}`}
                  card={card}
                  faceDown={!showCpuCards}
                  delay={i * 120}
                  isRevealing={stage === "showdown"}
                  size={isLandscape ? "tiny" : "small"}
                />
              ))
            ) : (
              <span
                className="game-table-empty-cards-text"
                style={
                  isLandscape
                    ? {
                        fontSize: "0.45rem",
                        paddingTop: "4px",
                        paddingBottom: "4px",
                        paddingLeft: "8px",
                        paddingRight: "8px",
                      }
                    : {}
                }
              >
                🔒 ???
              </span>
            )}
          </div>
          {cpuHandName && (
            <motion.div
              className="game-table-hand-badge game-table-hand-badge-cpu"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={
                isLandscape
                  ? {
                      fontSize: "0.4rem",
                      paddingTop: "1px",
                      paddingBottom: "1px",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      marginTop: "1px",
                    }
                  : {}
              }
            >
              {cpuHandName}
            </motion.div>
          )}
          {cpuThought && (
            <motion.div
              className="game-table-cpu-thought"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={
                isLandscape
                  ? {
                      fontSize: "0.4rem",
                      paddingTop: "1px",
                      paddingBottom: "1px",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      marginTop: "1px",
                      maxWidth: "100%",
                    }
                  : {}
              }
            >
              <span className="game-table-thought-icon">💭</span> {cpuThought}
            </motion.div>
          )}
        </div>

        {/* Cartas comunitárias */}
        <div
          className="game-table-community-area"
          style={getCommunityAreaStyles()}
        >
          <div
            className="game-table-community-label-wrapper"
            style={
              isLandscape
                ? {
                    fontSize: "0.4rem",
                    gap: "4px",
                    marginBottom: "2px",
                  }
                : {}
            }
          >
            <span className="game-table-community-label">🔥 MESA</span>
            <motion.span
              className="game-table-stage-badge"
              key={`stage-${stage}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={
                isLandscape
                  ? {
                      fontSize: "0.4rem",
                      paddingTop: "1px",
                      paddingBottom: "1px",
                      paddingLeft: "6px",
                      paddingRight: "6px",
                    }
                  : {}
              }
            >
              {stage === "preflop"
                ? "Pré-flop"
                : stage === "flop"
                  ? "🎴 Flop"
                  : stage === "turn"
                    ? "🔄 Turn"
                    : stage === "river"
                      ? "🌊 River"
                      : stage === "showdown"
                        ? "⭐ Showdown"
                        : stage}
            </motion.span>
          </div>
          <div
            className="game-table-community-cards-row"
            style={
              isLandscape
                ? {
                    gap: "2px",
                    minHeight: "44px",
                  }
                : {}
            }
          >
            {communityCards && communityCards.length > 0
              ? communityCards.map((card, i) => (
                  <motion.div
                    key={`community-${i}-${card.rank}${card.suit}`}
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: i * 0.15,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Card
                      card={card}
                      delay={i * 100}
                      size={isLandscape ? "tiny" : "large"}
                      isHighlighted={stage === "showdown"}
                    />
                  </motion.div>
                ))
              : Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="game-table-empty-card"
                      style={{
                        ...emptyCardSlotStyle(),
                        ...(isLandscape
                          ? {
                              width: "32px",
                              height: "45px",
                            }
                          : {}),
                      }}
                    />
                  ))}
          </div>

          {/* Área do pote */}
          <div
            className="game-table-pot-area"
            style={isLandscape ? { marginTop: "2px" } : {}}
          >
            <motion.div
              key={`pot-${potAnimationKey}`}
              className="game-table-pot"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: showPotEffect ? 1.1 : 1,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                duration: 0.4,
              }}
              style={{
                ...potDisplayStyle(),
                ...(isLandscape
                  ? {
                      fontSize: "0.5rem",
                      paddingTop: "2px",
                      paddingBottom: "2px",
                      paddingLeft: "8px",
                      paddingRight: "8px",
                      minWidth: "40px",
                    }
                  : {}),
              }}
            >
              <motion.span
                className="game-table-pot-text"
                animate={{
                  scale: showPotEffect ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                style={isLandscape ? { fontSize: "0.5rem" } : {}}
              >
                💰 Pote: ${pot}
              </motion.span>
              {shouldRenderChips && (
                <div className="game-table-chip-container">{renderChips}</div>
              )}
            </motion.div>
          </div>

          {/* Apostas atuais */}
          <div
            className="game-table-bets-display"
            style={
              isLandscape
                ? {
                    gap: "2px",
                    fontSize: "0.4rem",
                    paddingTop: "1px",
                    paddingBottom: "1px",
                    paddingLeft: "4px",
                    paddingRight: "4px",
                    marginTop: "2px",
                    flexWrap: "nowrap",
                  }
                : {}
            }
          >
            <motion.span
              className="game-table-bet game-table-bet-player"
              key={`player-bet-${playerBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: playerBet > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={
                isLandscape
                  ? {
                      paddingTop: "1px",
                      paddingBottom: "1px",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      fontSize: "0.4rem",
                    }
                  : {}
              }
            >
              👤 ${playerBet}
            </motion.span>
            <motion.span
              className="game-table-bet game-table-bet-cpu"
              key={`cpu-bet-${cpuBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: cpuBet > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={
                isLandscape
                  ? {
                      paddingTop: "1px",
                      paddingBottom: "1px",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      fontSize: "0.4rem",
                    }
                  : {}
              }
            >
              🤖 ${cpuBet}
            </motion.span>
            {currentBet > 0 && (
              <span
                className="game-table-current-bet"
                style={
                  isLandscape
                    ? {
                        fontSize: "0.4rem",
                        paddingTop: "1px",
                        paddingBottom: "1px",
                        paddingLeft: "4px",
                        paddingRight: "4px",
                      }
                    : {}
                }
              >
                📊 Aposta: ${currentBet}
              </span>
            )}
          </div>
        </div>

        {/* Cartas do jogador */}
        <div
          className="game-table-player-area game-table-player-area-player"
          style={getPlayerAreaStyles()}
        >
          <div
            className="game-table-player-label"
            style={
              isLandscape
                ? {
                    fontSize: "0.45rem",
                    gap: "2px",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }
                : {}
            }
          >
            🃏{" "}
            <span
              className="game-table-player-name"
              style={isLandscape ? { fontSize: "0.5rem" } : {}}
            >
              {playerDisplayName}
            </span>
            <motion.span
              className="game-table-chips-label"
              key={`player-bet-label-${playerBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: playerBet > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={isLandscape ? { fontSize: "0.4rem" } : {}}
            >
              💰 {playerBet}
            </motion.span>
            {isMultiplayer && (
              <span
                className="game-table-player-counter"
                style={
                  isLandscape
                    ? {
                        fontSize: "0.4rem",
                        paddingTop: "1px",
                        paddingBottom: "1px",
                        paddingLeft: "6px",
                        paddingRight: "6px",
                      }
                    : {}
                }
              >
                {currentPlayerIndex + 1}/{multiplayerPlayers?.length || 1}
              </span>
            )}
          </div>
          <div
            className="game-table-cards-row"
            style={
              isLandscape
                ? {
                    gap: "2px",
                    minHeight: "30px",
                    marginTop: "2px",
                  }
                : {}
            }
          >
            {playerCards && playerCards.length > 0 ? (
              playerCards.map((card, i) => (
                <Card
                  key={`player-${i}-${card.rank}${card.suit}`}
                  card={card}
                  delay={i * 120 + 80}
                  size={isLandscape ? "tiny" : "normal"}
                  isHighlighted={stage === "showdown" || stage === "flop"}
                />
              ))
            ) : (
              <span
                className="game-table-empty-cards-text"
                style={
                  isLandscape
                    ? {
                        fontSize: "0.45rem",
                        paddingTop: "4px",
                        paddingBottom: "4px",
                        paddingLeft: "8px",
                        paddingRight: "8px",
                      }
                    : {}
                }
              >
                🔒 ???
              </span>
            )}
          </div>
          {playerHandName && (
            <motion.div
              className="game-table-hand-badge game-table-hand-badge-player"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={
                isLandscape
                  ? {
                      fontSize: "0.4rem",
                      paddingTop: "1px",
                      paddingBottom: "1px",
                      paddingLeft: "4px",
                      paddingRight: "4px",
                      marginTop: "1px",
                    }
                  : {}
              }
            >
              {playerHandName}
            </motion.div>
          )}
        </div>

        {/* Controles de multiplayer */}
        {isMultiplayer &&
          multiplayerPlayers &&
          multiplayerPlayers.length > 1 && (
            <div
              className="game-table-multiplayer-controls"
              style={
                isLandscape
                  ? {
                      display: "none",
                    }
                  : {}
              }
            >
              {multiplayerPlayers.map((player, index) => (
                <motion.button
                  key={`mp-${index}-${player.name}`}
                  onClick={() => onSwitchPlayer?.(index)}
                  className={
                    index === currentPlayerIndex
                      ? "game-table-multiplayer-btn-active"
                      : "game-table-multiplayer-btn"
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {index === currentPlayerIndex ? "▶" : "○"} {player.name}
                </motion.button>
              ))}
            </div>
          )}
      </div>
    </motion.div>
  );
});

// ====================== ESTILOS ======================

function tableContainerStyle() {
  return {
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
    paddingTop: "10px",
    paddingBottom: "10px",
    paddingLeft: "10px",
    paddingRight: "10px",
    borderRadius: 60,
    background: "var(--bg-table)",
    boxShadow: "var(--table-shadow)",
    transition: "var(--transition-theme)",
  };
}

function emptyCardSlotStyle() {
  return {
    width: "calc(var(--card-width) * 1.1667)",
    height: "calc(var(--card-height) * 1.1667)",
    borderRadius: 8,
    background: "var(--bg-empty-card)",
    border: "2px dashed var(--border-empty-card)",
    marginTop: "0px",
    marginBottom: "0px",
    marginLeft: "3px",
    marginRight: "3px",
    transition: "var(--transition-theme)",
  };
}

function potDisplayStyle() {
  return {
    color: "var(--text-white)",
    fontSize: "1rem",
    fontWeight: "bold",
    background: "var(--bg-pot)",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "20px",
    paddingRight: "20px",
    borderRadius: 20,
    display: "inline-block",
    position: "relative",
    border: "1px solid var(--border-gold)",
    backdropFilter: "blur(4px)",
    minWidth: "120px",
    textAlign: "center",
    boxShadow: "0 2px 8px var(--shadow-element)",
    transition: "var(--transition-theme)",
  };
}

function chipStyle(index) {
  const colors = ["#ffd700", "#ff6b35", "#4caf50", "#2196f3", "#e91e63"];
  const color = colors[index % colors.length];
  return {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    background: `radial-gradient(circle at 35% 35%, ${color}, ${adjustColor(color, -50)})`,
    border: "2px solid rgba(255,255,255,0.15)",
    boxShadow: "0 2px 6px var(--shadow-chip)",
  };
}

function adjustColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default GameTable;
