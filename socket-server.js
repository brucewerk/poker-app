// socket-server.js
const { Server } = require("socket.io");

// ====================== ESTADO ======================
const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
      console.log(`💰 ${playerName} tem ${data.chips} fichas no MongoDB`);
      return data.chips || 1000;
    }
    console.log(`⚠️ Erro ao buscar fichas de ${playerName}: ${data.error}`);
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

// ====================== BROADCAST LISTA DE SALAS ======================
async function broadcastRoomList() {
  const roomList = [];

  for (const [roomId, room] of rooms) {
    const updatedPlayers = [];
    for (const player of room.players) {
      // ✅ SEMPRE BUSCAR DO MONGODB
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
      maxPlayers: 4,
      isGameActive: !!room.gameState,
    });
  }

  io.emit("room-list", roomList);
}

// ====================== EVENTOS ======================
io.on("connection", (socket) => {
  console.log(`🟢 Conectado: ${socket.id}`);

  // ====================== LISTAR SALAS ======================
  socket.on("list-rooms", async () => {
    await broadcastRoomList();
  });

  // ====================== CRIAR SALA ======================
  socket.on("create-room", async (data) => {
    const { playerName } = data;
    const roomId = generateRoomId();

    const userChips = await getChipsFromDatabase(playerName);

    rooms.set(roomId, {
      players: [
        {
          id: socket.id,
          name: playerName,
          chips: userChips,
          isReady: false,
        },
      ],
      gameState: null,
    });

    socket.join(roomId);
    socket.emit("room-created", { roomId });
    socket.emit("room-update", rooms.get(roomId));

    await broadcastRoomList();

    console.log(
      `✅ Sala criada: ${roomId} por ${playerName} (${userChips} fichas)`,
    );
  });

  // ====================== ENTRAR NA SALA ======================
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

    if (room.players.length >= 4) {
      socket.emit("error", { message: "Sala lotada!" });
      return;
    }

    const userChips = await getChipsFromDatabase(playerName);

    room.players.push({
      id: socket.id,
      name: playerName,
      chips: userChips,
      isReady: false,
    });
    socket.join(normalizedRoomId);

    io.to(normalizedRoomId).emit("room-update", room);
    await broadcastRoomList();

    console.log(
      `✅ ${playerName} entrou na sala ${normalizedRoomId} (${userChips} fichas)`,
    );
  });

  // ====================== PRONTO ======================
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
      if (allReady && room.players.length >= 2) {
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

    const gameState = {
      phase: "preflop",
      deck: deck,
      communityCards: [],
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        cards: [],
        chips: p.chips,
        bet: 0,
        isFolded: false,
        isAllIn: false,
        isActive: true,
        hasActed: false,
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
    io.to(roomId).emit("game-started", gameState);
    console.log(`🎮 Jogo iniciado na sala ${roomId}`);
  }

  // ====================== AÇÕES ======================
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

  // ====================== FUNÇÕES DE JOGO ======================
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
    io.to(roomId).emit("game-update", gameState);
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

    io.to(roomId).emit("game-update", gameState);
    io.to(roomId).emit("player-turn", { playerId: players[firstActive].id });
    console.log(
      `📢 Fase: ${gameState.phase} - Começa com ${players[firstActive].name}`,
    );
  }

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

      io.to(roomId).emit("round-ended", {
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
        })),
      });

      console.log(`🏆 ${winner.name} venceu ${gameState.pot} fichas!`);
    }

    setTimeout(async () => {
      gameState.players.forEach((p) => {
        const playerInRoom = room.players.find((rp) => rp.id === p.id);
        if (playerInRoom) {
          playerInRoom.chips = p.chips;
        }
      });

      room.gameState = null;
      room.players.forEach((p) => {
        p.isReady = false;
        p.cards = [];
        p.bet = 0;
        p.isFolded = false;
        p.isAllIn = false;
        p.isActive = true;
        p.hasActed = false;
      });
      io.to(roomId).emit("room-update", room);
      io.to(roomId).emit("game-reset");

      await broadcastRoomList();

      console.log(`🔄 Nova mão disponível na sala ${roomId}`);
    }, 8000);
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

    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.leave(normalizedRoomId);

    if (room.players.length === 0) {
      rooms.delete(normalizedRoomId);
      console.log(`🗑️ Sala ${normalizedRoomId} removida`);
    } else {
      io.to(normalizedRoomId).emit("room-update", room);
    }

    await broadcastRoomList();
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Desconectado: ${socket.id}`);
    rooms.forEach((room, roomId) => {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
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
