// components/Poker/OnlineGame.jsx - COMPLETO CORRIGIDO
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Chat from "./Chat.jsx";

function getRankDisplay(rank) {
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  if (rank === 14) return "A";
  return rank;
}

function CardDisplay({ card, faceDown = false }) {
  if (faceDown || !card) {
    return <span style={cardStyle(null, true)}>🔒</span>;
  }
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <span style={cardStyle(isRed, false)}>
      {getRankDisplay(card.rank)}
      {card.suit}
    </span>
  );
}

export default function OnlineGame({ roomId, playerName, socket, onLeave }) {
  const { update } = useSession();
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isSummaryClosing, setIsSummaryClosing] = useState(false);
  const [closedCount, setClosedCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [gameError, setGameError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [hasClosed, setHasClosed] = useState(false);

  const resultLockedRef = useRef(false);
  const resultClosedRef = useRef(false);
  const isClosingRef = useRef(false);
  const isReadyRef = useRef(false);
  const isMounted = useRef(true);
  const leaveTimeoutRef = useRef(null);
  const closeSummaryTimeoutRef = useRef(null);

  // 🔥 ADICIONAR ESTILOS GLOBAIS
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !document.getElementById("online-game-styles")
    ) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "online-game-styles";
      styleSheet.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
    }

    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
      if (closeSummaryTimeoutRef.current) {
        clearTimeout(closeSummaryTimeoutRef.current);
        closeSummaryTimeoutRef.current = null;
      }
    };
  }, []);

  // 🔥 Sincronizar estado de ready
  const syncReadyState = useCallback(
    (playersList) => {
      if (!playersList || !socket || !isMounted.current) return;
      const me = playersList.find((p) => p.id === socket.id);
      const ready = me?.isReady || false;
      setIsReady(ready);
      isReadyRef.current = ready;
    },
    [socket],
  );

  // 🔥 Verificar se todos estão prontos
  const checkAllReady = useCallback((playersList) => {
    if (!playersList || playersList.length < 2) return false;
    return playersList.every((p) => p.isReady === true);
  }, []);

  useEffect(() => {
    if (!socket || !isMounted.current) return;

    console.log("🔄 OnlineGame montado, socket:", socket?.id);
    console.log(`📋 RoomId: ${roomId}, Player: ${playerName}`);

    // 🔥 LIMPAR TODOS OS LISTENERS ANTIGOS
    socket.off("room-update");
    socket.off("game-started");
    socket.off("game-update");
    socket.off("player-turn");
    socket.off("round-ended");
    socket.off("game-reset");
    socket.off("summary-closed");
    socket.off("summary-progress");
    socket.off("error");

    // 🔥 LISTENER: ATUALIZAÇÃO DA SALA
    const onRoomUpdate = (data) => {
      if (!isMounted.current) return;
      console.log("📡 room-update:", data);
      setPlayers(data.players || []);
      syncReadyState(data.players);

      if (data.players && data.players.length >= 2) {
        const allReady = checkAllReady(data.players);
        if (allReady && !data.gameState && !isStarting) {
          console.log("🚀 Todos prontos! Jogo vai começar...");
          setIsStarting(true);
        }
      }
    };

    // 🔥 LISTENER: JOGO INICIADO
    const onGameStarted = (data) => {
      if (!isMounted.current) return;
      console.log("📡 game-started:", data);
      setGameState(data);
      setIsSummaryClosing(false);
      setIsStarting(false);
      setGameError("");
      setHasClosed(false);

      if (data.currentPlayerIndex !== undefined) {
        const currentPlayer = data.players[data.currentPlayerIndex];
        setIsMyTurn(currentPlayer?.id === socket.id);
      }
    };

    // 🔥 LISTENER: ATUALIZAÇÃO DO JOGO
    const onGameUpdate = (data) => {
      if (!isMounted.current) return;
      console.log("📡 game-update:", data);
      setGameState(data);
      if (data.currentPlayerIndex !== undefined) {
        const currentPlayer = data.players[data.currentPlayerIndex];
        setIsMyTurn(currentPlayer?.id === socket.id);
      }
    };

    // 🔥 LISTENER: VEZ DO JOGADOR
    const onPlayerTurn = (data) => {
      if (!isMounted.current) return;
      console.log("📡 player-turn:", data);
      setIsMyTurn(data.playerId === socket.id);
    };

    // 🔥 LISTENER: RODADA TERMINADA
    const onRoundEnded = (data) => {
      if (!isMounted.current) return;
      console.log("📡 ROUND-ENDED recebido!");
      resultLockedRef.current = true;
      resultClosedRef.current = false;
      isClosingRef.current = false;

      setResultData(data);
      setShowResult(true);
      setIsSummaryClosing(false);

      const playersWithStatus = data.players || [];
      setTotalPlayers(playersWithStatus.length);
      const closed = playersWithStatus.filter((p) => p.hasClosedSummary).length;
      setClosedCount(closed);

      console.log(
        `📊 Modal aberto! ${closed}/${playersWithStatus.length} jogadores fecharam`,
      );
    };

    // 🔥 LISTENER: PROGRESSO DO RESUMO
    const onSummaryProgress = (data) => {
      if (!isMounted.current) return;
      console.log("📡 summary-progress:", data);
      if (data.roomId === roomId) {
        setClosedCount(data.closedCount || 0);
        setTotalPlayers(data.totalPlayers || 0);

        setResultData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: data.players || prev.players,
          };
        });
      }
    };

    // 🔥 LISTENER: RESUMO FECHADO
    const onSummaryClosed = (data) => {
      if (!isMounted.current) return;
      console.log("📡 summary-closed:", data);
      if (data.roomId === roomId || data.roomId === roomId.toUpperCase()) {
        resultLockedRef.current = false;
        resultClosedRef.current = true;
        isClosingRef.current = true;
        setShowResult(false);
        setResultData(null);
        setIsSummaryClosing(false);
        setGameState(null);
        setClosedCount(0);
        setTotalPlayers(0);
        setIsStarting(false);
        setHasClosed(true);

        if (socket) {
          socket.emit("list-rooms");
        }
      }
    };

    // 🔥 LISTENER: RESET DO JOGO
    const onGameReset = () => {
      if (!isMounted.current) return;
      console.log("📡 game-reset recebido!");
      setGameState(null);
      setIsStarting(false);
      setGameError("");
      setHasClosed(false);
    };

    // 🔥 LISTENER: ERRO - CORRIGIDO
    const onError = (data) => {
      if (!isMounted.current) return;
      console.error("❌ Erro do servidor:", data);
      if (data.message && data.message.includes("já está nesta sala")) {
        console.log("⚠️ Já está na sala, ignorando erro...");
        return;
      }
      setGameError(`❌ ${data.message || "Erro desconhecido"}`);
      setTimeout(() => setGameError(""), 5000);
    };

    // 🔥 REGISTRAR LISTENERS
    socket.on("room-update", onRoomUpdate);
    socket.on("game-started", onGameStarted);
    socket.on("game-update", onGameUpdate);
    socket.on("player-turn", onPlayerTurn);
    socket.on("round-ended", onRoundEnded);
    socket.on("summary-closed", onSummaryClosed);
    socket.on("summary-progress", onSummaryProgress);
    socket.on("game-reset", onGameReset);
    socket.on("error", onError);

    // 🔥 SOLICITAR ATUALIZAÇÃO INICIAL
    socket.emit("list-rooms");

    return () => {
      console.log("🔌 OnlineGame desmontando, removendo listeners...");
      socket.off("room-update", onRoomUpdate);
      socket.off("game-started", onGameStarted);
      socket.off("game-update", onGameUpdate);
      socket.off("player-turn", onPlayerTurn);
      socket.off("round-ended", onRoundEnded);
      socket.off("summary-closed", onSummaryClosed);
      socket.off("summary-progress", onSummaryProgress);
      socket.off("game-reset", onGameReset);
      socket.off("error", onError);
    };
  }, [socket, roomId, playerName, syncReadyState, checkAllReady, isStarting]);

  // 🔥 FECHAR RESUMO
  const handleCloseSummary = () => {
    if (isClosingRef.current) return;
    if (resultClosedRef.current) return;
    if (!resultLockedRef.current) return;
    if (hasClosed) return;

    console.log("🖱️ USUÁRIO CLICOU EM FECHAR!");
    isClosingRef.current = true;
    setIsSummaryClosing(true);
    setHasClosed(true);

    console.log(`📤 Emitindo close-summary para sala ${roomId}`);
    socket.emit("close-summary", { roomId });

    if (closeSummaryTimeoutRef.current) {
      clearTimeout(closeSummaryTimeoutRef.current);
    }
    closeSummaryTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && showResult) {
        console.log("⏰ Fallback: Fechando resumo manualmente...");
        setShowResult(false);
        setResultData(null);
        setIsSummaryClosing(false);
        setGameState(null);
        resultLockedRef.current = false;
        resultClosedRef.current = true;
        isClosingRef.current = true;
        setHasClosed(true);

        if (socket) {
          socket.emit("list-rooms");
        }
      }
      closeSummaryTimeoutRef.current = null;
    }, 5000);
  };

  // 🔥 AÇÕES DO JOGADOR
  const handleAction = (action, amount = 0) => {
    if (!socket || !isMounted.current) return;
    console.log(`📤 Enviando ação: ${action}`, { roomId, action, amount });
    socket.emit("player-action", { roomId, action, amount });
  };

  // 🔥 ALTERNAR PRONTO
  const toggleReady = useCallback(() => {
    if (!socket || !isMounted.current) return;

    console.log(`📤 Toggle ready para sala ${roomId}`);
    console.log(`📤 Jogador: ${playerName}, Socket ID: ${socket?.id}`);

    if (!roomId) {
      console.error("❌ RoomId não disponível!");
      return;
    }

    socket.emit("player-ready", {
      roomId: roomId,
      playerName: playerName,
    });

    const newReadyState = !isReady;
    setIsReady(newReadyState);
    isReadyRef.current = newReadyState;
    console.log(`✅ Ready toggled para: ${newReadyState}`);
  }, [socket, roomId, playerName, isReady]);

  // components/Poker/OnlineGame.jsx - PARTE MODIFICADA (localize a função leaveRoom)

  // 🔥 SAIR DA SALA
  const leaveRoom = useCallback(async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    console.log(`📤 Saindo da sala ${roomId}`);

    if (socket) {
      socket.emit("leave-room", { roomId });

      // 🔥 Emitir evento adicional para garantir que o FriendsList reset
      socket.emit("player-left-room", {
        roomId: roomId,
        playerName: playerName,
      });
    }

    await update();
    console.log("🔄 Sessão atualizada ao sair da sala");

    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        onLeave(true);
      }
    }, 300);
  }, [roomId, socket, update, onLeave, isLeaving, playerName]);

  // ============================================================
  // ✅ MODAL DE RESULTADO
  // ============================================================
  if (showResult && resultData && resultLockedRef.current && !hasClosed) {
    const total = totalPlayers || resultData.players?.length || 0;
    const closed =
      closedCount ||
      resultData.players?.filter((p) => p.hasClosedSummary).length ||
      0;
    const isAllClosed = closed >= total && total > 0;

    if (isAllClosed && !isClosingRef.current) {
      console.log("✅ Todos fecharam! Fechando automaticamente...");
      handleCloseSummary();
    }

    return (
      <motion.div
        style={resultOverlayStyle()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          style={resultModalStyle()}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <h2 style={resultTitleStyle()}>🏆 RESULTADO DA PARTIDA</h2>

          <div style={resultPotStyle()}>💰 Pote: {resultData.pot} fichas</div>

          <div style={resultCommunityStyle()}>
            <span style={{ color: "#888", marginRight: "10px" }}>
              Cartas da mesa:
            </span>
            {resultData.communityCards &&
            resultData.communityCards.length > 0 ? (
              resultData.communityCards.map((card, i) => (
                <CardDisplay key={i} card={card} />
              ))
            ) : (
              <span style={{ color: "#666" }}>(nenhuma)</span>
            )}
          </div>

          <div style={resultPlayersStyle()}>
            {resultData.results.map((r, i) => (
              <motion.div
                key={i}
                style={resultPlayerItemStyle(r.isWinner)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span style={resultPlayerNameStyle(r.isWinner)}>
                  {r.name} {r.isWinner && "👑"}
                </span>
                <span style={resultPlayerHandStyle(r.isWinner)}>{r.hand}</span>
                {r.isWinner && (
                  <span style={resultWinnerBadgeStyle()}>🏆 VENCEDOR</span>
                )}
              </motion.div>
            ))}
          </div>

          <div style={resultWinnerStyle()}>
            🎉 {resultData.winner.name} venceu {resultData.pot} fichas!
          </div>

          <div style={resultStatusStyle()}>
            <span style={{ color: "#888", fontSize: "0.85rem" }}>
              👥 {closed}/{total} jogadores já fecharam
            </span>
            <span style={{ color: "#666", fontSize: "0.75rem" }}>
              ⏳ Fechamento automático em 25s
            </span>
          </div>

          <div style={progressBarContainerStyle()}>
            <motion.div
              style={{
                ...progressBarFillStyle(),
                width: `${total > 0 ? (closed / total) * 100 : 0}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (closed / total) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div style={resultButtonsStyle()}>
            <motion.button
              onClick={handleCloseSummary}
              disabled={isSummaryClosing || isAllClosed}
              style={{
                ...resultButtonStyle(),
                opacity: isSummaryClosing || isAllClosed ? 0.6 : 1,
              }}
              whileHover={{ scale: isSummaryClosing || isAllClosed ? 1 : 1.02 }}
              whileTap={{ scale: isSummaryClosing || isAllClosed ? 1 : 0.98 }}
            >
              {isAllClosed
                ? "✅ Todos fecharam!"
                : isSummaryClosing
                  ? "⏳ Fechando..."
                  : "✕ FECHAR RESUMO"}
            </motion.button>
          </div>

          <p style={resultHintStyle()}>
            {isAllClosed
              ? "✅ Todos os jogadores já fecharam! Aguarde..."
              : isSummaryClosing
                ? "⏳ Fechando o resumo..."
                : `💡 Clique no botão para fechar. Aguarde os outros (${closed}/${total})`}
          </p>

          <div style={resultLockedStyle()}>
            🔒 Resumo travado - Aguardando sua ação
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ============================================================
  // 🏠 LOBBY
  // ============================================================
  if (!gameState) {
    return (
      <div style={lobbyStyle()}>
        <div style={headerStyle()}>
          <h2 style={titleStyle()}>🏠 Sala: {roomId}</h2>
          <button onClick={leaveRoom} style={leaveButtonStyle()}>
            ✕ Sair
          </button>
        </div>

        {gameError && (
          <div style={errorStyle()}>
            {gameError}
            <button onClick={() => setGameError("")} style={errorCloseStyle()}>
              ✕
            </button>
          </div>
        )}

        <div style={playersListStyle()}>
          <h3 style={playersListTitleStyle()}>👥 Jogadores:</h3>
          {players.length === 0 ? (
            <div style={emptyPlayersStyle()}>
              <span style={{ fontSize: "2rem" }}>🔄</span>
              <p>Aguardando jogadores...</p>
            </div>
          ) : (
            players.map((player, index) => (
              <motion.div
                key={index}
                style={playerItemStyle(player.isReady)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span style={playerNameTextStyle()}>
                  {player.name}
                  {player.id === socket?.id && (
                    <span style={youBadgeStyle()}> (você)</span>
                  )}
                </span>
                <span style={playerStatusStyle(player.isReady)}>
                  {player.isReady ? "✅ Pronto" : "⏳ Aguardando..."}
                </span>
              </motion.div>
            ))
          )}
        </div>

        {isStarting ? (
          <motion.div
            style={startingStyle()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span style={spinnerStyle()} />
            <span>🚀 Todos prontos! Iniciando partida...</span>
          </motion.div>
        ) : (
          <motion.button
            onClick={toggleReady}
            style={readyButtonStyle(isReady)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!socket || !roomId}
          >
            {isReady ? "⏳ Aguardando..." : "✅ Pronto para jogar"}
          </motion.button>
        )}

        <p style={infoStyle()}>
          {players.length >= 2
            ? isStarting
              ? "🎮 Iniciando o jogo..."
              : "🎮 Todos prontos? O jogo vai começar!"
            : `👥 Aguardando mais jogadores... (${players.length}/2)`}
        </p>

        {players.length < 2 && (
          <div style={waitingHintStyle()}>
            <span>💡</span>
            <span>Compartilhe o código da sala com seus amigos!</span>
          </div>
        )}

        <Chat socket={socket} roomId={roomId} playerName={playerName} />
      </div>
    );
  }

  // ============================================================
  // 🎮 JOGO ATIVO
  // ============================================================
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayerMe = currentPlayer?.id === socket?.id;

  const currentBet = gameState.currentBet || 0;
  const playerBet = currentPlayer?.bet || 0;
  const callAmount = currentBet - playerBet;
  const canCheck = callAmount <= 0;
  const canCall = callAmount > 0 && currentPlayer?.chips >= callAmount;
  const canRaise = currentPlayer?.chips > callAmount + 50;

  return (
    <div style={gameStyle()}>
      <div style={headerStyle()}>
        <h2 style={titleStyle()}>🎴 Sala: {roomId}</h2>
        <button onClick={leaveRoom} style={leaveButtonStyle()}>
          ✕ Sair
        </button>
      </div>

      <div style={tableStyle()}>
        <div style={potStyle()}>
          💰 Pote: <span style={{ color: "gold" }}>{gameState.pot}</span>
        </div>

        <div style={communityStyle()}>
          <span
            style={{ color: "#888", fontSize: "0.8rem", marginRight: "10px" }}
          >
            Mesa:
          </span>
          {gameState.communityCards && gameState.communityCards.length > 0 ? (
            gameState.communityCards.map((card, i) => (
              <CardDisplay key={i} card={card} />
            ))
          ) : (
            <span style={{ color: "#666" }}>Aguardando cartas...</span>
          )}
        </div>

        <div style={playersTableStyle()}>
          {gameState.players.map((player, index) => {
            const isCurrent = player.id === socket?.id;
            const isTurn = gameState.currentPlayerIndex === index;
            return (
              <motion.div
                key={index}
                style={playerGameStyle(isCurrent, player.isFolded, isTurn)}
                whileHover={{ scale: isCurrent ? 1.02 : 1 }}
              >
                <div style={playerNameGameStyle()}>
                  {player.name}
                  {isCurrent && " 👈"}
                  {isTurn && " 🔥"}
                  {player.isFolded && " (FOLDED)"}
                  {player.isAllIn && " (ALL-IN)"}
                </div>
                <div style={playerCardsStyle()}>
                  {player.cards && player.cards.length > 0 ? (
                    player.cards.map((card, i) => (
                      <CardDisplay key={i} card={card} faceDown={!isCurrent} />
                    ))
                  ) : (
                    <span style={{ color: "#666" }}>🔒</span>
                  )}
                </div>
                <div style={playerChipsStyle()}>💰 {player.chips}</div>
                {player.bet > 0 && (
                  <div style={playerBetStyle()}>Aposta: {player.bet}</div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={turnIndicatorStyle()}>
          {isCurrentPlayerMe && !currentPlayer?.isFolded ? (
            <motion.span
              style={{ color: "#4caf50", fontWeight: "bold" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎯 É SUA VEZ!
            </motion.span>
          ) : (
            <span style={{ color: "#ff9800" }}>
              ⏳ Aguardando {currentPlayer?.name || "jogador"}...
            </span>
          )}
        </div>
      </div>

      {isCurrentPlayerMe &&
        !currentPlayer?.isFolded &&
        !currentPlayer?.isAllIn && (
          <div style={actionsStyle()}>
            <motion.button
              onClick={() => handleAction("fold")}
              style={actionButtonStyle("#f44336")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ❌ FOLD
            </motion.button>

            {canCheck && (
              <motion.button
                onClick={() => handleAction("check")}
                style={actionButtonStyle("#4caf50")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✅ CHECK
              </motion.button>
            )}

            {canCall && (
              <motion.button
                onClick={() => handleAction("call")}
                style={actionButtonStyle("#ff9800")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💰 CALL ({callAmount})
              </motion.button>
            )}

            {canRaise && (
              <motion.button
                onClick={() => handleAction("raise", gameState.currentBet + 50)}
                style={actionButtonStyle("#2196f3")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📈 RAISE ({gameState.currentBet + 50})
              </motion.button>
            )}

            <motion.button
              onClick={() => handleAction("all-in")}
              style={actionButtonStyle("#9c27b0")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⚡ ALL-IN ({currentPlayer?.chips || 0})
            </motion.button>
          </div>
        )}

      <Chat socket={socket} roomId={roomId} playerName={playerName} />
    </div>
  );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================

function resultOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: 20,
    backdropFilter: "blur(8px)",
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
    margin: "0 0 15px",
    fontSize: "1.8rem",
    fontWeight: "800",
  };
}

function resultPotStyle() {
  return {
    textAlign: "center",
    fontSize: "1.3rem",
    color: "#ffd700",
    marginBottom: "15px",
  };
}

function resultCommunityStyle() {
  return {
    textAlign: "center",
    padding: "10px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    marginBottom: "15px",
  };
}

function resultPlayersStyle() {
  return {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  };
}

function resultPlayerItemStyle(isWinner) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 15px",
    borderRadius: 10,
    background: isWinner ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
    border: isWinner ? "1px solid gold" : "1px solid rgba(255,255,255,0.1)",
  };
}

function resultPlayerNameStyle(isWinner) {
  return {
    fontWeight: "bold",
    color: isWinner ? "gold" : "#fff",
    fontSize: "1rem",
  };
}

function resultPlayerHandStyle(isWinner) {
  return {
    color: isWinner ? "#4caf50" : "#aaa",
    fontSize: "0.9rem",
  };
}

function resultWinnerBadgeStyle() {
  return {
    background: "gold",
    color: "#1a3a2a",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: "0.7rem",
    fontWeight: "bold",
  };
}

function resultWinnerStyle() {
  return {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#ffd700",
    marginBottom: "20px",
  };
}

function resultStatusStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "5px",
  };
}

function progressBarContainerStyle() {
  return {
    width: "100%",
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: "15px",
  };
}

function progressBarFillStyle() {
  return {
    height: "100%",
    background: "linear-gradient(90deg, #4caf50, gold)",
    borderRadius: 5,
    transition: "width 0.5s ease",
  };
}

function resultButtonsStyle() {
  return {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "10px",
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

function resultHintStyle() {
  return {
    textAlign: "center",
    fontSize: "0.75rem",
    color: "#888",
    marginTop: "10px",
  };
}

function resultLockedStyle() {
  return {
    textAlign: "center",
    fontSize: "0.7rem",
    color: "#4caf50",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(76,175,80,0.3)",
  };
}

function lobbyStyle() {
  return {
    background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
    borderRadius: 30,
    padding: "20px",
    minHeight: "400px",
    color: "white",
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    margin: 20,
    overflowY: "auto",
  };
}

function gameStyle() {
  return {
    background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
    borderRadius: 30,
    padding: "20px",
    minHeight: "500px",
    color: "white",
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    margin: 20,
    overflowY: "auto",
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

function titleStyle() {
  return {
    color: "gold",
    margin: 0,
    fontSize: "1.5rem",
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

function errorStyle() {
  return {
    background: "rgba(244,67,54,0.2)",
    border: "1px solid #f44336",
    borderRadius: 12,
    padding: "10px 14px",
    color: "#f44336",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
  };
}

function errorCloseStyle() {
  return {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0 4px",
  };
}

function playersListStyle() {
  return {
    marginBottom: "20px",
  };
}

function playersListTitleStyle() {
  return {
    margin: "0 0 12px 0",
    fontSize: "1rem",
    color: "#aaa",
  };
}

function emptyPlayersStyle() {
  return {
    textAlign: "center",
    padding: "30px 0",
    color: "#666",
  };
}

function playerItemStyle(isReady) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 15px",
    marginBottom: "8px",
    background: isReady ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.05)",
    borderRadius: 10,
    border: isReady ? "1px solid #4caf50" : "1px solid rgba(255,255,255,0.1)",
  };
}

function playerNameTextStyle() {
  return {
    fontWeight: "bold",
    fontSize: "0.95rem",
  };
}

function youBadgeStyle() {
  return {
    color: "gold",
    fontSize: "0.75rem",
    marginLeft: "4px",
  };
}

function playerStatusStyle(isReady) {
  return {
    fontSize: "0.8rem",
    color: isReady ? "#4caf50" : "#888",
  };
}

function readyButtonStyle(isReady) {
  return {
    background: isReady
      ? "rgba(255,152,0,0.2)"
      : "radial-gradient(#f7d97c,#d6a12e)",
    border: isReady ? "1px solid #ff9800" : "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 20px",
    borderRadius: 60,
    cursor: isReady ? "pointer" : "pointer",
    boxShadow: isReady ? "none" : "0 4px 0 #7a4c1a",
    color: isReady ? "#ff9800" : "#2e241f",
    width: "100%",
    transition: "all 0.3s ease",
  };
}

function startingStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "12px 20px",
    background: "rgba(255,215,0,0.1)",
    borderRadius: 60,
    border: "1px solid gold",
    color: "gold",
    fontWeight: "bold",
    fontSize: "1rem",
    marginBottom: "12px",
  };
}

function spinnerStyle() {
  return {
    display: "inline-block",
    width: 20,
    height: 20,
    border: "2px solid rgba(255,215,0,0.2)",
    borderTop: "2px solid gold",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };
}

function infoStyle() {
  return {
    textAlign: "center",
    color: "#aaa",
    marginTop: "15px",
  };
}

function waitingHintStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    background: "rgba(255,215,0,0.05)",
    borderRadius: 10,
    marginTop: "10px",
    color: "#888",
    fontSize: "0.85rem",
  };
}

function tableStyle() {
  return {
    background: "rgba(0,20,0,0.3)",
    borderRadius: 30,
    padding: "20px",
    minHeight: "300px",
  };
}

function potStyle() {
  return {
    textAlign: "center",
    fontSize: "1.3rem",
    marginBottom: "15px",
  };
}

function communityStyle() {
  return {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "20px",
    padding: "15px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 15,
    minHeight: "60px",
  };
}

function playersTableStyle() {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    justifyContent: "center",
  };
}

function playerGameStyle(isCurrent, isFolded, isTurn) {
  return {
    background: isCurrent
      ? "rgba(255,215,0,0.2)"
      : isTurn
        ? "rgba(76,175,80,0.1)"
        : "rgba(255,255,255,0.05)",
    border: isCurrent
      ? "2px solid gold"
      : isTurn
        ? "2px solid #4caf50"
        : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 15,
    padding: "15px",
    minWidth: "150px",
    textAlign: "center",
    opacity: isFolded ? 0.4 : 1,
  };
}

function playerNameGameStyle() {
  return {
    fontWeight: "bold",
    marginBottom: "8px",
    fontSize: "0.9rem",
  };
}

function playerCardsStyle() {
  return {
    marginBottom: "8px",
  };
}

function playerChipsStyle() {
  return {
    color: "#4caf50",
  };
}

function playerBetStyle() {
  return {
    color: "#ff9800",
    fontSize: "0.8rem",
  };
}

function turnIndicatorStyle() {
  return {
    textAlign: "center",
    padding: "15px",
    marginTop: "15px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    fontSize: "1.2rem",
  };
}

function actionsStyle() {
  return {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginTop: "20px",
    flexWrap: "wrap",
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
  };
}

function cardStyle(isRed, isFaceDown) {
  if (isFaceDown) {
    return {
      display: "inline-block",
      padding: "10px 15px",
      margin: "0 5px",
      background: "#2b5797",
      borderRadius: 8,
      color: "white",
      fontWeight: "bold",
      fontSize: "1.2rem",
      minWidth: "50px",
    };
  }
  return {
    display: "inline-block",
    padding: "10px 15px",
    margin: "0 5px",
    background: "white",
    borderRadius: 8,
    color: isRed ? "#c33" : "#1f2a2f",
    fontWeight: "bold",
    fontSize: "1.2rem",
    minWidth: "50px",
  };
}
