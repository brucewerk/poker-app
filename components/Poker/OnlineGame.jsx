// components/Poker/OnlineGame.jsx - COM CHAT INTEGRADO
"use client";

import { useState, useEffect, useRef } from "react";
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
  const [showChat, setShowChat] = useState(true);

  const resultLockedRef = useRef(false);
  const resultClosedRef = useRef(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    console.log("🔄 OnlineGame montado, socket:", socket?.id);

    const onRoomUpdate = (data) => {
      console.log("📡 room-update:", data);
      setPlayers(data.players || []);
      const me = data.players?.find((p) => p.id === socket.id);
      setIsReady(me?.isReady || false);
    };

    const onGameStarted = (data) => {
      console.log("📡 game-started:", data);
      setGameState(data);
      setIsSummaryClosing(false);
      if (data.currentPlayerIndex !== undefined) {
        const currentPlayer = data.players[data.currentPlayerIndex];
        setIsMyTurn(currentPlayer?.id === socket.id);
      }
    };

    const onGameUpdate = (data) => {
      console.log("📡 game-update:", data);
      setGameState(data);
      if (data.currentPlayerIndex !== undefined) {
        const currentPlayer = data.players[data.currentPlayerIndex];
        setIsMyTurn(currentPlayer?.id === socket.id);
      }
    };

    const onPlayerTurn = (data) => {
      console.log("📡 player-turn:", data);
      setIsMyTurn(data.playerId === socket.id);
    };

    const onRoundEnded = (data) => {
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

    const onSummaryProgress = (data) => {
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

    const onSummaryClosed = (data) => {
      console.log("📡 summary-closed:", data);
      if (data.roomId === roomId) {
        resultLockedRef.current = false;
        resultClosedRef.current = true;
        isClosingRef.current = true;
        setShowResult(false);
        setResultData(null);
        setIsSummaryClosing(false);
        setGameState(null);
        setClosedCount(0);
        setTotalPlayers(0);
      }
    };

    socket.off("room-update");
    socket.off("game-started");
    socket.off("game-update");
    socket.off("player-turn");
    socket.off("round-ended");
    socket.off("game-reset");
    socket.off("summary-closed");
    socket.off("summary-progress");
    socket.off("error");

    socket.on("room-update", onRoomUpdate);
    socket.on("game-started", onGameStarted);
    socket.on("game-update", onGameUpdate);
    socket.on("player-turn", onPlayerTurn);
    socket.on("round-ended", onRoundEnded);
    socket.on("summary-closed", onSummaryClosed);
    socket.on("summary-progress", onSummaryProgress);

    return () => {
      console.log("🔌 OnlineGame desmontando, removendo listeners...");
      socket.off("room-update", onRoomUpdate);
      socket.off("game-started", onGameStarted);
      socket.off("game-update", onGameUpdate);
      socket.off("player-turn", onPlayerTurn);
      socket.off("round-ended", onRoundEnded);
      socket.off("summary-closed", onSummaryClosed);
      socket.off("summary-progress", onSummaryProgress);
    };
  }, [socket, update, roomId]);

  const handleCloseSummary = () => {
    if (isClosingRef.current) return;
    if (resultClosedRef.current) return;
    if (!resultLockedRef.current) return;

    console.log("🖱️ USUÁRIO CLICOU EM FECHAR!");
    isClosingRef.current = true;
    setIsSummaryClosing(true);

    console.log(`📤 Emitindo close-summary para sala ${roomId}`);
    socket.emit("close-summary", { roomId });
  };

  const handleAction = (action, amount = 0) => {
    console.log(`📤 Enviando ação: ${action}`, { roomId, action, amount });
    socket.emit("player-action", { roomId, action, amount });
  };

  const toggleReady = () => {
    console.log(`📤 Toggle ready para sala ${roomId}`);
    socket.emit("player-ready", { roomId });
  };

  const leaveRoom = async () => {
    console.log(`📤 Saindo da sala ${roomId}`);
    socket.emit("leave-room", { roomId });

    await update();
    console.log("🔄 Sessão atualizada ao sair da sala");

    onLeave(true);
  };

  // ✅ MODAL DE RESULTADO
  if (showResult && resultData && resultLockedRef.current) {
    const total = totalPlayers || resultData.players?.length || 0;
    const closed =
      closedCount ||
      resultData.players?.filter((p) => p.hasClosedSummary).length ||
      0;
    const isAllClosed = closed >= total && total > 0;

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

  // ====================== LOBBY ======================
  if (!gameState) {
    return (
      <div style={lobbyStyle()}>
        <div style={headerStyle()}>
          <h2 style={titleStyle()}>🏠 Sala: {roomId}</h2>
          <button onClick={leaveRoom} style={leaveButtonStyle()}>
            ✕ Sair
          </button>
        </div>

        <div style={playersListStyle()}>
          <h3>👥 Jogadores:</h3>
          {players.map((player, index) => (
            <motion.div
              key={index}
              style={playerItemStyle(player.isReady)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span>{player.name}</span>
              <span>{player.id === socket?.id ? " 👈 (você)" : ""}</span>
              <span>{player.isReady ? "✅ Pronto" : "⏳ Aguardando..."}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={toggleReady}
          style={readyButtonStyle()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isReady ? "⏳ Aguardando..." : "✅ Pronto para jogar"}
        </motion.button>

        <p style={infoStyle()}>
          {players.length >= 2
            ? "🎮 Todos prontos? O jogo vai começar!"
            : "👥 Aguardando mais jogadores..."}
        </p>

        {/* Chat no lobby */}
        <Chat socket={socket} roomId={roomId} playerName={playerName} />
      </div>
    );
  }

  // ====================== JOGO ======================
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayerMe = currentPlayer?.id === socket?.id;

  return (
    <div style={gameStyle()}>
      <div style={headerStyle()}>
        <h2 style={titleStyle()}>🎴 Sala: {roomId}</h2>
        <button onClick={leaveRoom} style={leaveButtonStyle()}>
          ✕ Sair
        </button>
      </div>

      <div style={tableStyle()}>
        <div style={potStyle()}>💰 Pote: {gameState.pot}</div>

        <div style={communityStyle()}>
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
                style={playerGameStyle(isCurrent, player.isFolded)}
                whileHover={{ scale: isCurrent ? 1.02 : 1 }}
              >
                <div style={playerNameStyle()}>
                  {player.name} {isCurrent && "👈"}
                  {isTurn && " 🔥"}
                  {player.isFolded && " (FOLDED)"}
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
            <motion.button
              onClick={() => handleAction("check")}
              style={actionButtonStyle("#4caf50")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✅ CHECK
            </motion.button>
            <motion.button
              onClick={() => handleAction("call")}
              style={actionButtonStyle("#ff9800")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💰 CALL ({gameState.currentBet - currentPlayer.bet})
            </motion.button>
            <motion.button
              onClick={() => handleAction("raise", gameState.currentBet + 50)}
              style={actionButtonStyle("#2196f3")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📈 RAISE
            </motion.button>
            <motion.button
              onClick={() => handleAction("all-in")}
              style={actionButtonStyle("#9c27b0")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⚡ ALL-IN
            </motion.button>
          </div>
        )}

      {/* Chat durante o jogo */}
      <Chat socket={socket} roomId={roomId} playerName={playerName} />
    </div>
  );
}

// ====================== ESTILOS (MANTIDOS E ATUALIZADOS) ======================
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

function playersListStyle() {
  return {
    marginBottom: "20px",
  };
}

function playerItemStyle(isReady) {
  return {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 15px",
    marginBottom: "8px",
    background: isReady ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.05)",
    borderRadius: 10,
    border: isReady ? "1px solid #4caf50" : "1px solid rgba(255,255,255,0.1)",
  };
}

function readyButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    padding: "12px 20px",
    borderRadius: 60,
    cursor: "pointer",
    boxShadow: "0 4px 0 #7a4c1a",
    color: "#2e241f",
    width: "100%",
  };
}

function infoStyle() {
  return {
    textAlign: "center",
    color: "#aaa",
    marginTop: "15px",
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
    fontSize: "1.5rem",
    color: "gold",
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

function playerGameStyle(isCurrent, isFolded) {
  return {
    background: isCurrent ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
    border: isCurrent ? "2px solid gold" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 15,
    padding: "15px",
    minWidth: "150px",
    textAlign: "center",
    opacity: isFolded ? 0.4 : 1,
  };
}

function playerNameStyle() {
  return {
    fontWeight: "bold",
    marginBottom: "8px",
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
