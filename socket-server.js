// socket-server.js - COMPLETO CORRIGIDO SEM ERROS DE SINTAXE
const { Server } = require("socket.io");

// ====================== ESTADO ======================
const rooms = new Map();
const onlineUsers = new Map();

function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createDeck() {
  const suits = ["♥", "♦", "♣", "♠"];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ====================== AVALIAÇÃO DE MÃOS ======================
function getHandRank(cards) {
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = false;
  const uniqueRanks = [...new Set(ranks)];
  if (uniqueRanks.length === 5) {
    if (ranks[4] - ranks[0] === 4) isStraight = true;
    if (
      ranks[0] === 2 &&
      ranks[1] === 3 &&
      ranks[2] === 4 &&
      ranks[3] === 5 &&
      ranks[4] === 14
    ) {
      isStraight = true;
    }
  }

  const counts = {};
  ranks.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
  const values = Object.values(counts);

  const isFour = values.includes(4);
  const isThree = values.includes(3);
  const pairs = values.filter((v) => v === 2).length;
  const isFullHouse = isThree && pairs === 1;
  const isTwoPair = pairs === 2;
  const isOnePair = pairs === 1;

  let score = 0;
  if (isFlush && isStraight) score = 9;
  else if (isFour) score = 8;
  else if (isFullHouse) score = 7;
  else if (isFlush) score = 6;
  else if (isStraight) score = 5;
  else if (isThree) score = 4;
  else if (isTwoPair) score = 3;
  else if (isOnePair) score = 2;
  else score = 1;

  const kickers = ranks.slice().sort((a, b) => b - a);
  return score * 10 ** 10 + kickers.reduce((a, b) => a * 100 + b, 0);
}

function getHandName(score) {
  const type = Math.floor(score / 10 ** 10);
  const names = [
    "",
    "Carta Alta",
    "Um Par",
    "Dois Pares",
    "Trinca",
    "Sequencia",
    "Flush",
    "Full House",
    "Quadra",
    "Straight Flush",
  ];
  return names[type] || "Carta Alta";
}

function evaluateBestHand(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];
  let bestScore = 0;
  for (let i = 0; i < allCards.length; i++) {
    for (let j = i + 1; j < allCards.length; j++) {
      for (let k = j + 1; k < allCards.length; k++) {
        for (let l = k + 1; l < allCards.length; l++) {
          for (let m = l + 1; m < allCards.length; m++) {
            const score = getHandRank([
              allCards[i],
              allCards[j],
              allCards[k],
              allCards[l],
              allCards[m],
            ]);
            if (score > bestScore) bestScore = score;
          }
        }
      }
    }
  }
  return bestScore;
}

// ====================== SERVIDOR ======================
const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ====================== FUNÇÕES PARA API PÚBLICA ======================
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getChipsFromDatabase(playerName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/get-chips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: playerName }),
    });
    const data = await response.json();
    if (data.success) {
      return data.chips || 1000;
    }
    return 1000;
  } catch (error) {
    console.error(`❌ Erro ao buscar fichas de ${playerName}:`, error.message);
    return 1000;
  }
}

async function saveChipsToDatabase(playerName, chips) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/save-chips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: playerName, chips: chips }),
    });
    const data = await response.json();
    if (data.success) {
      console.log(`✅ ${playerName}: ${chips} fichas salvas no MongoDB`);
      return true;
    }
    console.log(`⚠️ Falha ao salvar fichas de ${playerName}: ${data.error}`);
    return false;
  } catch (error) {
    console.error(`❌ Erro ao salvar fichas de ${playerName}:`, error.message);
    return false;
  }
}

// ====================== FUNÇÃO PARA CLONAR GAMESTATE ======================
function sanitizeGameState(gameState) {
  if (!gameState) return null;
  return {
    phase: gameState.phase,
    communityCards: gameState.communityCards
      ? [...gameState.communityCards]
      : [],
    players: gameState.players
      ? gameState.players.map((p) => ({
          id: p.id,
          name: p.name,
          cards: p.cards ? [...p.cards] : [],
          chips: p.chips,
          bet: p.bet,
          isFolded: p.isFolded,
          isAllIn: p.isAllIn,
          isActive: p.isActive,
          hasActed: p.hasActed,
          hasClosedSummary: p.hasClosedSummary || false,
          position: p.position || 0,
        }))
      : [],
    pot: gameState.pot,
    currentBet: gameState.currentBet,
    currentPlayerIndex: gameState.currentPlayerIndex,
    dealerIndex: gameState.dealerIndex,
    actionCount: gameState.actionCount,
    lastRaiser: gameState.lastRaiser,
    roundStartIndex: gameState.roundStartIndex,
    bettingRoundComplete: gameState.bettingRoundComplete,
    smallBlind: gameState.smallBlind || 25,
    bigBlind: gameState.bigBlind || 50,
    chatMessages: gameState.chatMessages || [],
  };
}

// ====================== BROADCAST LISTA DE SALAS ======================
async function broadcastRoomList() {
  const roomList = [];

  console.log(`📡 Broadcast room-list: ${rooms.size} salas no total`);

  for (const [roomId, room] of rooms) {
    if (!room || !room.players || room.players.length === 0) {
      if (room && room.players && room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ Sala ${roomId} removida (vazia)`);
      }
      continue;
    }

    const updatedPlayers = [];
    for (const player of room.players) {
      if (!player || !player.name) continue;
      try {
        const currentChips = await getChipsFromDatabase(player.name);
        player.chips = currentChips;
        updatedPlayers.push({
          name: player.name,
          chips: currentChips,
          isReady: player.isReady || false,
        });
      } catch (error) {
        updatedPlayers.push({
          name: player.name,
          chips: player.chips || 1000,
          isReady: player.isReady || false,
        });
      }
    }

    roomList.push({
      roomId: roomId,
      players: updatedPlayers,
      playerCount: updatedPlayers.length,
      maxPlayers: room.maxPlayers || 6,
      isGameActive: !!room.gameState,
      hasAvailableSlot: updatedPlayers.length < (room.maxPlayers || 6),
    });
  }

  console.log(`📡 Enviando ${roomList.length} salas para todos os clientes`);
  roomList.forEach((room) => {
    console.log(
      `  🏠 ${room.roomId} - ${room.playerCount}/${room.maxPlayers} jogadores`,
    );
  });

  io.emit("room-list", roomList);
}

// ====================== EVENTOS ======================
io.on("connection", (socket) => {
  console.log(`🟢 Conectado: ${socket.id}`);

  // ====================== AMIGO ONLINE ======================
  socket.on("friend-online", (data) => {
    const { username } = data;

    if (!username) return;

    console.log(`🟢 ${username} está online (socket: ${socket.id})`);

    let oldId = null;
    for (const [id, user] of onlineUsers) {
      if (user.username === username) {
        oldId = id;
        break;
      }
    }
    if (oldId) {
      onlineUsers.delete(oldId);
    }

    onlineUsers.set(socket.id, { username, socket });

    const onlineList = Array.from(onlineUsers.values()).map((u) => u.username);
    console.log(
      `📡 Broadcast friends-online: ${onlineList.length} usuários online`,
    );
    io.emit("friends-online", { online: onlineList });
  });

  // ====================== CONVITE EM GRUPO ======================
  socket.on("group-invite", (data) => {
    const { inviteId, from, players, message, roomId } = data;
    console.log(`📤 ${from} convidou ${players.length} amigos:`, players);

    const finalRoomId = roomId || `ROOM_${inviteId}`;

    let sentCount = 0;
    for (const [id, user] of onlineUsers) {
      if (players.includes(user.username)) {
        user.socket.emit("group-invite", {
          inviteId,
          from,
          players,
          message,
          roomId: finalRoomId,
          timestamp: Date.now(),
        });
        sentCount++;
      }
    }

    socket.emit("invite-sent", {
      success: true,
      players: players,
      sentCount: sentCount,
      roomId: finalRoomId,
    });

    console.log(`✅ ${sentCount} convites enviados para a sala ${finalRoomId}`);
  });

  // ====================== ACEITAR CONVITE ======================
  socket.on("accept-invite", (data) => {
    const { inviteId, from } = data;
    console.log(`✅ ${from} aceitou o convite ${inviteId}`);

    io.emit("invite-accepted", {
      inviteId,
      from,
      timestamp: Date.now(),
    });
  });

  // ====================== RECUSAR CONVITE ======================
  socket.on("decline-invite", (data) => {
    const { inviteId, from } = data;
    console.log(`❌ ${from} recusou o convite ${inviteId}`);

    io.emit("invite-declined", {
      inviteId,
      from,
      timestamp: Date.now(),
    });
  });

  // ====================== MENSAGEM PRIVADA ======================
  socket.on("private-message", (data) => {
    const { to, from, message } = data;
    console.log(`💬 ${from} -> ${to}: ${message}`);

    for (const [id, user] of onlineUsers) {
      if (user.username === to) {
        user.socket.emit("private-message", {
          from,
          message,
          timestamp: Date.now(),
        });
        break;
      }
    }
  });

  // ====================== LISTAR SALAS ======================
  socket.on("list-rooms", async () => {
    console.log(`📡 Cliente ${socket.id} solicitou lista de salas`);
    await broadcastRoomList();
  });

  // ====================== CRIAR SALA ======================
  socket.on("create-room", async (data) => {
    const {
      playerName,
      maxPlayers = 6,
      invitedPlayers = [],
      roomId: customRoomId,
    } = data;

    let roomId = customRoomId;
    if (!roomId) {
      roomId = generateRoomId();
    }

    roomId = roomId.toUpperCase();

    if (rooms.has(roomId)) {
      socket.emit("error", { message: `Sala ${roomId} já existe!` });
      return;
    }

    const userChips = await getChipsFromDatabase(playerName);

    rooms.set(roomId, {
      players: [
        {
          id: socket.id,
          name: playerName,
          chips: userChips,
          isReady: false,
          hasClosedSummary: false,
          position: 0,
        },
      ],
      gameState: null,
      isSummaryVisible: false,
      summaryTimer: null,
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 6),
      chatMessages: [],
      invitedPlayers: invitedPlayers || [],
    });

    socket.join(roomId);
    socket.emit("room-created", { roomId });

    io.to(roomId).emit("room-update", rooms.get(roomId));

    // 🔥 FORÇAR ATUALIZAÇÃO DA LISTA DE SALAS
    await broadcastRoomList();
    setTimeout(async () => {
      await broadcastRoomList();
    }, 200);
    setTimeout(async () => {
      await broadcastRoomList();
    }, 500);

    console.log(
      `✅ Sala criada: ${roomId} por ${playerName} (${userChips} fichas) | Máx: ${maxPlayers} jogadores | Convidados: ${invitedPlayers.join(", ")}`,
    );
  });

  // ====================== ENTRAR NA SALA ======================
  socket.on("join-room", async (data) => {
    const { roomId, playerName } = data;
    const normalizedRoomId = roomId.toUpperCase();

    console.log(
      `📤 Tentando entrar na sala ${normalizedRoomId} por ${playerName}`,
    );

    const room = rooms.get(normalizedRoomId);
    if (!room) {
      console.log(`❌ Sala não encontrada: ${normalizedRoomId}`);
      socket.emit("error", {
        message: `Sala não encontrada: ${normalizedRoomId}`,
      });
      return;
    }

    if (room.players.find((p) => p.id === socket.id)) {
      console.log(`⚠️ ${playerName} já está na sala ${normalizedRoomId}`);
      socket.emit("room-update", room);
      return;
    }

    if (room.players.length >= (room.maxPlayers || 6)) {
      socket.emit("error", {
        message: `Sala lotada (máx ${room.maxPlayers})!`,
      });
      return;
    }

    const userChips = await getChipsFromDatabase(playerName);

    room.players.push({
      id: socket.id,
      name: playerName,
      chips: userChips,
      isReady: false,
      hasClosedSummary: false,
      position: room.players.length,
    });
    socket.join(normalizedRoomId);

    console.log(
      `✅ ${playerName} entrou na sala ${normalizedRoomId} (${userChips} fichas)`,
    );

    io.to(normalizedRoomId).emit("chat-message", {
      player: "Sistema",
      message: `🎉 ${playerName} entrou na sala!`,
      timestamp: Date.now(),
      isSystem: true,
    });

    io.to(normalizedRoomId).emit("room-update", room);

    setTimeout(async () => {
      await broadcastRoomList();
    }, 100);
  });

  // ====================== PRONTO PARA JOGAR ======================
  socket.on("player-ready", (data) => {
    const { roomId } = data;
    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);
    if (!room) {
      socket.emit("error", {
        message: `Sala não encontrada: ${normalizedRoomId}`,
      });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      console.log(
        `🔄 ${player.name} ${player.isReady ? "✅ pronto" : "⏸️ não pronto"} na sala ${normalizedRoomId}`,
      );

      io.to(normalizedRoomId).emit("room-update", room);

      io.to(normalizedRoomId).emit("chat-message", {
        player: "Sistema",
        message: `${player.name} ${player.isReady ? "✅ está pronto!" : "⏸️ não está mais pronto"}`,
        timestamp: Date.now(),
        isSystem: true,
      });

      const allReady = room.players.every((p) => p.isReady);
      if (allReady && room.players.length >= 2) {
        console.log(
          `🚀 Todos prontos na sala ${normalizedRoomId}! Iniciando...`,
        );
        io.to(normalizedRoomId).emit("chat-message", {
          player: "Sistema",
          message: "🚀 Todos prontos! Iniciando partida...",
          timestamp: Date.now(),
          isSystem: true,
        });
        startGame(normalizedRoomId);
      }
    }
  });

  // ====================== INICIAR JOGO ======================
  function startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    const deck = createDeck();
    const numPlayers = room.players.length;

    const smallBlind = 25;
    const bigBlind = 50;

    const gameState = {
      phase: "preflop",
      deck: deck,
      communityCards: [],
      players: room.players.map((p, index) => ({
        id: p.id,
        name: p.name,
        cards: [],
        chips: p.chips,
        bet: 0,
        isFolded: false,
        isAllIn: false,
        isActive: true,
        hasActed: false,
        hasClosedSummary: false,
        position: index,
      })),
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      actionCount: 0,
      lastRaiser: -1,
      roundStartIndex: 0,
      bettingRoundComplete: false,
      smallBlind: smallBlind,
      bigBlind: bigBlind,
      chatMessages: room.chatMessages || [],
    };

    gameState.players.forEach((p) => {
      p.cards = [deck.pop(), deck.pop()];
    });

    const sbIdx = 1 % numPlayers;
    const bbIdx = 2 % numPlayers;

    gameState.dealerIndex = 0;

    const sbPlayer = gameState.players[sbIdx];
    if (sbPlayer.chips >= smallBlind) {
      sbPlayer.chips -= smallBlind;
      sbPlayer.bet = smallBlind;
    } else {
      sbPlayer.bet = sbPlayer.chips;
      sbPlayer.chips = 0;
      sbPlayer.isAllIn = true;
    }
    gameState.pot += sbPlayer.bet;

    const bbPlayer = gameState.players[bbIdx];
    if (bbPlayer.chips >= bigBlind) {
      bbPlayer.chips -= bigBlind;
      bbPlayer.bet = bigBlind;
    } else {
      bbPlayer.bet = bbPlayer.chips;
      bbPlayer.chips = 0;
      bbPlayer.isAllIn = true;
    }
    gameState.pot += bbPlayer.bet;

    gameState.currentBet = bigBlind;
    gameState.lastRaiser = bbIdx;
    gameState.currentPlayerIndex = (bbIdx + 1) % numPlayers;
    gameState.roundStartIndex = gameState.currentPlayerIndex;

    room.gameState = gameState;

    io.to(roomId).emit("chat-message", {
      player: "Sistema",
      message: `🃏 Partida iniciada! Small Blind: ${smallBlind}, Big Blind: ${bigBlind}`,
      timestamp: Date.now(),
      isSystem: true,
    });

    const safeGameState = sanitizeGameState(gameState);
    io.to(roomId).emit("game-started", safeGameState);
    console.log(`🎮 Jogo iniciado na sala ${roomId}`);
  }

  // ====================== AÇÕES DO JOGADOR ======================
  socket.on("player-action", (data) => {
    const { roomId, action, amount } = data;
    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);
    if (!room || !room.gameState) return;

    const gameState = room.gameState;
    const playerIndex = gameState.players.findIndex((p) => p.id === socket.id);
    if (playerIndex === -1) return;

    const player = gameState.players[playerIndex];

    if (gameState.currentPlayerIndex !== playerIndex) {
      socket.emit("error", { message: "Não é sua vez!" });
      return;
    }

    if (player.isFolded) {
      socket.emit("error", { message: "Você já desistiu!" });
      return;
    }

    player.hasActed = true;
    gameState.actionCount++;

    let actionMessage = "";

    switch (action) {
      case "fold":
        player.isFolded = true;
        player.isActive = false;
        actionMessage = `🙅 ${player.name} desistiu`;
        console.log(`👤 ${player.name} FOLD`);
        break;

      case "check":
        if (player.bet < gameState.currentBet) {
          socket.emit("error", {
            message: "❌ Você precisa pagar a aposta antes de dar CHECK!",
          });
          player.hasActed = false;
          gameState.actionCount--;
          return;
        }
        actionMessage = `✅ ${player.name} deu CHECK`;
        console.log(`👤 ${player.name} CHECK`);
        break;

      case "call":
        const callAmount = gameState.currentBet - player.bet;
        if (callAmount > player.chips) {
          const allInCall = player.chips;
          player.bet += allInCall;
          player.chips = 0;
          gameState.pot += allInCall;
          player.isAllIn = true;
          actionMessage = `💰 ${player.name} pagou ALL-IN ${allInCall}`;
          console.log(`👤 ${player.name} ALL-IN CALL ${allInCall}`);
        } else {
          player.chips -= callAmount;
          player.bet += callAmount;
          gameState.pot += callAmount;
          actionMessage = `💰 ${player.name} pagou ${callAmount}`;
          console.log(`👤 ${player.name} CALL ${callAmount}`);
        }
        break;

      case "raise":
        const minRaise = gameState.currentBet + 50;
        if (amount < minRaise) {
          socket.emit("error", { message: `Aumento mínimo: ${minRaise}` });
          player.hasActed = false;
          gameState.actionCount--;
          return;
        }
        const raiseAmount = amount - player.bet;
        if (raiseAmount > player.chips) {
          socket.emit("error", { message: "Fichas insuficientes!" });
          player.hasActed = false;
          gameState.actionCount--;
          return;
        }
        player.chips -= raiseAmount;
        player.bet += raiseAmount;
        gameState.pot += raiseAmount;
        gameState.currentBet = player.bet;
        gameState.lastRaiser = playerIndex;
        gameState.players.forEach((p, idx) => {
          if (idx !== playerIndex && !p.isFolded) {
            p.hasActed = false;
          }
        });
        actionMessage = `📈 ${player.name} aumentou para ${amount}`;
        console.log(`👤 ${player.name} RAISE para ${amount}`);
        break;

      case "all-in":
        const allInAmount = player.chips;
        if (allInAmount === 0) {
          socket.emit("error", { message: "Você já está all-in!" });
          player.hasActed = false;
          gameState.actionCount--;
          return;
        }
        player.bet += allInAmount;
        player.chips = 0;
        gameState.pot += allInAmount;
        player.isAllIn = true;
        if (player.bet > gameState.currentBet) {
          gameState.currentBet = player.bet;
          gameState.lastRaiser = playerIndex;
          gameState.players.forEach((p, idx) => {
            if (idx !== playerIndex && !p.isFolded) {
              p.hasActed = false;
            }
          });
        }
        actionMessage = `⚡ ${player.name} ALL-IN ${allInAmount}`;
        console.log(`👤 ${player.name} ALL-IN ${allInAmount}`);
        break;
    }

    if (actionMessage) {
      io.to(normalizedRoomId).emit("chat-message", {
        player: "Ação",
        message: actionMessage,
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    advanceGame(normalizedRoomId);
  });

  // ====================== CHAT EM TEMPO REAL ======================
  socket.on("send-chat-message", (data) => {
    const { roomId, message } = data;
    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);
    if (!room) {
      socket.emit("error", {
        message: `Sala não encontrada: ${normalizedRoomId}`,
      });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    if (message.length > 500) {
      socket.emit("error", { message: "Mensagem muito longa!" });
      return;
    }

    const chatMessage = {
      player: player.name,
      message: message.trim(),
      timestamp: Date.now(),
      isSystem: false,
    };

    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push(chatMessage);
    if (room.chatMessages.length > 100) {
      room.chatMessages = room.chatMessages.slice(-100);
    }

    io.to(normalizedRoomId).emit("chat-message", chatMessage);
  });

  // ====================== AVANÇAR JOGO ======================
  function advanceGame(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const gameState = room.gameState;
    const players = gameState.players;
    const activePlayers = players.filter((p) => !p.isFolded && !p.isAllIn);
    const playersInHand = players.filter((p) => !p.isFolded);

    if (playersInHand.length <= 1) {
      endRound(roomId);
      return;
    }

    if (activePlayers.length === 0) {
      advancePhase(roomId);
      return;
    }

    const allBetMatched = activePlayers.every(
      (p) => p.bet === gameState.currentBet,
    );
    const lastRaiserSatisfied =
      gameState.lastRaiser === -1 ||
      gameState.players[gameState.lastRaiser]?.bet === gameState.currentBet ||
      gameState.players[gameState.lastRaiser]?.isFolded;

    const allActed = activePlayers.every((p) => p.hasActed === true);
    const hasActions = gameState.actionCount > 0;

    if (allBetMatched && lastRaiserSatisfied && allActed && hasActions) {
      console.log(`📢 Rodada de apostas concluída! Avançando fase...`);
      advancePhase(roomId);
      return;
    }

    let nextIndex = (gameState.currentPlayerIndex + 1) % players.length;
    let attempts = 0;
    let foundPlayer = false;

    while (attempts < players.length) {
      const idx =
        (gameState.currentPlayerIndex + 1 + attempts) % players.length;
      const p = players[idx];
      if (!p.isFolded && !p.isAllIn && p.chips > 0) {
        if (
          p.hasActed &&
          gameState.lastRaiser !== -1 &&
          gameState.players[gameState.lastRaiser]?.bet === gameState.currentBet
        ) {
          attempts++;
          continue;
        }
        nextIndex = idx;
        foundPlayer = true;
        break;
      }
      attempts++;
    }

    if (!foundPlayer) {
      const allActedCheck = activePlayers.every((p) => p.hasActed === true);
      if (allActedCheck && hasActions) {
        advancePhase(roomId);
        return;
      }
      advancePhase(roomId);
      return;
    }

    gameState.currentPlayerIndex = nextIndex;

    const safeGameState = sanitizeGameState(gameState);
    io.to(roomId).emit("game-update", safeGameState);
    io.to(roomId).emit("player-turn", { playerId: players[nextIndex].id });
  }

  // ====================== AVANÇAR FASE ======================
  function advancePhase(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const gameState = room.gameState;
    const players = gameState.players;

    players.forEach((p) => {
      if (!p.isFolded) {
        p.bet = 0;
        p.hasActed = false;
      }
    });
    gameState.currentBet = 0;
    gameState.lastRaiser = -1;
    gameState.actionCount = 0;
    gameState.bettingRoundComplete = false;

    let phaseMessage = "";

    switch (gameState.phase) {
      case "preflop":
        gameState.phase = "flop";
        for (let i = 0; i < 3 && gameState.deck.length > 0; i++) {
          gameState.communityCards.push(gameState.deck.pop());
        }
        phaseMessage = "🎴 FLOP - Três cartas comunitárias!";
        break;
      case "flop":
        gameState.phase = "turn";
        if (gameState.deck.length > 0) {
          gameState.communityCards.push(gameState.deck.pop());
        }
        phaseMessage = "🔄 TURN - Quarta carta!";
        break;
      case "turn":
        gameState.phase = "river";
        if (gameState.deck.length > 0) {
          gameState.communityCards.push(gameState.deck.pop());
        }
        phaseMessage = "🌊 RIVER - Última carta!";
        break;
      case "river":
        endRound(roomId);
        return;
    }

    if (phaseMessage) {
      io.to(roomId).emit("chat-message", {
        player: "Sistema",
        message: phaseMessage,
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    const startIndex = (gameState.dealerIndex + 1) % players.length;
    let firstActive = -1;
    for (let i = 0; i < players.length; i++) {
      const idx = (startIndex + i) % players.length;
      const p = players[idx];
      if (!p.isFolded && !p.isAllIn && p.chips > 0) {
        firstActive = idx;
        break;
      }
    }

    if (firstActive === -1) {
      endRound(roomId);
      return;
    }

    gameState.currentPlayerIndex = firstActive;
    gameState.roundStartIndex = firstActive;

    const safeGameState = sanitizeGameState(gameState);
    io.to(roomId).emit("game-update", safeGameState);
    io.to(roomId).emit("player-turn", { playerId: players[firstActive].id });
    console.log(
      `📢 Fase: ${gameState.phase} - Começa com ${players[firstActive].name}`,
    );
  }

  // ====================== FECHAR RESUMO ======================
  socket.on("close-summary", async (data) => {
    const { roomId } = data;
    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);

    if (!room) {
      socket.emit("error", { message: "Sala não encontrada." });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) {
      socket.emit("error", { message: "Jogador não encontrado na sala." });
      return;
    }

    player.hasClosedSummary = true;

    if (room.gameState) {
      const gamePlayer = room.gameState.players.find((p) => p.id === socket.id);
      if (gamePlayer) {
        gamePlayer.hasClosedSummary = true;
      }
    }

    const closedCount = room.players.filter((p) => p.hasClosedSummary).length;
    const totalPlayers = room.players.length;

    console.log(
      `📊 ${player.name} fechou o resumo (${closedCount}/${totalPlayers})`,
    );

    socket.emit("summary-closed", {
      roomId: normalizedRoomId,
      playerId: socket.id,
    });

    io.to(normalizedRoomId).emit("summary-progress", {
      roomId: normalizedRoomId,
      closedCount: closedCount,
      totalPlayers: totalPlayers,
      players: room.players.map((p) => ({
        name: p.name,
        hasClosed: p.hasClosedSummary,
      })),
    });

    const allClosed = room.players.every((p) => p.hasClosedSummary === true);

    if (allClosed) {
      console.log(
        `✅ Todos os jogadores fecharam! Resetando sala ${normalizedRoomId}`,
      );

      if (room.summaryTimer) {
        clearTimeout(room.summaryTimer);
        room.summaryTimer = null;
      }

      if (room.gameState) {
        for (const p of room.gameState.players) {
          await saveChipsToDatabase(p.name, p.chips);
        }

        room.gameState = null;
        room.isSummaryVisible = false;

        room.players.forEach((p) => {
          p.isReady = false;
          p.cards = [];
          p.bet = 0;
          p.isFolded = false;
          p.isAllIn = false;
          p.isActive = true;
          p.hasActed = false;
          p.hasClosedSummary = false;
        });

        io.to(normalizedRoomId).emit("room-update", room);
        io.to(normalizedRoomId).emit("game-reset");
        io.to(normalizedRoomId).emit("chat-message", {
          player: "Sistema",
          message: "🔄 Jogo resetado! Preparem-se para a próxima rodada!",
          timestamp: Date.now(),
          isSystem: true,
        });

        await broadcastRoomList();

        console.log(
          `🔄 Jogo resetado na sala ${normalizedRoomId} (todos fecharam)`,
        );
      }
    }
  });

  // ====================== ENCERRAR RODADA ======================
  async function endRound(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const gameState = room.gameState;
    const playersInHand = gameState.players.filter((p) => !p.isFolded);

    let winner = null;
    let bestScore = -1;
    let results = [];

    if (playersInHand.length === 1) {
      winner = playersInHand[0];
      results.push({
        name: winner.name,
        hand: "Fold dos outros",
        score: 0,
        isWinner: true,
      });
    } else {
      for (const player of playersInHand) {
        const score = evaluateBestHand(player.cards, gameState.communityCards);
        const handName = getHandName(score);
        results.push({
          name: player.name,
          hand: handName,
          score: score,
          isWinner: false,
        });
        if (score > bestScore) {
          bestScore = score;
          winner = player;
        }
      }
      results = results.map((r) => ({
        ...r,
        isWinner: r.name === winner.name,
      }));
    }

    if (winner) {
      winner.chips += gameState.pot;

      console.log(
        `💾 Salvando fichas de ${gameState.players.length} jogadores...`,
      );

      for (const p of gameState.players) {
        await saveChipsToDatabase(p.name, p.chips);
      }

      room.isSummaryVisible = true;

      room.players.forEach((p) => {
        p.hasClosedSummary = false;
      });
      gameState.players.forEach((p) => {
        p.hasClosedSummary = false;
      });

      io.to(roomId).emit("chat-message", {
        player: "Sistema",
        message: `🏆 ${winner.name} venceu ${gameState.pot} fichas com ${results.find((r) => r.isWinner)?.hand || "boa mão"}!`,
        timestamp: Date.now(),
        isSystem: true,
      });

      const roundEndData = {
        winner: {
          name: winner.name,
          chips: winner.chips,
        },
        pot: gameState.pot,
        results: results,
        communityCards: gameState.communityCards,
        players: gameState.players.map((p) => ({
          name: p.name,
          chips: p.chips,
          hasClosedSummary: p.hasClosedSummary || false,
        })),
      };

      io.to(roomId).emit("round-ended", roundEndData);

      console.log(`🏆 ${winner.name} venceu ${gameState.pot} fichas!`);

      if (room.summaryTimer) {
        clearTimeout(room.summaryTimer);
      }

      room.summaryTimer = setTimeout(async () => {
        if (room.isSummaryVisible) {
          console.log(
            `⏰ Timer de 25s - Fechando resumo da sala ${roomId} (fallback)`,
          );

          io.to(roomId).emit("summary-closed", {
            roomId: roomId,
            forced: true,
          });

          if (room.gameState) {
            for (const p of room.gameState.players) {
              await saveChipsToDatabase(p.name, p.chips);
            }

            room.gameState = null;
            room.isSummaryVisible = false;

            room.players.forEach((p) => {
              p.isReady = false;
              p.cards = [];
              p.bet = 0;
              p.isFolded = false;
              p.isAllIn = false;
              p.isActive = true;
              p.hasActed = false;
              p.hasClosedSummary = false;
            });

            io.to(roomId).emit("room-update", room);
            io.to(roomId).emit("game-reset");

            await broadcastRoomList();

            console.log(`🔄 Jogo resetado na sala ${roomId} (timer fallback)`);
          }
        }
        room.summaryTimer = null;
      }, 25000);
    }
  }

  // ====================== SAIR ======================
  socket.on("leave-room", async (data) => {
    const { roomId } = data;
    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      await saveChipsToDatabase(player.name, player.chips);
      console.log(
        `💾 Fichas de ${player.name} salvas ao sair: ${player.chips}`,
      );

      io.to(normalizedRoomId).emit("chat-message", {
        player: "Sistema",
        message: `👋 ${player.name} saiu da sala`,
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.leave(normalizedRoomId);

    if (room.players.length === 0) {
      if (room.summaryTimer) {
        clearTimeout(room.summaryTimer);
        room.summaryTimer = null;
      }
      rooms.delete(normalizedRoomId);
      console.log(`🗑️ Sala ${normalizedRoomId} removida`);
    } else {
      io.to(normalizedRoomId).emit("room-update", room);
    }

    await broadcastRoomList();
  });

  // ====================== JOGADOR SAIU DA SALA ======================
  socket.on("player-left-room", (data) => {
    const { roomId, playerName } = data;
    console.log(`👤 ${playerName} confirmou saída da sala ${roomId}`);

    socket.emit("leave-room-response", {
      roomId: roomId,
      playerName: playerName,
      timestamp: Date.now(),
    });
  });

  // ====================== DESCONEXÃO ======================
  socket.on("disconnect", () => {
    console.log(`🔴 Desconectado: ${socket.id}`);

    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`🔴 ${user.username} desconectou`);
      onlineUsers.delete(socket.id);
      const onlineList = Array.from(onlineUsers.values()).map(
        (u) => u.username,
      );
      console.log(
        `📡 Broadcast friends-online após desconexão: ${onlineList.length} usuários online`,
      );
      io.emit("friends-online", { online: onlineList });
    }

    rooms.forEach((room, roomId) => {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx !== -1) {
        const player = room.players[idx];
        io.to(roomId).emit("chat-message", {
          player: "Sistema",
          message: `👋 ${player.name} desconectou`,
          timestamp: Date.now(),
          isSystem: true,
        });

        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          if (room.summaryTimer) {
            clearTimeout(room.summaryTimer);
            room.summaryTimer = null;
          }
          rooms.delete(roomId);
          console.log(`🗑️ Sala ${roomId} removida`);
        } else {
          io.to(roomId).emit("room-update", room);
        }
      }
    });
    broadcastRoomList();
  });
});

const PORT = process.env.PORT || 3001;
io.listen(PORT);
console.log(`\n🚀 Servidor Socket.IO rodando na porta ${PORT}`);
console.log(`📋 Texas Hold'em Online pronto!\n`);
console.log(`💡 Fluxo correto:`);
console.log(`  1. Preflop -> 2. Flop -> 3. Turn -> 4. River -> 5. Showdown\n`);
console.log(`💡 Para testar:`);
console.log(`  - Abra várias janelas para simular múltiplos jogadores`);
console.log(`  - Entre na mesma sala`);
console.log(`  - Todos cliquem em "Pronto para jogar"\n`);
console.log(`🆕 NOVIDADES:`);
console.log(`   ✅ Suporte a 2-6 jogadores`);
console.log(`   ✅ Sistema de blinds rotativo`);
console.log(`   ✅ Chat em tempo real`);
console.log(`   ✅ Cada jogador fecha o resumo individualmente`);
console.log(`   ✅ Timer de 25 segundos como fallback`);
console.log(`   ✅ Indicador de progresso (quem já fechou)`);
console.log(`   ✅ Convites múltiplos para amigos`);
console.log(
  `   ✅ Redirecionamento automático para o lobby ao aceitar convite`,
);
console.log(`   ✅ Suporte a roomId customizado nos convites`);
console.log(`   ✅ Criação de sala antes do envio de convites`);
console.log(`   ✅ Logs detalhados para debug`);
console.log(`   ✅ Broadcast de salas para todos os usuários`);
console.log(`   ✅ Reset automático do estado do lobby ao sair`);
console.log(`   ✅ LISTA DE SALAS ATUALIZADA EM TEMPO REAL`);
console.log(`   ✅ SALAS DISPONÍVEIS NO LOBBY CORRETAMENTE`);
console.log(`   ✅ MÚLTIPLOS BROADCAST APÓS CRIAR SALA`);
