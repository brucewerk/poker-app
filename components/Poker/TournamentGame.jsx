// components/Poker/TournamentGame.jsx - CORREÇÃO
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TournamentGame({ tournament, onLeave, username }) {
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [currentUser, setCurrentUser] = useState(username);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const startAttempted = useRef(false);

  // 🔥 FUNÇÃO PARA INICIAR O JOGO
  const startGame = useCallback(async () => {
    if (isStarting || startAttempted.current) return;

    setIsStarting(true);
    startAttempted.current = true;

    try {
      const res = await fetch("/api/tournaments/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: tournament._id }),
      });

      const data = await res.json();
      if (data.success && isMounted.current) {
        setGameState(data.gameState);
        setPlayers(data.gameState?.players || []);
        setLoading(false);
        setNotification("✅ Jogo iniciado!");
        setTimeout(() => setNotification(""), 2000);
      } else {
        setNotification(`❌ ${data.error || "Erro ao iniciar jogo"}`);
        setTimeout(() => setNotification(""), 3000);
      }
    } catch (error) {
      console.error("Erro ao iniciar jogo:", error);
      setNotification("❌ Erro ao iniciar jogo");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setIsStarting(false);
    }
  }, [tournament._id]);

  // 🔥 BUSCAR ESTADO DO JOGO
  const fetchGameState = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const res = await fetch(
        `/api/tournaments/game?tournamentId=${tournament._id}`,
      );
      const data = await res.json();

      if (data.success && isMounted.current) {
        // 🔥 Se o jogo já existe, carregar
        if (data.gameState) {
          setGameState(data.gameState);
          setPlayers(data.gameState?.players || []);
          setLoading(false);

          // 🔥 Verificar se o torneio terminou
          if (data.gameState?.status === "finished") {
            setShowResult(true);
            setResultData(data.gameState);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }

          // 🔥 Notificações
          if (
            data.gameState?.lastAction &&
            data.gameState?.lastAction !== notification
          ) {
            setNotification(data.gameState.lastAction);
            setTimeout(() => setNotification(""), 3000);
          }

          return;
        }

        // 🔥 Se não tem gameState e o torneio está ativo, iniciar
        if (data.tournament?.status === "active" && !data.gameState) {
          // Verificar se há pelo menos 2 jogadores
          const activePlayers =
            data.tournament.players?.filter((p) => !p.isEliminated) || [];
          if (activePlayers.length >= 2) {
            await startGame();
          } else {
            setLoading(false);
            setNotification("⏳ Aguardando mais jogadores... (mínimo 2)");
          }
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar estado do jogo:", error);
      setLoading(false);
    }
  }, [tournament._id, startGame, notification]);

  // 🔥 ATUALIZAR TURNO
  useEffect(() => {
    if (gameState && currentUser) {
      const currentPlayer = gameState.players?.find(
        (p) => p.username === currentUser,
      );
      const isTurn =
        gameState.players?.[gameState.currentTurn]?.username === currentUser;
      setIsMyTurn(
        isTurn && !currentPlayer?.isEliminated && !currentPlayer?.isFolded,
      );
    }
  }, [gameState, currentUser]);

  // 🔥 POLLING
  useEffect(() => {
    isMounted.current = true;
    startAttempted.current = false;

    // 🔥 Carregar estado inicial
    fetchGameState();

    // 🔥 Polling a cada 2 segundos
    intervalRef.current = setInterval(() => {
      if (isMounted.current && !showResult) {
        fetchGameState();
      }
    }, 2000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchGameState, showResult]);

  // 🔥 ENVIAR AÇÃO
  const sendAction = async (action, amount = 0) => {
    if (actionLoading || !isMyTurn) return;

    setActionLoading(true);

    try {
      const res = await fetch("/api/tournaments/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament._id,
          username: currentUser,
          action,
          amount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchGameState();
        setNotification(`✅ ${action} realizado!`);
        setTimeout(() => setNotification(""), 2000);
      } else {
        setNotification(`❌ ${data.error}`);
        setTimeout(() => setNotification(""), 3000);
      }
    } catch (error) {
      setNotification("❌ Erro ao enviar ação");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // 🔥 RENDERIZAR CARTAS
  const renderCards = (cards, isCurrentPlayer) => {
    if (!cards || cards.length === 0) {
      return <span style={cardPlaceholderStyle()}>🔒</span>;
    }

    return cards.map((card, i) => {
      const isRed = card.suit === "♥" || card.suit === "♦";
      return (
        <span key={i} style={cardStyle(isRed, !isCurrentPlayer)}>
          {isCurrentPlayer ? `${card.rank}${card.suit}` : "🔒"}
        </span>
      );
    });
  };

  // 🔥 RESULTADO DO TORNEIO
  if (showResult && resultData) {
    return (
      <div style={overlayStyle()}>
        <div style={resultModalStyle()}>
          <h2 style={resultTitleStyle()}>🏆 TORNEIO FINALIZADO!</h2>

          <div style={resultWinnerStyle()}>
            🎉 Vencedor: <strong>{resultData.winner}</strong>
          </div>

          <div style={resultPrizeStyle()}>
            💰 Prêmio: ${resultData.prizePool}
          </div>

          <div style={resultPlayersStyle()}>
            <h3>📊 Classificação Final</h3>
            {resultData.ranking?.map((player, index) => (
              <div key={index} style={resultPlayerItemStyle(index === 0)}>
                <span>#{index + 1}</span>
                <span>{player.username}</span>
                <span>💰 {player.chips}</span>
                {player.prize > 0 && (
                  <span style={resultPrizeBadgeStyle()}>+${player.prize}</span>
                )}
              </div>
            ))}
          </div>

          <button onClick={onLeave} style={resultButtonStyle()}>
            VOLTAR AO LOBBY
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={containerStyle()}>
        <div style={headerStyle()}>
          <h2>🏅 {tournament.name}</h2>
          <button onClick={onLeave} style={leaveButtonStyle()}>
            ✕ Sair
          </button>
        </div>
        <div style={loadingContainerStyle()}>
          <div style={loadingSpinnerStyle()}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              🃏
            </motion.div>
          </div>
          <p style={loadingTextStyle()}>Carregando jogo do torneio...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={containerStyle()}>
        <div style={headerStyle()}>
          <h2>🏅 {tournament.name}</h2>
          <button onClick={onLeave} style={leaveButtonStyle()}>
            ✕ Sair
          </button>
        </div>
        <div style={waitingContainerStyle()}>
          <div style={waitingIconStyle()}>⏳</div>
          <p style={waitingTextStyle()}>Aguardando início do jogo...</p>
          <p style={waitingSubTextStyle()}>
            {tournament.players?.filter((p) => !p.isEliminated)?.length || 0}{" "}
            jogadores inscritos
          </p>
          <button
            onClick={startGame}
            style={startGameButtonStyle()}
            disabled={isStarting}
          >
            {isStarting ? "⏳ Iniciando..." : "🚀 Iniciar Jogo"}
          </button>
        </div>
      </div>
    );
  }

  // 🔥 JOGO ATIVO
  const currentPlayer = gameState.players?.[gameState.currentTurn];
  const myPlayer = gameState.players?.find((p) => p.username === currentUser);
  const isEliminated = myPlayer?.isEliminated;

  return (
    <div style={containerStyle()}>
      <div style={headerStyle()}>
        <h2>🏅 {tournament.name}</h2>
        <button onClick={onLeave} style={leaveButtonStyle()}>
          ✕ Sair
        </button>
      </div>

      {notification && (
        <motion.div
          style={notificationStyle()}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {notification}
        </motion.div>
      )}

      <div style={infoStyle()}>
        <span>💰 Pote: {gameState.pot || 0}</span>
        <span>
          🎯 Blinds: {gameState.blinds?.smallBlind || 25}/
          {gameState.blinds?.bigBlind || 50}
        </span>
        <span>
          👥 Vivos:{" "}
          {gameState.players?.filter((p) => !p.isEliminated && !p.isFolded)
            .length || 0}
        </span>
        <span>📊 Fase: {gameState.phase || "preflop"}</span>
      </div>

      {/* Cartas Comunitárias */}
      <div style={communityStyle()}>
        <span style={communityLabelStyle()}>🔥 MESA</span>
        <div style={communityCardsStyle()}>
          {gameState.communityCards && gameState.communityCards.length > 0 ? (
            gameState.communityCards.map((card, i) => {
              const isRed = card.suit === "♥" || card.suit === "♦";
              return (
                <span key={i} style={cardStyle(isRed, false)}>
                  {card.rank}
                  {card.suit}
                </span>
              );
            })
          ) : (
            <span style={emptyCommunityStyle()}>Aguardando cartas...</span>
          )}
        </div>
      </div>

      {/* Jogadores */}
      <div style={playersGridStyle()}>
        {gameState.players?.map((player, index) => {
          const isCurrent = player.username === currentUser;
          const isTurn = gameState.currentTurn === index;
          const isEliminatedPlayer = player.isEliminated || player.isFolded;

          return (
            <motion.div
              key={index}
              style={playerCardStyle(isCurrent, isEliminatedPlayer, isTurn)}
              whileHover={{ scale: isCurrent ? 1.02 : 1 }}
            >
              <div style={playerNameStyle()}>
                {player.username}
                {isCurrent && " 👈"}
                {isTurn && !isEliminatedPlayer && " 🔥"}
                {isEliminatedPlayer && " 💀"}
              </div>
              <div style={playerChipsStyle()}>💰 {player.chips}</div>
              {player.bet > 0 && (
                <div style={playerBetStyle()}>Aposta: {player.bet}</div>
              )}
              <div style={playerCardsStyle()}>
                {player.cards && renderCards(player.cards, isCurrent)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Turno atual */}
      <div style={turnIndicatorStyle()}>
        {isEliminated ? (
          <span style={{ color: "#f44336", fontWeight: "bold" }}>
            💀 Você foi eliminado!
          </span>
        ) : isMyTurn ? (
          <motion.span
            style={{ color: "#4caf50", fontWeight: "bold" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🎯 É SUA VEZ!
          </motion.span>
        ) : (
          <span style={{ color: "#ff9800" }}>
            ⏳ Aguardando {currentPlayer?.username || "jogador"}...
          </span>
        )}
      </div>

      {/* Ações */}
      {isMyTurn && !isEliminated && (
        <div style={actionsStyle()}>
          <motion.button
            onClick={() => sendAction("fold")}
            style={actionButtonStyle("#f44336")}
            disabled={actionLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ❌ Fold
          </motion.button>
          <motion.button
            onClick={() => sendAction("check")}
            style={actionButtonStyle("#4caf50")}
            disabled={actionLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ✅ Check
          </motion.button>
          <motion.button
            onClick={() => sendAction("call")}
            style={actionButtonStyle("#ff9800")}
            disabled={actionLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💰 Call ({gameState.currentBet - (myPlayer?.bet || 0)})
          </motion.button>
          <motion.button
            onClick={() =>
              sendAction("raise", (gameState.currentBet || 50) + 50)
            }
            style={actionButtonStyle("#2196f3")}
            disabled={actionLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📈 Raise
          </motion.button>
          <motion.button
            onClick={() => sendAction("all-in")}
            style={actionButtonStyle("#9c27b0")}
            disabled={actionLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚡ All-in
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ====================== ESTILOS ======================
function containerStyle() {
  return {
    background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
    borderRadius: 30,
    padding: "20px",
    minHeight: "500px",
    color: "white",
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    margin: "20px",
    overflowY: "auto",
  };
}

function overlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: 20,
    backdropFilter: "blur(8px)",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  };
}

function leaveButtonStyle() {
  return {
    background: "rgba(244,67,54,0.3)",
    border: "1px solid #f44336",
    borderRadius: 20,
    padding: "8px 16px",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };
}

function infoStyle() {
  return {
    display: "flex",
    gap: "20px",
    padding: "15px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 15,
    marginBottom: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  };
}

function communityStyle() {
  return {
    textAlign: "center",
    padding: "15px",
    background: "rgba(0,0,0,0.15)",
    borderRadius: 15,
    marginBottom: "20px",
  };
}

function communityLabelStyle() {
  return {
    display: "block",
    fontSize: "0.7rem",
    color: "#aaa",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "2px",
  };
}

function communityCardsStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
  };
}

function emptyCommunityStyle() {
  return {
    color: "#666",
    fontSize: "0.9rem",
  };
}

function playersGridStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  };
}

function playerCardStyle(isCurrent, isEliminated, isTurn) {
  return {
    padding: "15px",
    borderRadius: 15,
    background: isCurrent ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
    border:
      isTurn && !isEliminated
        ? "2px solid gold"
        : "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    opacity: isEliminated ? 0.4 : 1,
    transition: "all 0.3s ease",
  };
}

function playerNameStyle() {
  return {
    fontWeight: "bold",
    fontSize: "0.9rem",
    marginBottom: "8px",
  };
}

function playerChipsStyle() {
  return {
    color: "#4caf50",
    fontSize: "0.8rem",
  };
}

function playerBetStyle() {
  return {
    color: "#ff9800",
    fontSize: "0.7rem",
    marginTop: "4px",
  };
}

function playerCardsStyle() {
  return {
    marginTop: "8px",
    display: "flex",
    justifyContent: "center",
    gap: "4px",
  };
}

function cardStyle(isRed, isFaceDown) {
  if (isFaceDown) {
    return {
      display: "inline-block",
      padding: "4px 8px",
      background: "#2b5797",
      borderRadius: 4,
      color: "white",
      fontSize: "0.7rem",
      fontWeight: "bold",
      minWidth: "30px",
    };
  }
  return {
    display: "inline-block",
    padding: "4px 8px",
    background: "white",
    borderRadius: 4,
    color: isRed ? "#c33" : "#1f2a2f",
    fontSize: "0.7rem",
    fontWeight: "bold",
    minWidth: "30px",
  };
}

function cardPlaceholderStyle() {
  return {
    display: "inline-block",
    padding: "4px 8px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    color: "#666",
    fontSize: "0.7rem",
    minWidth: "30px",
  };
}

function turnIndicatorStyle() {
  return {
    textAlign: "center",
    padding: "15px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    marginBottom: "20px",
    fontSize: "1.2rem",
  };
}

function actionsStyle() {
  return {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "10px",
  };
}

function actionButtonStyle(color) {
  return {
    background: color,
    border: "none",
    padding: "10px 20px",
    borderRadius: 30,
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
  };
}

function notificationStyle() {
  return {
    padding: "10px 20px",
    background: "rgba(255,215,0,0.15)",
    border: "1px solid gold",
    borderRadius: 15,
    color: "gold",
    textAlign: "center",
    marginBottom: "15px",
  };
}

function loadingContainerStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  };
}

function loadingSpinnerStyle() {
  return {
    fontSize: "3rem",
    marginBottom: "20px",
  };
}

function loadingTextStyle() {
  return {
    color: "#aaa",
    fontSize: "1rem",
  };
}

function waitingContainerStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: "16px",
  };
}

function waitingIconStyle() {
  return {
    fontSize: "4rem",
    animation: "pulse 1.5s ease-in-out infinite",
  };
}

function waitingTextStyle() {
  return {
    fontSize: "1.2rem",
    color: "#ffd700",
    fontWeight: "bold",
  };
}

function waitingSubTextStyle() {
  return {
    fontSize: "0.9rem",
    color: "#aaa",
  };
}

function startGameButtonStyle() {
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
    marginTop: "10px",
    transition: "all 0.3s ease",
  };
}

function emptyGameStyle() {
  return {
    textAlign: "center",
    color: "#aaa",
    fontSize: "1.2rem",
    padding: "40px",
  };
}

function resultModalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "30px 40px",
    borderRadius: 30,
    maxWidth: 500,
    width: "100%",
    color: "white",
    border: "3px solid gold",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  };
}

function resultTitleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 20px",
    fontSize: "1.8rem",
  };
}

function resultWinnerStyle() {
  return {
    textAlign: "center",
    fontSize: "1.3rem",
    color: "#ffd700",
    marginBottom: "15px",
  };
}

function resultPrizeStyle() {
  return {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#4caf50",
    marginBottom: "20px",
  };
}

function resultPlayersStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  };
}

function resultPlayerItemStyle(isWinner) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 15px",
    borderRadius: 10,
    background: isWinner ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
    border: isWinner ? "1px solid gold" : "1px solid rgba(255,255,255,0.05)",
  };
}

function resultPrizeBadgeStyle() {
  return {
    color: "#4caf50",
    fontWeight: "bold",
  };
}

function resultButtonStyle() {
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
