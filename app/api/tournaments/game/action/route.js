// app/api/tournaments/game/action/route.js - AÇÕES DO JOGADOR
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/Tournament";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { tournamentId, username, action, amount } = await request.json();

    await dbConnect();
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneio não encontrado" },
        { status: 404 },
      );
    }

    if (!tournament.gameState) {
      return NextResponse.json(
        { success: false, error: "Jogo não iniciado" },
        { status: 400 },
      );
    }

    const gameState = tournament.gameState;
    const playerIndex = gameState.players.findIndex(
      (p) => p.username === username,
    );

    if (playerIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Jogador não encontrado" },
        { status: 404 },
      );
    }

    const player = gameState.players[playerIndex];

    if (gameState.currentTurn !== playerIndex) {
      return NextResponse.json(
        { success: false, error: "Não é sua vez!" },
        { status: 400 },
      );
    }

    if (player.isEliminated) {
      return NextResponse.json(
        { success: false, error: "Você foi eliminado!" },
        { status: 400 },
      );
    }

    // 🔥 Processar ação
    let actionMessage = "";

    switch (action) {
      case "fold":
        player.isFolded = true;
        actionMessage = `${username} desistiu`;
        break;

      case "check":
        if (player.bet < gameState.currentBet) {
          return NextResponse.json(
            { success: false, error: "Você precisa pagar ou aumentar!" },
            { status: 400 },
          );
        }
        actionMessage = `${username} deu check`;
        break;

      case "call":
        const callAmount = gameState.currentBet - player.bet;
        if (callAmount > player.chips) {
          return NextResponse.json(
            { success: false, error: "Fichas insuficientes!" },
            { status: 400 },
          );
        }
        player.chips -= callAmount;
        player.bet += callAmount;
        gameState.pot += callAmount;
        actionMessage = `${username} pagou ${callAmount}`;
        break;

      case "raise":
        if (amount <= gameState.currentBet) {
          return NextResponse.json(
            { success: false, error: "Valor inválido!" },
            { status: 400 },
          );
        }
        const raiseAmount = amount - player.bet;
        if (raiseAmount > player.chips) {
          return NextResponse.json(
            { success: false, error: "Fichas insuficientes!" },
            { status: 400 },
          );
        }
        player.chips -= raiseAmount;
        player.bet += raiseAmount;
        gameState.pot += raiseAmount;
        gameState.currentBet = player.bet;
        actionMessage = `${username} aumentou para ${amount}`;
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
        actionMessage = `${username} foi ALL-IN!`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Ação inválida" },
          { status: 400 },
        );
    }

    // 🔥 Avançar para o próximo turno
    player.hasActed = true;
    gameState.lastAction = actionMessage;
    await advanceTurn(tournament);

    await tournament.save();

    return NextResponse.json({
      success: true,
      gameState: tournament.gameState,
      message: actionMessage,
    });
  } catch (error) {
    console.error("❌ Erro ao processar ação:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// 🔥 AVANÇAR TURNO
async function advanceTurn(tournament) {
  const gameState = tournament.gameState;
  const players = gameState.players;
  const activePlayers = players.filter((p) => !p.isFolded && !p.isEliminated);

  if (activePlayers.length <= 1) {
    // 🔥 Finalizar torneio
    await finishTournament(tournament);
    return;
  }

  let nextIndex = (gameState.currentTurn + 1) % players.length;
  let attempts = 0;

  while (attempts < players.length) {
    const p = players[nextIndex];
    if (!p.isFolded && !p.isEliminated && p.chips > 0) {
      if (p.hasActed && gameState.currentBet === p.bet) {
        attempts++;
        nextIndex = (nextIndex + 1) % players.length;
        continue;
      }
      break;
    }
    nextIndex = (nextIndex + 1) % players.length;
    attempts++;
  }

  // 🔥 Verificar se todos agiram
  const allActed = activePlayers.every((p) => p.hasActed);
  const allBetsMatched = activePlayers.every(
    (p) => p.bet === gameState.currentBet,
  );

  if (allActed && allBetsMatched) {
    // 🔥 Avançar fase
    await advancePhase(tournament);
    return;
  }

  gameState.currentTurn = nextIndex;
}

// 🔥 AVANÇAR FASE
async function advancePhase(tournament) {
  const gameState = tournament.gameState;
  const players = gameState.players;

  // Resetar ações
  players.forEach((p) => {
    if (!p.isFolded && !p.isEliminated) {
      p.hasActed = false;
      p.bet = 0;
    }
  });
  gameState.currentBet = 0;

  switch (gameState.phase) {
    case "preflop":
      gameState.phase = "flop";
      // 🔥 Adicionar 3 cartas comunitárias
      for (let i = 0; i < 3; i++) {
        gameState.communityCards.push(
          gameState.deck?.pop() || { rank: 2, suit: "♠" },
        );
      }
      gameState.lastAction = "FLOP - Três cartas comunitárias!";
      break;

    case "flop":
      gameState.phase = "turn";
      gameState.communityCards.push(
        gameState.deck?.pop() || { rank: 2, suit: "♠" },
      );
      gameState.lastAction = "TURN - Quarta carta!";
      break;

    case "turn":
      gameState.phase = "river";
      gameState.communityCards.push(
        gameState.deck?.pop() || { rank: 2, suit: "♠" },
      );
      gameState.lastAction = "RIVER - Última carta!";
      break;

    case "river":
      // 🔥 Showdown
      await showdown(tournament);
      return;
  }

  // 🔥 Encontrar próximo jogador ativo
  const startIndex = (gameState.currentTurn + 1) % players.length;
  for (let i = 0; i < players.length; i++) {
    const idx = (startIndex + i) % players.length;
    if (
      !players[idx].isFolded &&
      !players[idx].isEliminated &&
      players[idx].chips > 0
    ) {
      gameState.currentTurn = idx;
      break;
    }
  }

  await tournament.save();
}

// 🔥 SHOWDOWN
async function showdown(tournament) {
  const gameState = tournament.gameState;
  const players = gameState.players.filter(
    (p) => !p.isFolded && !p.isEliminated,
  );

  if (players.length === 1) {
    // 🔥 Único jogador ganha
    players[0].chips += gameState.pot;
    await finishTournament(tournament);
    return;
  }

  // 🔥 Avaliar mãos (simplificado - quem tem mais fichas ganha)
  // Em uma implementação real, aqui seria a avaliação de mãos de poker
  const winner = players.reduce((a, b) => (a.chips > b.chips ? a : b));
  winner.chips += gameState.pot;

  gameState.lastAction = `🏆 ${winner.username} venceu ${gameState.pot} fichas!`;

  // 🔥 Verificar eliminações
  for (const p of gameState.players) {
    if (p.chips <= 0 && !p.isEliminated) {
      p.isEliminated = true;
      p.isActive = false;
      gameState.lastAction += ` 💀 ${p.username} eliminado!`;
    }
  }

  // 🔥 Verificar se acabou
  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  if (activePlayers.length <= 1) {
    await finishTournament(tournament);
  } else {
    // 🔥 Nova mão
    await resetHand(tournament);
  }
}

// 🔥 RESETAR MÃO
async function resetHand(tournament) {
  const gameState = tournament.gameState;

  // Resetar estado da mão
  gameState.players.forEach((p) => {
    if (!p.isEliminated) {
      p.cards = [];
      p.bet = 0;
      p.isFolded = false;
      p.hasActed = false;
      p.isAllIn = false;
    }
  });

  gameState.communityCards = [];
  gameState.pot = 0;
  gameState.currentBet = 0;
  gameState.phase = "preflop";

  // 🔥 Subir blinds
  const level = gameState.blinds.level + 1;
  if (level < BLIND_LEVELS.length) {
    gameState.blinds.level = level;
    gameState.blinds.smallBlind = BLIND_LEVELS[level].smallBlind;
    gameState.blinds.bigBlind = BLIND_LEVELS[level].bigBlind;
  }

  // 🔥 Distribuir novas cartas
  const deck = createDeck();
  gameState.deck = deck;
  gameState.players.forEach((p) => {
    if (!p.isEliminated) {
      p.cards = [deck.pop(), deck.pop()];
    }
  });

  // 🔥 Colocar blinds
  const activePlayers = gameState.players.filter((p) => !p.isEliminated);
  const sbIdx = 1 % activePlayers.length;
  const bbIdx = 2 % activePlayers.length;

  const sbPlayer = activePlayers[sbIdx];
  const bbPlayer = activePlayers[bbIdx];

  sbPlayer.chips -= gameState.blinds.smallBlind;
  sbPlayer.bet = gameState.blinds.smallBlind;
  bbPlayer.chips -= gameState.blinds.bigBlind;
  bbPlayer.bet = gameState.blinds.bigBlind;
  gameState.pot = gameState.blinds.smallBlind + gameState.blinds.bigBlind;
  gameState.currentBet = gameState.blinds.bigBlind;
  gameState.currentTurn = (bbIdx + 1) % activePlayers.length;

  gameState.lastAction = `🔄 Nova mão! Blinds: ${gameState.blinds.smallBlind}/${gameState.blinds.bigBlind}`;

  await tournament.save();
}

// 🔥 FINALIZAR TORNEIO
async function finishTournament(tournament) {
  const gameState = tournament.gameState;

  // 🔥 Distribuir prêmios
  const winners = tournament.players.filter((p) => !p.isEliminated);
  const sortedPlayers = [...winners].sort((a, b) => b.chips - a.chips);

  const prizeDist = tournament.prizeDistribution || [];

  sortedPlayers.forEach((player, index) => {
    if (index < prizeDist.length) {
      player.prize = prizeDist[index]?.prize || 0;
      player.position = index + 1;
    }
  });

  // 🔥 Creditar prêmios para o vencedor
  if (sortedPlayers.length > 0) {
    const winner = sortedPlayers[0];
    winner.chips += gameState.pot || 0;
  }

  tournament.status = "finished";
  tournament.finishedAt = new Date();

  gameState.status = "finished";
  gameState.winner = sortedPlayers[0]?.username || "N/A";
  gameState.ranking = sortedPlayers;
  gameState.lastAction = `🏆 Torneio finalizado! Vencedor: ${gameState.winner}`;

  await tournament.save();
}

// 🔥 FUNÇÃO AUXILIAR - CRIAR BARALHO
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
