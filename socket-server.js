// socket-server.js - COMPLETO COM CHAT E CONVITES CORRIGIDOS
const { Server } = require("socket.io");

// ====================== ESTADO ======================
const rooms = new Map();
const onlineUsers = new Map(); // socketId -> username
const userSockets = new Map(); // username -> socketId
const pendingInvites = new Map(); // inviteId -> { from, to, roomId, timestamp }

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateInviteId() {
  return `invite_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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
const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://poker-chi-neon.vercel.app";

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
  };
}

// ====================== BROADCAST LISTA DE SALAS ======================
async function broadcastRoomList() {
  const roomList = [];

  for (const [roomId, room] of rooms) {
    // 🔥 FILTRAR SALAS DE CONVITE DA LISTA PÚBLICA
    if (roomId.startsWith("ROOM_INVITE_")) {
      continue; // Não mostrar salas de convite no lobby público
    }

    const updatedPlayers = [];
    for (const player of room.players) {
      const currentChips = await getChipsFromDatabase(player.name);
      updatedPlayers.push({
        name: player.name,
        chips: currentChips,
      });
      player.chips = currentChips;
    }

    roomList.push({
      roomId: roomId,
      players: updatedPlayers,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers || 4,
      isGameActive: !!room.gameState,
    });
  }

  io.emit("room-list", roomList);
}

// ====================== BROADCAST USUÁRIOS ONLINE ======================
function broadcastOnlineUsers() {
  const onlineList = Array.from(onlineUsers.values());
  io.emit("friends-online", { online: onlineList });
  console.log(
    `📡 friends-online emitido: ${onlineList.length} usuários online`,
  );
}

// ====================== FUNÇÃO PARA ENVIAR CONVITE ======================
function sendInviteToUser(toUsername, inviteData) {
  const socketId = userSockets.get(toUsername);
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("group-invite", inviteData);
      console.log(`📤 Convite enviado para ${toUsername}`);
      return true;
    }
  }
  console.log(`❌ Usuário ${toUsername} não está online`);
  return false;
}

// ====================== EVENTOS ======================
io.on("connection", (socket) => {
  console.log(`🟢 Conectado: ${socket.id}`);

  // 🔥 REGISTRAR USUÁRIO ONLINE
  socket.on("friend-online", (data) => {
    const { username } = data;
    if (username) {
      onlineUsers.set(socket.id, username);
      userSockets.set(username, socket.id);
      console.log(`👤 ${username} está online (${onlineUsers.size} online)`);
      broadcastOnlineUsers();
    }
  });

  // 🔥 LISTAR SALAS
  socket.on("list-rooms", async () => {
    await broadcastRoomList();
  });

  // 🔥 CRIAR SALA
  socket.on("create-room", async (data) => {
    const {
      playerName,
      invitedPlayers,
      maxPlayers,
      roomId: customRoomId,
    } = data;

    // 🔥 SE FOR CONVITE, USAR ROOM_INVITE_ NO ID
    const isInvite = invitedPlayers && invitedPlayers.length > 0;
    const roomId =
      customRoomId ||
      (isInvite ? `ROOM_INVITE_${generateRoomId()}` : generateRoomId());

    const userChips = await getChipsFromDatabase(playerName);

    rooms.set(roomId, {
      players: [
        {
          id: socket.id,
          name: playerName,
          chips: userChips,
          isReady: false,
          hasClosedSummary: false,
        },
      ],
      gameState: null,
      isSummaryVisible: false,
      summaryTimer: null,
      messages: [],
      maxPlayers: maxPlayers || (isInvite ? invitedPlayers.length + 1 : 4),
      invitedPlayers: invitedPlayers || [],
      isInviteRoom: isInvite,
    });

    socket.join(roomId);
    socket.emit("room-created", { roomId });
    socket.emit("room-update", rooms.get(roomId));
    socket.emit("chat-history", { roomId, messages: [] });

    await broadcastRoomList();

    console.log(
      `✅ Sala criada: ${roomId} por ${playerName} (${userChips} fichas)${isInvite ? " [CONVITE]" : ""}`,
    );
  });

  // 🔥 ENTRAR NA SALA
  socket.on("join-room", async (data) => {
    const { roomId, playerName } = data;
    const normalizedRoomId = roomId.toUpperCase();

    const room = rooms.get(normalizedRoomId);
    if (!room) {
      socket.emit("error", {
        message: `Sala não encontrada: ${normalizedRoomId}`,
      });
      return;
    }

    if (room.players.find((p) => p.id === socket.id)) {
      socket.emit("error", { message: "Você já está nesta sala!" });
      return;
    }

    if (room.players.length >= (room.maxPlayers || 4)) {
      socket.emit("error", { message: "Sala lotada!" });
      return;
    }

    const userChips = await getChipsFromDatabase(playerName);

    if (!room.messages) {
      room.messages = [];
    }

    room.players.push({
      id: socket.id,
      name: playerName,
      chips: userChips,
      isReady: false,
      hasClosedSummary: false,
    });
    socket.join(normalizedRoomId);

    io.to(normalizedRoomId).emit("room-update", room);
    socket.emit("chat-history", {
      roomId: normalizedRoomId,
      messages: room.messages,
    });

    const systemMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      playerId: "system",
      playerName: "Sistema",
      message: `${playerName} entrou na sala.`,
      timestamp: new Date().toISOString(),
      isSystem: true,
    };
    room.messages.push(systemMessage);
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }
    io.to(normalizedRoomId).emit("chat-message", systemMessage);

    await broadcastRoomList();

    console.log(
      `✅ ${playerName} entrou na sala ${normalizedRoomId} (${userChips} fichas)`,
    );
  });

  // ====================== 🔥 CHAT PRIVADO (AMIGOS) ======================
  socket.on("private-message", (data) => {
    const { to, from, message } = data;

    if (!to || !from || !message) {
      console.log("⚠️ private-message: dados incompletos");
      return;
    }

    console.log(`💬 Mensagem privada de ${from} para ${to}: ${message}`);

    const targetSocketId = userSockets.get(to);
    if (targetSocketId) {
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit("private-message", {
          from,
          message,
          timestamp: new Date().toISOString(),
        });
        console.log(`✅ Mensagem entregue a ${to}`);
      } else {
        console.log(`❌ Socket ${to} não encontrado`);
      }
    } else {
      console.log(`❌ Usuário ${to} não está online`);
      socket.emit("error", {
        message: `${to} não está online no momento.`,
      });
    }
  });

  // ====================== 🔥 CONVITE EM GRUPO ======================
  socket.on("group-invite", (data) => {
    const { inviteId, from, players, message, roomId } = data;

    if (!from || !players || players.length === 0) {
      console.log("⚠️ group-invite: dados incompletos");
      socket.emit("error", { message: "Dados do convite incompletos" });
      return;
    }

    console.log(`📤 Convite de ${from} para ${players.join(", ")}`);

    const inviteData = {
      inviteId: inviteId || generateInviteId(),
      from,
      players,
      message: message || `${from} te convidou para uma partida de poker!`,
      roomId: roomId || `ROOM_INVITE_${inviteId || generateInviteId()}`,
      timestamp: new Date().toISOString(),
    };

    pendingInvites.set(inviteData.inviteId, {
      ...inviteData,
      fromSocketId: socket.id,
      createdAt: Date.now(),
    });

    let sentCount = 0;
    for (const player of players) {
      const sent = sendInviteToUser(player, inviteData);
      if (sent) sentCount++;
    }

    socket.emit("invite-sent", {
      success: true,
      inviteId: inviteData.inviteId,
      players: players,
      sentCount: sentCount,
    });

    console.log(
      `✅ Convite ${inviteData.inviteId} enviado para ${sentCount} jogadores`,
    );
  });

  // ====================== 🔥 ACEITAR CONVITE ======================
  socket.on("accept-invite", (data) => {
    const { inviteId, from } = data;

    if (!inviteId || !from) {
      console.log("⚠️ accept-invite: dados incompletos");
      return;
    }

    console.log(`✅ ${from} aceitou o convite ${inviteId}`);

    const invite = pendingInvites.get(inviteId);
    if (!invite) {
      socket.emit("error", { message: "Convite expirado ou não encontrado" });
      return;
    }

    const creatorSocketId = userSockets.get(invite.from);
    if (creatorSocketId) {
      const creatorSocket = io.sockets.sockets.get(creatorSocketId);
      if (creatorSocket) {
        creatorSocket.emit("invite-accepted", {
          inviteId,
          from,
          roomId: invite.roomId,
        });
        console.log(`📤 Notificação de aceite enviada para ${invite.from}`);
      }
    }

    setTimeout(() => {
      pendingInvites.delete(inviteId);
    }, 5000);
  });

  // ====================== 🔥 RECUSAR CONVITE ======================
  socket.on("decline-invite", (data) => {
    const { inviteId, from } = data;

    if (!inviteId || !from) {
      console.log("⚠️ decline-invite: dados incompletos");
      return;
    }

    console.log(`❌ ${from} recusou o convite ${inviteId}`);

    const invite = pendingInvites.get(inviteId);
    if (!invite) {
      return;
    }

    const creatorSocketId = userSockets.get(invite.from);
    if (creatorSocketId) {
      const creatorSocket = io.sockets.sockets.get(creatorSocketId);
      if (creatorSocket) {
        creatorSocket.emit("invite-declined", {
          inviteId,
          from,
          roomId: invite.roomId,
        });
        console.log(`📤 Notificação de recusa enviada para ${invite.from}`);
      }
    }

    pendingInvites.delete(inviteId);
  });

  // ====================== CHAT DA SALA ======================
  socket.on("send-chat-message", (data) => {
    const { roomId, message } = data || {};
    if (!roomId) return;

    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);
    if (!room) {
      socket.emit("error", { message: "Sala não encontrada para o chat." });
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) {
      socket.emit("error", { message: "Você não está nesta sala." });
      return;
    }

    const trimmed = (message || "").toString().trim();
    if (!trimmed) return;

    const safeMessage = trimmed.slice(0, 300);

    const chatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      playerId: socket.id,
      playerName: player.name,
      message: safeMessage,
      timestamp: new Date().toISOString(),
      isSystem: false,
    };

    if (!room.messages) room.messages = [];
    room.messages.push(chatMessage);

    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    io.to(normalizedRoomId).emit("chat-message", chatMessage);

    console.log(`💬 [${normalizedRoomId}] ${player.name}: ${safeMessage}`);
  });

  // ====================== PLAYER READY ======================
  socket.on("player-ready", (data) => {
    const { roomId } = data;
    const normalizedRoomId = roomId.toUpperCase();
    const room = rooms.get(normalizedRoomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(normalizedRoomId).emit("room-update", room);

      const allReady = room.players.every((p) => p.isReady);
      // 🔥 PERMITIR INICIAR COM 2+ JOGADORES
      if (allReady && room.players.length >= 2) {
        startGame(normalizedRoomId);
      } else if (allReady && room.players.length < 2) {
        console.log(
          `⚠️ Sala ${normalizedRoomId} tem ${room.players.length} jogadores, mínimo 2 para iniciar`,
        );
        io.to(normalizedRoomId).emit("error", {
          message: `Precisa de pelo menos 2 jogadores para iniciar (atualmente ${room.players.length})`,
        });
      }
    }
  });

  // ====================== START GAME ======================
  function startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    const numPlayers = room.players.length;
    if (numPlayers < 2) {
      console.log(
        `⚠️ Sala ${roomId} não tem jogadores suficientes (${numPlayers})`,
      );
      return;
    }

    const deck = createDeck();

    const gameState = {
      phase: "preflop",
      deck: deck,
      communityCards: [],
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        cards: [],
        chips: p.chips || 1000,
        bet: 0,
        isFolded: false,
        isAllIn: false,
        isActive: true,
        hasActed: false,
        hasClosedSummary: false,
      })),
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      actionCount: 0,
      lastRaiser: -1,
      roundStartIndex: 0,
      bettingRoundComplete: false,
    };

    gameState.players.forEach((p) => {
      p.cards = [deck.pop(), deck.pop()];
    });

    const sb = 25;
    const bb = 50;
    const sbIdx = 1 % numPlayers;
    const bbIdx = 2 % numPlayers;

    gameState.dealerIndex = 0;

    const sbPlayer = gameState.players[sbIdx];
    if (sbPlayer.chips >= sb) {
      sbPlayer.chips -= sb;
      sbPlayer.bet = sb;
    } else {
      sbPlayer.bet = sbPlayer.chips;
      sbPlayer.chips = 0;
      sbPlayer.isAllIn = true;
    }
    gameState.pot += sbPlayer.bet;

    const bbPlayer = gameState.players[bbIdx];
    if (bbPlayer.chips >= bb) {
      bbPlayer.chips -= bb;
      bbPlayer.bet = bb;
    } else {
      bbPlayer.bet = bbPlayer.chips;
      bbPlayer.chips = 0;
      bbPlayer.isAllIn = true;
    }
    gameState.pot += bbPlayer.bet;

    gameState.currentBet = bb;
    gameState.lastRaiser = bbIdx;
    gameState.currentPlayerIndex = (bbIdx + 1) % numPlayers;
    gameState.roundStartIndex = gameState.currentPlayerIndex;

    room.gameState = gameState;

    const safeGameState = sanitizeGameState(gameState);
    io.to(roomId).emit("game-started", safeGameState);
    console.log(`🎮 Jogo iniciado na sala ${roomId} (${numPlayers} jogadores)`);
  }

  // ====================== PLAYER ACTION ======================
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

    switch (action) {
      case "fold":
        player.isFolded = true;
        player.isActive = false;
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
          console.log(`👤 ${player.name} ALL-IN CALL ${allInCall}`);
        } else {
          player.chips -= callAmount;
          player.bet += callAmount;
          gameState.pot += callAmount;
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
        console.log(`👤 ${player.name} ALL-IN ${allInAmount}`);
        break;
    }

    advanceGame(normalizedRoomId);
  });

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

    switch (gameState.phase) {
      case "preflop":
        gameState.phase = "flop";
        for (let i = 0; i < 3 && gameState.deck.length > 0; i++) {
          gameState.communityCards.push(gameState.deck.pop());
        }
        break;
      case "flop":
        gameState.phase = "turn";
        if (gameState.deck.length > 0) {
          gameState.communityCards.push(gameState.deck.pop());
        }
        break;
      case "turn":
        gameState.phase = "river";
        if (gameState.deck.length > 0) {
          gameState.communityCards.push(gameState.deck.pop());
        }
        break;
      case "river":
        endRound(roomId);
        return;
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

        await broadcastRoomList();

        console.log(
          `🔄 Jogo resetado na sala ${normalizedRoomId} (todos fecharam)`,
        );
      }
    } else {
      io.to(normalizedRoomId).emit("summary-progress", {
        roomId: normalizedRoomId,
        closedCount: closedCount,
        totalPlayers: totalPlayers,
        players: room.players.map((p) => ({
          name: p.name,
          hasClosed: p.hasClosedSummary,
        })),
      });
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
      console.log(`📊 Resumo enviado. Aguardando cliques individuais...`);

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

    for (const player of room.players) {
      if (player.id === socket.id) {
        await saveChipsToDatabase(player.name, player.chips);
        console.log(
          `💾 Fichas de ${player.name} salvas ao sair: ${player.chips}`,
        );
      }
    }

    const leavingPlayer = room.players.find((p) => p.id === socket.id);

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

      if (leavingPlayer && room.messages) {
        const systemMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          playerId: "system",
          playerName: "Sistema",
          message: `${leavingPlayer.name} saiu da sala.`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        };
        room.messages.push(systemMessage);
        io.to(normalizedRoomId).emit("chat-message", systemMessage);
      }
    }

    await broadcastRoomList();
  });

  // ====================== DESCONEXÃO ======================
  socket.on("disconnect", () => {
    console.log(`🔴 Desconectado: ${socket.id}`);

    const username = onlineUsers.get(socket.id);
    if (username) {
      onlineUsers.delete(socket.id);
      userSockets.delete(username);
      console.log(`👤 ${username} ficou offline (${onlineUsers.size} online)`);
      broadcastOnlineUsers();
    }

    rooms.forEach((room, roomId) => {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx !== -1) {
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
console.log(`  - Abra duas janelas (Edge e Chrome)`);
console.log(`  - Entre na mesma sala`);
console.log(`  - Ambos cliquem em "Pronto para jogar"\n`);
console.log(`🆕 NOVIDADES:`);
console.log(`   ✅ Cada jogador fecha o resumo individualmente`);
console.log(`   ✅ Timer de 25 segundos como fallback`);
console.log(`   ✅ Indicador de progresso (quem já fechou)`);
console.log(`   ✅ Chat em tempo real na sala de espera`);
console.log(`   ✅ Detecção de usuários online (friends-online)`);
console.log(`   ✅ Chat privado entre amigos (private-message)`);
console.log(`   ✅ Convites para multiplayer (group-invite)`);
console.log(`   ✅ Salas de convite não aparecem no lobby público`);
