// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ====================== ESTADO DO JOGO ======================
  const rooms = new Map(); // roomId -> { players: [], gameState: null }

  io.on("connection", (socket) => {
    console.log(`🟢 Jogador conectado: ${socket.id}`);

    // ====================== CRIAR SALA ======================
    socket.on("create-room", (data) => {
      const { playerName } = data;
      const roomId = generateRoomId();

      rooms.set(roomId, {
        players: [{ id: socket.id, name: playerName, isReady: false }],
        gameState: null,
        currentTurn: 0,
      });

      socket.join(roomId);
      socket.emit("room-created", { roomId });
      socket.emit("room-update", rooms.get(roomId));

      console.log(`🏠 Sala criada: ${roomId} por ${playerName}`);
    });

    // ====================== ENTRAR NA SALA ======================
    socket.on("join-room", (data) => {
      const { roomId, playerName } = data;
      const room = rooms.get(roomId);

      if (!room) {
        socket.emit("error", { message: "Sala não encontrada" });
        return;
      }

      if (room.players.length >= 4) {
        socket.emit("error", { message: "Sala lotada (máximo 4 jogadores)" });
        return;
      }

      room.players.push({ id: socket.id, name: playerName, isReady: false });
      socket.join(roomId);

      io.to(roomId).emit("room-update", room);
      console.log(`👤 ${playerName} entrou na sala ${roomId}`);
    });

    // ====================== PRONTO PARA JOGAR ======================
    socket.on("player-ready", (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.isReady = !player.isReady;
        io.to(roomId).emit("room-update", room);

        // Verificar se todos estão prontos
        if (room.players.every((p) => p.isReady) && room.players.length >= 2) {
          startGame(roomId);
        }
      }
    });

    // ====================== INICIAR JOGO ======================
    function startGame(roomId) {
      const room = rooms.get(roomId);
      if (!room) return;

      room.gameState = {
        phase: "preflop",
        deck: createDeck(),
        communityCards: [],
        players: room.players.map((p) => ({
          ...p,
          cards: [],
          chips: 1000,
          bet: 0,
          isFolded: false,
          isAllIn: false,
        })),
        pot: 0,
        currentBet: 0,
        currentPlayerIndex: 0,
        dealerIndex: 0,
        round: 1,
      };

      // Distribuir cartas
      const deck = room.gameState.deck;
      room.gameState.players.forEach((player) => {
        player.cards = [deck.pop(), deck.pop()];
      });

      // Definir blinds
      const sb = 25;
      const bb = 50;
      const dealerIdx = room.gameState.dealerIndex;
      const sbIdx = (dealerIdx + 1) % room.gameState.players.length;
      const bbIdx = (dealerIdx + 2) % room.gameState.players.length;

      room.gameState.players[sbIdx].chips -= sb;
      room.gameState.players[sbIdx].bet = sb;
      room.gameState.players[bbIdx].chips -= bb;
      room.gameState.players[bbIdx].bet = bb;
      room.gameState.pot = sb + bb;
      room.gameState.currentBet = bb;
      room.gameState.currentPlayerIndex =
        (bbIdx + 1) % room.gameState.players.length;

      io.to(roomId).emit("game-started", room.gameState);
      console.log(`🎮 Jogo iniciado na sala ${roomId}`);
    }

    // ====================== AÇÕES DO JOGADOR ======================
    socket.on("player-action", (data) => {
      const { roomId, action, amount } = data;
      const room = rooms.get(roomId);
      if (!room || !room.gameState) return;

      const playerIndex = room.gameState.players.findIndex(
        (p) => p.id === socket.id,
      );
      if (playerIndex === -1) return;

      const player = room.gameState.players[playerIndex];
      const gameState = room.gameState;

      // Verificar se é a vez do jogador
      if (gameState.currentPlayerIndex !== playerIndex) {
        socket.emit("error", { message: "Não é sua vez!" });
        return;
      }

      // Processar ação
      switch (action) {
        case "fold":
          player.isFolded = true;
          break;
        case "check":
          if (player.bet < gameState.currentBet) {
            socket.emit("error", {
              message: "Você precisa pagar ou aumentar!",
            });
            return;
          }
          break;
        case "call":
          const callAmount = gameState.currentBet - player.bet;
          if (callAmount > player.chips) {
            socket.emit("error", { message: "Fichas insuficientes!" });
            return;
          }
          player.chips -= callAmount;
          player.bet += callAmount;
          gameState.pot += callAmount;
          break;
        case "raise":
          if (amount <= gameState.currentBet) {
            socket.emit("error", { message: "Valor inválido!" });
            return;
          }
          const raiseAmount = amount - player.bet;
          if (raiseAmount > player.chips) {
            socket.emit("error", { message: "Fichas insuficientes!" });
            return;
          }
          player.chips -= raiseAmount;
          player.bet += raiseAmount;
          gameState.pot += raiseAmount;
          gameState.currentBet = player.bet;
          break;
        case "all-in":
          const allInAmount = player.chips;
          player.bet += allInAmount;
          player.chips = 0;
          gameState.pot += allInAmount;
          player.isAllIn = true;
          if (player.bet > gameState.currentBet) {
            gameState.currentBet = player.bet;
          }
          break;
      }

      // Avançar para o próximo jogador
      nextTurn(roomId);
    });

    // ====================== PRÓXIMO TURNO ======================
    function nextTurn(roomId) {
      const room = rooms.get(roomId);
      if (!room || !room.gameState) return;

      const gameState = room.gameState;
      const players = gameState.players;

      // Encontrar próximo jogador ativo
      let nextIndex = (gameState.currentPlayerIndex + 1) % players.length;
      let attempts = 0;

      while (attempts < players.length) {
        const player = players[nextIndex];
        if (!player.isFolded && !player.isAllIn && player.chips > 0) {
          break;
        }
        nextIndex = (nextIndex + 1) % players.length;
        attempts++;
      }

      if (attempts >= players.length) {
        // Todos os jogadores ativos foram para all-in ou fold
        endRound(roomId);
        return;
      }

      gameState.currentPlayerIndex = nextIndex;
      io.to(roomId).emit("game-update", gameState);
      io.to(roomId).emit("player-turn", { playerId: players[nextIndex].id });
    }

    // ====================== FINALIZAR RODADA ======================
    function endRound(roomId) {
      const room = rooms.get(roomId);
      if (!room || !room.gameState) return;

      const gameState = room.gameState;
      const activePlayers = gameState.players.filter((p) => !p.isFolded);

      if (activePlayers.length === 1) {
        // Único jogador ativo ganha o pote
        activePlayers[0].chips += gameState.pot;
        io.to(roomId).emit("round-ended", {
          winner: activePlayers[0],
          pot: gameState.pot,
        });
        resetGame(roomId);
        return;
      }

      // Showdown - avaliar mãos
      // (Implementar avaliação de mãos aqui)

      resetGame(roomId);
    }

    // ====================== RESETAR JOGO ======================
    function resetGame(roomId) {
      const room = rooms.get(roomId);
      if (!room) return;

      room.gameState = null;
      room.players.forEach((p) => {
        p.isReady = false;
      });

      setTimeout(() => {
        io.to(roomId).emit("room-update", room);
        io.to(roomId).emit("game-reset");
      }, 3000);
    }

    // ====================== SAIR DA SALA ======================
    socket.on("leave-room", (data) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.players = room.players.filter((p) => p.id !== socket.id);
      socket.leave(roomId);

      if (room.players.length === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ Sala ${roomId} removida (vazia)`);
      } else {
        io.to(roomId).emit("room-update", room);
        console.log(`👋 Jogador saiu da sala ${roomId}`);
      }
    });

    // ====================== DESCONEXÃO ======================
    socket.on("disconnect", () => {
      console.log(`🔴 Jogador desconectado: ${socket.id}`);

      // Remover jogador de todas as salas
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("room-update", room);
          }
        }
      });
    });
  });

  // ====================== FUNÇÕES AUXILIARES ======================
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

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`🚀 Servidor Socket.IO rodando na porta ${PORT}`);
  });
});
