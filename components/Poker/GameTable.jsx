// components/Poker/GameTable.jsx - CORREÇÃO DO NOME DO JOGADOR
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
  currentUser, // 🔥 NOVO: Receber o usuário atual
}) {
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
        boxShadow: "0 0 40px rgba(0,200,0,0.08)",
      },
      active: {
        boxShadow: "0 0 60px rgba(0,200,0,0.2)",
      },
      showdown: {
        boxShadow: [
          "0 0 40px rgba(255,215,0,0.1)",
          "0 0 80px rgba(255,215,0,0.3)",
          "0 0 40px rgba(255,215,0,0.1)",
        ],
        transition: { duration: 1.5, repeat: Infinity },
      },
      allin: {
        boxShadow: [
          "0 0 40px rgba(255,0,0,0.1)",
          "0 0 80px rgba(255,0,0,0.3)",
          "0 0 40px rgba(255,0,0,0.1)",
        ],
        transition: { duration: 0.8, repeat: Infinity },
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
  }, [pot]);

  const shouldRenderChips = pot > 0 && pot < 5000;

  // 🔥 DETERMINAR O NOME DO JOGADOR
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
      style={tableContainerStyle()}
      variants={tableGlowVariants}
      animate={tableState}
      initial="idle"
    >
      <div style={tableFeltStyle()}>
        {/* Área do dealer */}
        <div style={dealerAreaStyle()}>
          <motion.span
            style={dealerLabelStyle()}
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎯 DEALER
          </motion.span>
        </div>

        {/* Cartas da CPU */}
        <div style={cpuAreaStyle()}>
          <div style={playerLabelStyle()}>
            🤖 CPU
            <motion.span
              style={chipsLabelStyle()}
              key={`cpu-bet-${cpuBet}-${Date.now()}`}
              initial={{ scale: 1 }}
              animate={{ scale: cpuBet > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              💰 {cpuBet}
            </motion.span>
          </div>
          <div style={cardsRowStyle()}>
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
              <span style={emptyCardsStyle()}>Aguardando...</span>
            )}
          </div>
          {cpuHandName && (
            <motion.div
              style={handBadgeStyle()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {cpuHandName}
            </motion.div>
          )}
          {cpuThought && (
            <motion.div
              style={thoughtBubbleStyle()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span style={{ opacity: 0.5 }}>💭</span> {cpuThought}
            </motion.div>
          )}
        </div>

        {/* Cartas comunitárias */}
        <div style={communityAreaStyle()}>
          <div style={communityLabelStyle()}>
            🔥 MESA
            <motion.span
              style={stageBadgeStyle()}
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
          <div style={communityCardsRowStyle()}>
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
                    <div key={`empty-${i}`} style={emptyCardSlotStyle()} />
                  ))}
          </div>

          {/* Área do pote */}
          <div style={potAreaStyle()}>
            <motion.div
              key={`pot-${potAnimationKey}`}
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
              style={potDisplayStyle()}
            >
              <motion.span
                style={{ color: "gold", fontWeight: "bold" }}
                animate={{
                  scale: showPotEffect ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                💰 Pote: ${pot}
              </motion.span>
              {shouldRenderChips && (
                <div style={chipContainerStyle()}>{renderChips}</div>
              )}
            </motion.div>
          </div>

          {/* Apostas atuais */}
          <div style={betsDisplayStyle()}>
            <motion.span
              style={betDisplayStyle(true)}
              key={`player-bet-${playerBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: playerBet > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              👤 ${playerBet}
            </motion.span>
            <motion.span
              style={betDisplayStyle(false)}
              key={`cpu-bet-${cpuBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: cpuBet > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              🤖 ${cpuBet}
            </motion.span>
            {currentBet > 0 && (
              <span style={currentBetStyle()}>📊 Aposta: ${currentBet}</span>
            )}
          </div>
        </div>

        {/* 🔥 CARTAS DO JOGADOR - CORRIGIDO */}
        <div style={playerAreaStyle()}>
          <div style={playerLabelStyle()}>
            🃏{" "}
            <span style={playerNameHighlightStyle()}>{playerDisplayName}</span>
            <motion.span
              style={chipsLabelStyle()}
              key={`player-bet-label-${playerBet}`}
              initial={{ scale: 1 }}
              animate={{ scale: playerBet > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              💰 {playerBet}
            </motion.span>
            {isMultiplayer && (
              <span style={playerCounterStyle()}>
                {currentPlayerIndex + 1}/{multiplayerPlayers?.length || 1}
              </span>
            )}
          </div>
          <div style={cardsRowStyle()}>
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
              <span style={emptyCardsStyle()}>Aguardando...</span>
            )}
          </div>
          {playerHandName && (
            <motion.div
              style={handBadgeStyle(true)}
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
            <div style={multiplayerControlsStyle()}>
              {multiplayerPlayers.map((player, index) => (
                <motion.button
                  key={`mp-${index}-${player.name}`}
                  onClick={() => onSwitchPlayer?.(index)}
                  style={multiplayerButtonStyle(index === currentPlayerIndex)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {index === currentPlayerIndex ? "▶" : "○"} {player.name}
                </motion.button>
              ))}
            </div>
          )}

        {/* Modo Turbo indicador */}
        {isTurbo && (
          <motion.div
            style={turboBadgeStyle()}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            🚀 TURBO
          </motion.div>
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
    padding: "10px",
    borderRadius: 60,
    background: "radial-gradient(ellipse at center, #1a3a1a, #0a1a0a)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,100,0,0.1)",
  };
}

function tableFeltStyle() {
  return {
    background: "radial-gradient(ellipse at center, #1a6a3a, #0a3a1a)",
    borderRadius: 50,
    padding: "30px 20px",
    position: "relative",
    minHeight: 500,
    border: "3px solid #2a2a1a",
    boxShadow: "inset 0 0 60px rgba(0,0,0,0.5)",
  };
}

function dealerAreaStyle() {
  return {
    position: "absolute",
    top: 10,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(255,215,0,0.12)",
    padding: "4px 20px",
    borderRadius: 20,
    border: "1px solid rgba(255,215,0,0.2)",
    backdropFilter: "blur(4px)",
  };
}

function dealerLabelStyle() {
  return {
    color: "gold",
    fontSize: "0.7rem",
    fontWeight: "bold",
    letterSpacing: "2px",
  };
}

function cpuAreaStyle() {
  return {
    textAlign: "center",
    marginBottom: "20px",
    padding: "10px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.05)",
  };
}

function playerAreaStyle() {
  return {
    textAlign: "center",
    marginTop: "20px",
    padding: "10px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.05)",
  };
}

function communityAreaStyle() {
  return {
    textAlign: "center",
    padding: "15px",
    background: "rgba(0,0,0,0.15)",
    borderRadius: 25,
    margin: "10px 0",
    border: "1px solid rgba(255,215,0,0.08)",
    position: "relative",
  };
}

function playerLabelStyle() {
  return {
    color: "#ffefb9",
    fontSize: "0.8rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  };
}

function playerNameHighlightStyle() {
  return {
    color: "#4caf50",
    fontWeight: "bold",
    fontSize: "0.85rem",
  };
}

function chipsLabelStyle() {
  return {
    color: "gold",
    fontSize: "0.7rem",
    display: "inline-block",
  };
}

function playerCounterStyle() {
  return {
    color: "#4caf50",
    fontSize: "0.6rem",
    background: "rgba(76,175,80,0.2)",
    padding: "2px 8px",
    borderRadius: 10,
  };
}

function cardsRowStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "5px",
    minHeight: 80,
    alignItems: "center",
  };
}

function communityCardsRowStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    minHeight: 110,
    alignItems: "center",
  };
}

function communityLabelStyle() {
  return {
    color: "#aaa",
    fontSize: "0.7rem",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  };
}

function stageBadgeStyle() {
  return {
    color: "#ffd700",
    fontSize: "0.6rem",
    background: "rgba(255,215,0,0.1)",
    padding: "2px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,215,0,0.15)",
  };
}

function emptyCardSlotStyle() {
  return {
    width: 75,
    height: 105,
    borderRadius: 8,
    background:
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.005) 10px, rgba(255,255,255,0.005) 20px)",
    border: "2px dashed rgba(255,255,255,0.05)",
    margin: "0 3px",
  };
}

function handBadgeStyle(isPlayer = false) {
  return {
    background: isPlayer ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: "0.7rem",
    marginTop: "6px",
    display: "inline-block",
    color: isPlayer ? "#4caf50" : "#ff9800",
    fontWeight: "bold",
    border: `1px solid ${isPlayer ? "rgba(76,175,80,0.2)" : "rgba(255,152,0,0.2)"}`,
    backdropFilter: "blur(4px)",
  };
}

function thoughtBubbleStyle() {
  return {
    background: "rgba(26,26,10,0.8)",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: "0.65rem",
    marginTop: "4px",
    display: "inline-block",
    color: "#ccaa66",
    fontStyle: "italic",
    border: "1px solid rgba(255,215,0,0.08)",
    maxWidth: "90%",
    backdropFilter: "blur(4px)",
  };
}

function potAreaStyle() {
  return {
    marginTop: "10px",
    position: "relative",
  };
}

function potDisplayStyle() {
  return {
    color: "gold",
    fontSize: "1rem",
    fontWeight: "bold",
    background: "rgba(0,0,0,0.25)",
    padding: "8px 20px",
    borderRadius: 20,
    display: "inline-block",
    position: "relative",
    border: "1px solid rgba(255,215,0,0.1)",
    backdropFilter: "blur(4px)",
    minWidth: "120px",
    textAlign: "center",
  };
}

function chipContainerStyle() {
  return {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
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
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  };
}

function betsDisplayStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "8px",
    fontSize: "0.7rem",
    color: "#aaa",
    flexWrap: "wrap",
  };
}

function betDisplayStyle(isPlayer) {
  return {
    color: isPlayer ? "#4caf50" : "#ff9800",
    fontWeight: "bold",
    background: "rgba(0,0,0,0.15)",
    padding: "2px 12px",
    borderRadius: 12,
  };
}

function currentBetStyle() {
  return {
    color: "#ffd700",
    fontWeight: "bold",
    background: "rgba(255,215,0,0.05)",
    padding: "2px 12px",
    borderRadius: 12,
  };
}

function emptyCardsStyle() {
  return {
    color: "#666",
    fontSize: "0.8rem",
  };
}

function multiplayerControlsStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "15px",
    flexWrap: "wrap",
  };
}

function multiplayerButtonStyle(isActive) {
  return {
    background: isActive ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)",
    border: isActive ? "1px solid gold" : "1px solid rgba(255,255,255,0.05)",
    color: isActive ? "gold" : "#888",
    padding: "4px 12px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: "0.7rem",
    transition: "all 0.3s ease",
  };
}

function turboBadgeStyle() {
  return {
    position: "absolute",
    top: "50%",
    right: 20,
    transform: "translateY(-50%)",
    color: "#ff9800",
    fontSize: "0.8rem",
    fontWeight: "bold",
    background: "rgba(255,152,0,0.12)",
    padding: "4px 14px",
    borderRadius: 20,
    border: "1px solid rgba(255,152,0,0.2)",
    backdropFilter: "blur(4px)",
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
