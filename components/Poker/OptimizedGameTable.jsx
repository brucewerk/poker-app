// components/Poker/OptimizedGameTable.jsx
"use client";

import { memo, useMemo, useCallback } from "react";
import Card from "./Card.jsx";

const OptimizedGameTable = memo(function OptimizedGameTable({
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
  // ========== MEMOIZAÇÃO DE CÁLCULOS PESADOS ==========
  const playerCardData = useMemo(() => {
    return playerCards.map((card, i) => ({
      ...card,
      key: `player-${i}-${card.rank}${card.suit}`,
      delay: i * 120 + 80,
    }));
  }, [playerCards]);

  const cpuCardData = useMemo(() => {
    return cpuCards.map((card, i) => ({
      ...card,
      key: `cpu-${i}-${card.rank}${card.suit}`,
      delay: i * 120,
    }));
  }, [cpuCards]);

  const communityCardData = useMemo(() => {
    return communityCards.map((card, i) => ({
      ...card,
      key: `community-${i}-${card.rank}${card.suit}`,
      delay: i * 100,
    }));
  }, [communityCards]);

  // ========== HANDLERS MEMOIZADOS ==========
  const handleCardClick = useCallback((card) => {
    console.log("🎴 Carta clicada:", card);
  }, []);

  const handleSwitchPlayerMemo = useCallback(
    (index) => {
      if (onSwitchPlayer) {
        onSwitchPlayer(index);
      }
    },
    [onSwitchPlayer],
  );

  // ========== RENDER ==========
  return (
    <div className="game-table-container" style={tableContainerStyle()}>
      <div className="game-table-felt" style={tableFeltStyle()}>
        {/* Cartas da CPU */}
        <div
          className="game-table-player-area game-table-player-area-cpu"
          style={cpuAreaStyle()}
        >
          <div className="game-table-player-label">
            <span className="game-table-player-label-text">🤖 CPU</span>
            <span className="game-table-chips-label">💰 {cpuBet}</span>
            <span className="game-table-dealer-inline">🎯 DEALER</span>
            {isTurbo && (
              <span className="game-table-turbo-inline">🚀 TURBO</span>
            )}
          </div>
          <div className="game-table-cards-row">
            {cpuCardData.length > 0 ? (
              cpuCardData.map((card) => (
                <Card
                  key={card.key}
                  card={card}
                  faceDown={!showCpuCards}
                  delay={card.delay}
                  isRevealing={stage === "showdown"}
                  size="small"
                  onClick={() => handleCardClick(card)}
                />
              ))
            ) : (
              <span className="game-table-empty-cards-text">🔒 ???</span>
            )}
          </div>
          {cpuHandName && (
            <div className="game-table-hand-badge game-table-hand-badge-cpu">
              {cpuHandName}
            </div>
          )}
          {cpuThought && (
            <div className="game-table-cpu-thought">
              <span className="game-table-thought-icon">💭</span> {cpuThought}
            </div>
          )}
        </div>

        {/* Cartas comunitárias */}
        <div className="game-table-community-area" style={communityAreaStyle()}>
          <div className="game-table-community-label-wrapper">
            <span className="game-table-community-label">🔥 MESA</span>
            <span className="game-table-stage-badge">
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
            </span>
          </div>
          <div className="game-table-community-cards-row">
            {communityCardData.length > 0
              ? communityCardData.map((card) => (
                  <Card
                    key={card.key}
                    card={card}
                    delay={card.delay}
                    size="large"
                    isHighlighted={stage === "showdown"}
                    onClick={() => handleCardClick(card)}
                  />
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

          {/* Área do pote */}
          <div className="game-table-pot-area">
            <div className="game-table-pot" style={potDisplayStyle()}>
              <span className="game-table-pot-text">💰 Pote: ${pot}</span>
            </div>
          </div>

          {/* Apostas atuais */}
          <div className="game-table-bets-display">
            <span className="game-table-bet game-table-bet-player">
              👤 ${playerBet}
            </span>
            <span className="game-table-bet game-table-bet-cpu">
              🤖 ${cpuBet}
            </span>
            {currentBet > 0 && (
              <span className="game-table-current-bet">
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
            <span className="game-table-player-name">
              {currentUser || "Jogador"}
            </span>
            <span className="game-table-chips-label">💰 {playerBet}</span>
            {isMultiplayer && (
              <span className="game-table-player-counter">
                {currentPlayerIndex + 1}/{multiplayerPlayers?.length || 1}
              </span>
            )}
          </div>
          <div className="game-table-cards-row">
            {playerCardData.length > 0 ? (
              playerCardData.map((card) => (
                <Card
                  key={card.key}
                  card={card}
                  delay={card.delay}
                  size="normal"
                  isHighlighted={stage === "showdown" || stage === "flop"}
                  onClick={() => handleCardClick(card)}
                />
              ))
            ) : (
              <span className="game-table-empty-cards-text">🔒 ???</span>
            )}
          </div>
          {playerHandName && (
            <div className="game-table-hand-badge game-table-hand-badge-player">
              {playerHandName}
            </div>
          )}
        </div>

        {/* Controles de multiplayer */}
        {isMultiplayer &&
          multiplayerPlayers &&
          multiplayerPlayers.length > 1 && (
            <div className="game-table-multiplayer-controls">
              {multiplayerPlayers.map((player, index) => (
                <button
                  key={`mp-${index}-${player.name}`}
                  onClick={() => handleSwitchPlayerMemo(index)}
                  className={
                    index === currentPlayerIndex
                      ? "game-table-multiplayer-btn-active"
                      : "game-table-multiplayer-btn"
                  }
                >
                  {index === currentPlayerIndex ? "▶" : "○"} {player.name}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
});

OptimizedGameTable.displayName = "OptimizedGameTable";

// ========== ESTILOS ==========
function tableContainerStyle() {
  return {
    width: "100%",
    maxWidth: 1000,
    margin: "0 auto",
    padding: "10px",
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
    padding: "30px 20px",
    position: "relative",
    minHeight: 500,
    border: "3px solid var(--border-felt)",
    boxShadow: "inset 0 0 60px var(--shadow-felt)",
    transition: "var(--transition-theme)",
  };
}

function cpuAreaStyle() {
  return {
    textAlign: "center",
    marginBottom: "20px",
    padding: "10px",
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
    marginTop: "20px",
    padding: "10px",
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
    padding: "15px",
    background: "rgba(0, 0, 0, 0.10)",
    borderRadius: 25,
    margin: "10px 0",
    border: "1px solid var(--border-gold)",
    position: "relative",
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
    margin: "0 3px",
    transition: "var(--transition-theme)",
  };
}

function potDisplayStyle() {
  return {
    color: "var(--text-white)",
    fontSize: "1rem",
    fontWeight: "bold",
    background: "var(--bg-pot)",
    padding: "8px 20px",
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

export default OptimizedGameTable;
