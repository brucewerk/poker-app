// components/Poker/OnlineGame.jsx - COM ROLAGEM AUTOMÁTICA E RESPONSIVO
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

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

  // 🔥 CHAT
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 🔥 REFS
  const resultLockedRef = useRef(false);
  const resultClosedRef = useRef(false);
  const isClosingRef = useRef(false);

  // 🔥 FUNÇÃO PARA ROLAR O CHAT PARA O FINAL
  const scrollChatToBottom = useCallback((force = false) => {
    // Tentativa 1: usando o ref do final
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      return;
    }

    // Tentativa 2: usando o container de mensagens
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      return;
    }

    // Tentativa 3: usando o container do chat
    if (chatContainerRef.current) {
      const container = chatContainerRef.current.querySelector(
        ".chat-messages-scroll",
      );
      if (container) {
        container.scrollTop = container.scrollHeight;
        return;
      }
    }

    // Tentativa 4: fallback com querySelector global
    const container = document.querySelector(".chat-messages-scroll");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // 🔥 ROLAR SEMPRE QUE NOVAS MENSAGENS CHEGAREM
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => scrollChatToBottom(true), 50);
      setTimeout(() => scrollChatToBottom(true), 150);
      setTimeout(() => scrollChatToBottom(true), 300);
    }
  }, [chatMessages, scrollChatToBottom]);

  // 🔥 ROLAR QUANDO O CHAT FOR ABERTO/MAXIMIZADO
  useEffect(() => {
    if (showChat) {
      setTimeout(() => scrollChatToBottom(true), 100);
      setTimeout(() => scrollChatToBottom(true), 300);
    }
  }, [showChat, scrollChatToBottom]);

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

    // 🔥 CHAT: HISTÓRICO
    const onChatHistory = (data) => {
      console.log("📡 chat-history:", data);
      if (data.roomId === roomId || !data.roomId) {
        setChatMessages(data.messages || []);
        setTimeout(() => scrollChatToBottom(true), 200);
      }
    };

    // 🔥 CHAT: NOVA MENSAGEM
    const onChatMessage = (message) => {
      console.log("📡 chat-message:", message);
      setChatMessages((prev) => [...prev, message]);
      setTimeout(() => scrollChatToBottom(true), 100);
    };

    socket.off("room-update");
    socket.off("game-started");
    socket.off("game-update");
    socket.off("player-turn");
    socket.off("round-ended");
    socket.off("game-reset");
    socket.off("summary-closed");
    socket.off("summary-progress");
    socket.off("chat-history");
    socket.off("chat-message");
    socket.off("error");

    socket.on("room-update", onRoomUpdate);
    socket.on("game-started", onGameStarted);
    socket.on("game-update", onGameUpdate);
    socket.on("player-turn", onPlayerTurn);
    socket.on("round-ended", onRoundEnded);
    socket.on("summary-closed", onSummaryClosed);
    socket.on("summary-progress", onSummaryProgress);
    socket.on("chat-history", onChatHistory);
    socket.on("chat-message", onChatMessage);

    return () => {
      console.log("🔌 OnlineGame desmontando, removendo listeners...");
      socket.off("room-update", onRoomUpdate);
      socket.off("game-started", onGameStarted);
      socket.off("game-update", onGameUpdate);
      socket.off("player-turn", onPlayerTurn);
      socket.off("round-ended", onRoundEnded);
      socket.off("summary-closed", onSummaryClosed);
      socket.off("summary-progress", onSummaryProgress);
      socket.off("chat-history", onChatHistory);
      socket.off("chat-message", onChatMessage);
    };
  }, [socket, update, roomId, scrollChatToBottom]);

  const sendChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    if (!socket || !socket.connected) {
      console.warn("⚠️ Socket não conectado, não é possível enviar mensagem");
      return;
    }

    socket.emit("send-chat-message", { roomId, message: trimmed });
    setChatInput("");
    setTimeout(() => scrollChatToBottom(true), 100);
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const handleCloseSummary = () => {
    if (isClosingRef.current) return;
    if (resultClosedRef.current) return;
    if (!resultLockedRef.current) return;

    isClosingRef.current = true;
    setIsSummaryClosing(true);
    socket.emit("close-summary", { roomId });
  };

  const handleAction = (action, amount = 0) => {
    socket.emit("player-action", { roomId, action, amount });
  };

  const toggleReady = () => {
    socket.emit("player-ready", { roomId });
  };

  const leaveRoom = async () => {
    socket.emit("leave-room", { roomId });
    await update();
    onLeave(true);
  };

  // 🔥 RENDER DO CHAT
  function renderChatPanel() {
    return (
      <div style={chatContainerStyle()} ref={chatContainerRef}>
        <div style={chatHeaderStyle()}>
          <span>💬 Chat da Sala</span>
          <span style={{ fontSize: "0.7rem", color: "#888" }}>
            {chatMessages.length} msgs
          </span>
        </div>
        <div
          className="chat-messages-scroll"
          style={chatMessagesStyle()}
          ref={messagesContainerRef}
        >
          {chatMessages.length === 0 && (
            <p style={chatEmptyStyle()}>Nenhuma mensagem ainda. Diga olá! 👋</p>
          )}
          {chatMessages.map((msg) => {
            const isMine = msg.playerId === socket?.id;
            if (msg.isSystem) {
              return (
                <div key={msg.id} style={chatSystemMessageStyle()}>
                  ℹ️ {msg.message}
                </div>
              );
            }
            return (
              <div key={msg.id} style={chatMessageRowStyle(isMine)}>
                <div style={chatBubbleStyle(isMine)}>
                  <span style={chatAuthorStyle(isMine)}>
                    {isMine ? "Você" : msg.playerName}
                  </span>
                  <span style={chatTextStyle()}>{msg.message}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <div style={chatInputRowStyle()}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="Digite sua mensagem..."
            maxLength={300}
            style={chatInputStyle()}
          />
          <button
            onClick={sendChatMessage}
            disabled={!chatInput.trim()}
            style={chatSendButtonStyle(!!chatInput.trim())}
          >
            ➤
          </button>
        </div>
      </div>
    );
  }

  // ✅ MODAL DE RESULTADO
  if (showResult && resultData && resultLockedRef.current) {
    const total = totalPlayers || resultData.players?.length || 0;
    const closed =
      closedCount ||
      resultData.players?.filter((p) => p.hasClosedSummary).length ||
      0;
    const isAllClosed = closed >= total && total > 0;

    return (
      <div style={resultOverlayStyle()}>
        <div style={resultModalStyle()}>
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
              <div key={i} style={resultPlayerItemStyle(r.isWinner)}>
                <span style={resultPlayerNameStyle(r.isWinner)}>
                  {r.name} {r.isWinner && "👑"}
                </span>
                <span style={resultPlayerHandStyle(r.isWinner)}>{r.hand}</span>
                {r.isWinner && (
                  <span style={resultWinnerBadgeStyle()}>🏆 VENCEDOR</span>
                )}
              </div>
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
            <div
              style={{
                ...progressBarFillStyle(),
                width: `${total > 0 ? (closed / total) * 100 : 0}%`,
              }}
            />
          </div>
          <div style={resultButtonsStyle()}>
            <button
              onClick={handleCloseSummary}
              disabled={isSummaryClosing || isAllClosed}
              style={{
                ...resultButtonStyle(),
                opacity: isSummaryClosing || isAllClosed ? 0.6 : 1,
              }}
            >
              {isAllClosed
                ? "✅ Todos fecharam!"
                : isSummaryClosing
                  ? "⏳ Fechando..."
                  : "✕ FECHAR RESUMO"}
            </button>
          </div>
          <p style={resultHintStyle()}>
            {isAllClosed
              ? "✅ Todos os jogadores já fecharam! Aguarde..."
              : isSummaryClosing
                ? "⏳ Fechando o resumo..."
                : `💡 Clique no botão para fechar. Aguarde os outros (${closed}/${total})`}
          </p>
        </div>
      </div>
    );
  }

  // ====================== LOBBY (SALA DE ESPERA) ======================
  if (!gameState) {
    return (
      <div style={lobbyStyle()}>
        <div style={headerStyle()}>
          <h2 style={titleStyle()}>🏠 Sala: {roomId}</h2>
          <button onClick={leaveRoom} style={leaveButtonStyle()}>
            ✕ Sair
          </button>
        </div>

        <div style={lobbyBodyStyle()}>
          <div style={lobbyLeftColStyle()}>
            <div style={playersListStyle()}>
              <h3>👥 Jogadores:</h3>
              {players.map((player, index) => (
                <div key={index} style={playerItemStyle(player.isReady)}>
                  <span>{player.name}</span>
                  <span>{player.id === socket?.id ? " 👈 (você)" : ""}</span>
                  <span>
                    {player.isReady ? "✅ Pronto" : "⏳ Aguardando..."}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={toggleReady} style={readyButtonStyle()}>
              {isReady ? "⏳ Aguardando..." : "✅ Pronto para jogar"}
            </button>
            <p style={infoStyle()}>
              {players.length >= 2
                ? "🎮 Todos prontos? O jogo vai começar!"
                : "👥 Aguardando mais jogadores..."}
            </p>
          </div>

          <div style={lobbyRightColStyle()}>{renderChatPanel()}</div>
        </div>
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
              <div
                key={index}
                style={playerGameStyle(isCurrent, player.isFolded)}
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
              </div>
            );
          })}
        </div>
        <div style={turnIndicatorStyle()}>
          {isCurrentPlayerMe && !currentPlayer?.isFolded ? (
            <span style={{ color: "#4caf50", fontWeight: "bold" }}>
              🎯 É SUA VEZ!
            </span>
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
            <button
              onClick={() => handleAction("fold")}
              style={actionButtonStyle("#f44336")}
            >
              ❌ FOLD
            </button>
            <button
              onClick={() => handleAction("check")}
              style={actionButtonStyle("#4caf50")}
            >
              ✅ CHECK
            </button>
            <button
              onClick={() => handleAction("call")}
              style={actionButtonStyle("#ff9800")}
            >
              💰 CALL ({gameState.currentBet - currentPlayer.bet})
            </button>
            <button
              onClick={() => handleAction("raise", gameState.currentBet + 50)}
              style={actionButtonStyle("#2196f3")}
            >
              📈 RAISE
            </button>
            <button
              onClick={() => handleAction("all-in")}
              style={actionButtonStyle("#9c27b0")}
            >
              ⚡ ALL-IN
            </button>
          </div>
        )}
    </div>
  );
}

// ====================== ESTILOS RESPONSIVOS ======================

function resultOverlayStyle() {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "clamp(10px, 3vw, 20px)",
  };
}

function resultModalStyle() {
  return {
    background: "linear-gradient(145deg,#1a3a2a,#0a2a1a)",
    padding: "clamp(20px, 4vw, 40px)",
    borderRadius: "clamp(20px, 3vw, 30px)",
    maxWidth: "clamp(340px, 90vw, 500px)",
    width: "100%",
    color: "white",
    border: "3px solid gold",
    maxHeight: "80vh",
    overflowY: "auto",
  };
}

function resultTitleStyle() {
  return {
    textAlign: "center",
    color: "gold",
    margin: "0 0 15px",
    fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
  };
}

function resultPotStyle() {
  return {
    textAlign: "center",
    fontSize: "clamp(1rem, 3vw, 1.3rem)",
    color: "#ffd700",
    marginBottom: "15px",
  };
}

function resultCommunityStyle() {
  return {
    textAlign: "center",
    padding: "clamp(6px, 1.5vw, 10px)",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    marginBottom: "15px",
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
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
    padding: "clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 15px)",
    borderRadius: 10,
    background: isWinner ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
    border: isWinner ? "1px solid gold" : "1px solid rgba(255,255,255,0.1)",
    flexWrap: "wrap",
    gap: "4px",
  };
}

function resultPlayerNameStyle(isWinner) {
  return {
    fontWeight: "bold",
    color: isWinner ? "gold" : "#fff",
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
  };
}

function resultPlayerHandStyle(isWinner) {
  return {
    color: isWinner ? "#4caf50" : "#aaa",
    fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
  };
}

function resultWinnerBadgeStyle() {
  return {
    background: "gold",
    color: "#1a3a2a",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: "clamp(0.5rem, 1.2vw, 0.7rem)",
    fontWeight: "bold",
  };
}

function resultWinnerStyle() {
  return {
    textAlign: "center",
    fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
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
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    padding: "clamp(10px, 2vw, 12px) clamp(20px, 4vw, 30px)",
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
    fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)",
    color: "#888",
    marginTop: "10px",
  };
}

// ====================== LOBBY / GAME ESTILOS ======================

function lobbyStyle() {
  return {
    background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
    borderRadius: "clamp(20px, 4vw, 30px)",
    padding: "clamp(12px, 2vw, 20px)",
    minHeight: "clamp(300px, 60vh, 400px)",
    color: "white",
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    margin: "clamp(8px, 2vw, 20px)",
    overflowY: "auto",
  };
}

function gameStyle() {
  return {
    background: "linear-gradient(145deg,#0a2f1f 0%,#064e2b 100%)",
    borderRadius: "clamp(20px, 4vw, 30px)",
    padding: "clamp(12px, 2vw, 20px)",
    minHeight: "clamp(350px, 70vh, 500px)",
    color: "white",
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    margin: "clamp(8px, 2vw, 20px)",
    overflowY: "auto",
  };
}

function headerStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "clamp(12px, 2vw, 20px)",
    flexWrap: "wrap",
    gap: "8px",
  };
}

function titleStyle() {
  return {
    color: "gold",
    margin: 0,
    fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)",
  };
}

function leaveButtonStyle() {
  return {
    background: "rgba(244,67,54,0.3)",
    border: "1px solid #f44336",
    borderRadius: 20,
    padding: "clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)",
    color: "white",
    cursor: "pointer",
    fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
  };
}

function lobbyBodyStyle() {
  return {
    display: "flex",
    gap: "clamp(12px, 2vw, 20px)",
    flexWrap: "wrap",
  };
}

function lobbyLeftColStyle() {
  return {
    flex: "1 1 220px",
    minWidth: "200px",
  };
}

function lobbyRightColStyle() {
  return {
    flex: "1 1 260px",
    minWidth: "240px",
  };
}

function playersListStyle() {
  return {
    marginBottom: "clamp(12px, 2vw, 20px)",
  };
}

function playerItemStyle(isReady) {
  return {
    display: "flex",
    justifyContent: "space-between",
    padding: "clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 15px)",
    marginBottom: "8px",
    background: isReady ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.05)",
    borderRadius: 10,
    border: isReady ? "1px solid #4caf50" : "1px solid rgba(255,255,255,0.1)",
    fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
    flexWrap: "wrap",
    gap: "4px",
  };
}

function readyButtonStyle() {
  return {
    background: "radial-gradient(#f7d97c,#d6a12e)",
    border: "none",
    fontWeight: "bold",
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    padding: "clamp(10px, 2vw, 12px) 20px",
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
    fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
  };
}

// ====================== CHAT ESTILOS ======================

function chatContainerStyle() {
  return {
    background: "rgba(0,0,0,0.3)",
    borderRadius: "clamp(12px, 2vw, 20px)",
    border: "1px solid rgba(255,215,0,0.2)",
    display: "flex",
    flexDirection: "column",
    height: "clamp(250px, 50vh, 360px)",
    overflow: "hidden",
  };
}

function chatHeaderStyle() {
  return {
    padding: "clamp(6px, 1vw, 10px) clamp(10px, 2vw, 15px)",
    background: "rgba(255,215,0,0.1)",
    color: "gold",
    fontWeight: "bold",
    fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
    borderBottom: "1px solid rgba(255,215,0,0.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
}

function chatMessagesStyle() {
  return {
    flex: 1,
    overflowY: "auto",
    padding: "clamp(6px, 1vw, 10px) clamp(8px, 1.5vw, 12px)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };
}

function chatEmptyStyle() {
  return {
    textAlign: "center",
    color: "#888",
    fontSize: "clamp(0.6rem, 1.2vw, 0.8rem)",
    marginTop: "10px",
  };
}

function chatSystemMessageStyle() {
  return {
    textAlign: "center",
    color: "#888",
    fontSize: "clamp(0.5rem, 1vw, 0.7rem)",
    fontStyle: "italic",
    margin: "4px 0",
  };
}

function chatMessageRowStyle(isMine) {
  return {
    display: "flex",
    justifyContent: isMine ? "flex-end" : "flex-start",
  };
}

function chatBubbleStyle(isMine) {
  return {
    maxWidth: "80%",
    background: isMine ? "rgba(76,175,80,0.25)" : "rgba(255,255,255,0.08)",
    border: isMine
      ? "1px solid rgba(76,175,80,0.4)"
      : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "clamp(4px, 1vw, 6px) clamp(8px, 1.5vw, 10px)",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };
}

function chatAuthorStyle(isMine) {
  return {
    fontSize: "clamp(0.5rem, 1vw, 0.65rem)",
    fontWeight: "bold",
    color: isMine ? "#4caf50" : "#ffd700",
  };
}

function chatTextStyle() {
  return {
    fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
    color: "#fff",
    wordBreak: "break-word",
  };
}

function chatInputRowStyle() {
  return {
    display: "flex",
    gap: "8px",
    padding: "clamp(6px, 1vw, 10px)",
    borderTop: "1px solid rgba(255,215,0,0.15)",
  };
}

function chatInputStyle() {
  return {
    flex: 1,
    padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
    borderRadius: 15,
    border: "1px solid rgba(255,215,0,0.2)",
    background: "rgba(0,0,0,0.3)",
    color: "white",
    fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
    outline: "none",
    minWidth: "60px",
  };
}

function chatSendButtonStyle(enabled) {
  return {
    background: enabled
      ? "radial-gradient(#f7d97c,#d6a12e)"
      : "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "50%",
    width: "clamp(32px, 5vw, 36px)",
    height: "clamp(32px, 5vw, 36px)",
    minWidth: "clamp(32px, 5vw, 36px)",
    color: enabled ? "#2e241f" : "#666",
    fontWeight: "bold",
    cursor: enabled ? "pointer" : "not-allowed",
    fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
  };
}

function tableStyle() {
  return {
    background: "rgba(0,20,0,0.3)",
    borderRadius: "clamp(20px, 3vw, 30px)",
    padding: "clamp(12px, 2vw, 20px)",
    minHeight: "clamp(200px, 40vh, 300px)",
  };
}

function potStyle() {
  return {
    textAlign: "center",
    fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
    color: "gold",
    marginBottom: "clamp(10px, 2vw, 15px)",
  };
}

function communityStyle() {
  return {
    textAlign: "center",
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    marginBottom: "clamp(12px, 2vw, 20px)",
    padding: "clamp(10px, 2vw, 15px)",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 15,
    minHeight: "clamp(50px, 8vw, 60px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "5px",
  };
}

function playersTableStyle() {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "clamp(8px, 1.5vw, 15px)",
    justifyContent: "center",
  };
}

function playerGameStyle(isCurrent, isFolded) {
  return {
    background: isCurrent ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.05)",
    border: isCurrent ? "2px solid gold" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 15,
    padding: "clamp(10px, 1.5vw, 15px)",
    minWidth: "clamp(120px, 20vw, 150px)",
    flex: "1 1 120px",
    textAlign: "center",
    opacity: isFolded ? 0.4 : 1,
  };
}

function playerNameStyle() {
  return {
    fontWeight: "bold",
    marginBottom: "8px",
    fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
  };
}

function playerCardsStyle() {
  return {
    marginBottom: "8px",
    fontSize: "clamp(0.8rem, 1.8vw, 1rem)",
  };
}

function playerChipsStyle() {
  return {
    color: "#4caf50",
    fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
  };
}

function playerBetStyle() {
  return {
    color: "#ff9800",
    fontSize: "clamp(0.6rem, 1.2vw, 0.8rem)",
  };
}

function turnIndicatorStyle() {
  return {
    textAlign: "center",
    padding: "clamp(10px, 2vw, 15px)",
    marginTop: "clamp(10px, 2vw, 15px)",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
  };
}

function actionsStyle() {
  return {
    display: "flex",
    gap: "clamp(6px, 1vw, 10px)",
    justifyContent: "center",
    marginTop: "clamp(12px, 2vw, 20px)",
    flexWrap: "wrap",
  };
}

function actionButtonStyle(color) {
  return {
    background: color,
    border: "none",
    padding: "clamp(9px, 2vh, 12px) clamp(10px, 2vw, 20px)",
    minHeight: "clamp(38px, 6vh, 46px)",
    borderRadius: 30,
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "clamp(0.65rem, 1.6vw, 0.85rem)",
    flex: "1 1 auto",
    minWidth: "clamp(56px, 12vw, 70px)",
  };
}

function cardStyle(isRed, isFaceDown) {
  if (isFaceDown) {
    return {
      display: "inline-block",
      padding: "clamp(6px, 1vw, 10px) clamp(10px, 1.5vw, 15px)",
      margin: "0 3px",
      background: "#2b5797",
      borderRadius: 8,
      color: "white",
      fontWeight: "bold",
      fontSize: "clamp(0.8rem, 2vw, 1.2rem)",
      minWidth: "clamp(35px, 6vw, 50px)",
    };
  }
  return {
    display: "inline-block",
    padding: "clamp(6px, 1vw, 10px) clamp(10px, 1.5vw, 15px)",
    margin: "0 3px",
    background: "white",
    borderRadius: 8,
    color: isRed ? "#c33" : "#1f2a2f",
    fontWeight: "bold",
    fontSize: "clamp(0.8rem, 2vw, 1.2rem)",
    minWidth: "clamp(35px, 6vw, 50px)",
  };
}
