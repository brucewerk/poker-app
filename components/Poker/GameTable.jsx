// components/Poker/GameTable.jsx - COMPLETO CORRIGIDO (MODO CLARO LEGÍVEL)
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
  // 🔥 Otimização: Evitar re-renders desnecessários
  const memoizedCommunityCards = useMemo(() => communityCards, [communityCards]);
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

  return (
    <motion.div
      className="game-table-container"
      style={tableContainerStyle()}
      variants={tableGlowVariants}
      animate={tableState}
      initial="idle"
    >
      <div className="game-table-felt" style={tableFeltStyle()}>
        {/* Cartas da CPU */}
        <div
          className="game-table-player-area game-table-player-area-cpu"
          style={{
            ...cpuAreaStyle(),
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Área do dealer com Turbo integrado */}
          <div className="game-table-dealer" style={{
            ...dealerAreaStyle(),
            position: "relative",
            top: "auto",
            left: "auto",
            transform: "none",
            padding: "3px 10px",
            fontSize: "0.7rem",
            alignSelf: "flex-start",
          }}>
            <motion.span
              className="game-table-dealer-text"
              animate={{
                opacity: [0.7, 0.9, 0.7],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: "0.7rem" }}
            >
              🎯 DEALER
            </motion.span>
            {isTurbo && (
              <motion.span
                style={{
                  marginLeft: "8px",
                  padding: "3px 10px",
                  borderRadius: "8px",
                  background: "rgba(34, 197, 94, 0.3)",
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                  color: "#22c55e",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                🚀 TURBO
              </motion.span>
            )}
          </div>

          {/* CPU e suas fichas */}
          <div className="game-table-player-label" style={{ fontSize: "0.75rem" }}>
            <span className="game-table-player-label-text">🤖 CPU</span>
            <motion.span
              className="game-table-chips-label"
              key={`cpu-bet-${cpuBet}-${Date.now()}`}
              initial={{ scale: 1 }}
              animate={{ scale: cpuBet > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: "0.7rem" }}
            >
              💰 {cpuBet}
            </motion.span>
          </div>

          {/* Cartas da CPU */}
          <div className="game-table-cards-row" style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
            {cpuCards && cpuCards.length > 0 ? (
              cpuCards.map((card, i) => (
                <Card
                  key={`cpu-${i}-${card.rank}${card.suit}`}
                  card={card}
                  faceDown={!showCpuCards}
                  delay={i * 120}
                  isRevealing={stage === "showdown"}
                  size="small"
                />
              ))
            ) : (
              <span className="game-table-empty-cards-text">🔒 ???</span>
            )}
          </div>

          {/* Pensamentos da CPU */}
          {cpuThought && (
            <motion.div
              className="game-table-cpu-thought"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: "0.65rem" }}
            >
              <span className="game-table-thought-icon">�</span> {cpuThought}
            </motion.div>
          )}

          {cpuHandName && (
            <motion.div
              className="game-table-hand-badge game-table-hand-badge-cpu"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ fontSize: "0.65rem", padding: "2px 6px" }}
            >
              {cpuHandName}
            </motion.div>
          )}
        </div>

        {/* Cartas comunitárias */}
        <div className="game-table-community-area" style={communityAreaStyle()}>
          <div className="game-table-community-label-wrapper">
            <span className="game-table-community-label">🔥 MESA</span>
            <motion.span
              className="game-table-stage-badge"
              key={`stage-${stage}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
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
          <div className="game-table-community-cards-row">
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
                      size="large"
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
                      style={emptyCardSlotStyle()}
                    />
                  ))}
          </div>

          {/* Área do pote e apostas em linha única */}
          <div className="game-table-info-row" style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "6px",
            flexWrap: "wrap",
          }}>
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
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <motion.span
                className="game-table-pot-text"
                animate={{
                  scale: showPotEffect ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                style={{ fontSize: "0.85rem" }}
              >
                💰 Pote: ${pot}
              </motion.span>
            </motion.div>

            {shouldRenderChips && (
              <div className="game-table-chip-container" style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                marginLeft: "4px",
              }}>{renderChips}</div>
            )}

            <motion.span
              className="game-table-bet game-table-bet-player"
              key={`player-bet-${playerBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: playerBet > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: "0.8rem" }}
            >
              👤 ${playerBet}
            </motion.span>
            <motion.span
              className="game-table-bet game-table-bet-cpu"
              key={`cpu-bet-${cpuBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: cpuBet > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: "0.8rem" }}
            >
              🤖 ${cpuBet}
            </motion.span>
            {currentBet > 0 && (
              <span className="game-table-current-bet" style={{ fontSize: "0.8rem" }}>
                📊 Aposta: ${currentBet}
              </span>
            )}
          </div>
        </div>

        {/* Cartas do jogador */}
        <div
          className="game-table-player-area game-table-player-area-player"
          style={playerAreaStyle()}
        >
          <div className="game-table-player-label">
            🃏{" "}
            <span className="game-table-player-name">{playerDisplayName}</span>
            <motion.span
              className="game-table-chips-label"
              key={`player-bet-label-${playerBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: playerBet > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              💰 {playerBet}
            </motion.span>
            {isMultiplayer && (
              <span className="game-table-player-counter">
                {currentPlayerIndex + 1}/{multiplayerPlayers?.length || 1}
              </span>
            )}
          </div>
          <div className="game-table-cards-row">
            {playerCards && playerCards.length > 0 ? (
              playerCards.map((card, i) => (
                <Card
                  key={`player-${i}-${card.rank}${card.suit}`}
                  card={card}
                  delay={i * 120 + 80}
                  size="normal"
                  isHighlighted={stage === "showdown" || stage === "flop"}
                />
              ))
            ) : (
              <span className="game-table-empty-cards-text">🔒 ???</span>
            )}
          </div>
          {playerHandName && (
            <motion.div
              className="game-table-hand-badge game-table-hand-badge-player"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {playerHandName}
            </motion.div>
          )}
        </div>

        {/* Controles de multiplayer */}
        {isMultiplayer &&
          multiplayerPlayers &&
          multiplayerPlayers.length > 1 && (
            <div className="game-table-multiplayer-controls">
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
    maxWidth: 900,
    margin: "0 auto",
    padding: "2px",
    borderRadius: 60,
    background: "var(--bg-table)",
    boxShadow: "var(--table-shadow)",
    transition: "var(--transition-theme)",
  };
}

function tableFeltStyle() {
  return {
    background: "var(--bg-felt)",
    borderRadius: 50,
    padding: "16px 14px",
    position: "relative",
    minHeight: 340,
    border: "3px solid var(--border-felt)",
    boxShadow: "inset 0 0 60px var(--shadow-felt)",
    transition: "var(--transition-theme)",
  };
}

function dealerAreaStyle() {
  return {
    position: "absolute",
    top: 4,
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--bg-element)",
    padding: "3px 12px",
    borderRadius: 24,
    border: "1px solid var(--border-element)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 12px var(--shadow-element), 0 2px 6px rgba(0,0,0,0.05)",
    transition: "var(--transition-theme)",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    zIndex: 100,
  };
}

function cpuAreaStyle() {
  return {
    textAlign: "center",
    marginBottom: "8px",
    padding: "6px",
    background: "var(--bg-status-item)",
    borderRadius: 20,
    border: "1px solid var(--border-element)",
    boxShadow: "0 2px 8px var(--shadow-element)",
    transition: "var(--transition-theme)",
  };
}

function playerAreaStyle() {
  return {
    textAlign: "center",
    marginTop: "8px",
    padding: "6px",
    background: "var(--bg-status-item)",
    borderRadius: 20,
    border: "1px solid var(--border-element)",
    boxShadow: "0 2px 8px var(--shadow-element)",
    transition: "var(--transition-theme)",
  };
}

function communityAreaStyle() {
  return {
    textAlign: "center",
    padding: "4px",
    background: "rgba(0, 0, 0, 0.10)",
    borderRadius: 25,
    margin: "3px 0",
    border: "1px solid var(--border-gold)",
    position: "relative",
    transition: "var(--transition-theme)",
  };
}

function emptyCardSlotStyle() {
  return {
    width: 75,
    height: 105,
    borderRadius: 8,
    background: "var(--bg-empty-card)",
    border: "2px dashed var(--border-empty-card)",
    margin: "0 3px",
    transition: "var(--transition-theme)",
  };
}

function potDisplayStyle() {
  return {
    color: "var(--text-white)",
    fontSize: "0.8rem",
    fontWeight: "bold",
    background: "var(--bg-pot)",
    padding: "4px 10px",
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
