// app/api/tournaments/game/route.js - API DO JOGO
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/Tournament";
import { BLIND_LEVELS } from "@/lib/tournament";

// 🔥 INICIAR JOGO DO TORNEIO
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { tournamentId } = await request.json();

    await dbConnect();
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneio não encontrado" },
        { status: 404 },
      );
    }

    if (tournament.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Torneio não está ativo" },
        { status: 400 },
      );
    }

    // 🔥 Criar estado do jogo
    const startingChips = tournament.buyIn * 10;
    const playersWithCards = tournament.players.map((p) => ({
      ...(p.toObject ? p.toObject() : p),
      cards: [],
      bet: 0,
      isFolded: false,
      hasActed: false,
    }));

    const gameState = {
      tournamentId: tournament._id,
      players: playersWithCards,
      communityCards: [],
      pot: 0,
      currentBet: 0,
      currentTurn: 0,
      blinds: {
        level: 0,
        smallBlind: 25,
        bigBlind: 50,
        timer: Date.now(),
      },
      phase: "preflop",
      status: "active",
      startedAt: new Date(),
      lastAction: "Jogo iniciado!",
      playerOrder: playersWithCards.map((p) => p.username),
    };

    // 🔥 Distribuir cartas
    const deck = createDeck();
    gameState.players.forEach((p) => {
      p.cards = [deck.pop(), deck.pop()];
      p.chips = startingChips;
      p.isEliminated = false;
    });

    // 🔥 Colocar blinds
    const sbIdx = 1 % gameState.players.length;
    const bbIdx = 2 % gameState.players.length;

    const sbPlayer = gameState.players[sbIdx];
    const bbPlayer = gameState.players[bbIdx];

    sbPlayer.chips -= 25;
    sbPlayer.bet = 25;
    bbPlayer.chips -= 50;
    bbPlayer.bet = 50;
    gameState.pot = 75;
    gameState.currentBet = 50;
    gameState.currentTurn = (bbIdx + 1) % gameState.players.length;

    tournament.gameState = gameState;
    await tournament.save();

    return NextResponse.json({
      success: true,
      tournament,
      gameState,
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar jogo do torneio:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// 🔥 OBTER ESTADO DO JOGO
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");

    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: "ID do torneio não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneio não encontrado" },
        { status: 404 },
      );
    }

    // 🔥 Verificar se o torneio terminou
    if (tournament.status === "finished") {
      return NextResponse.json({
        success: true,
        gameState: {
          status: "finished",
          winner: tournament.players.find((p) => !p.isEliminated)?.username,
          prizePool: tournament.prizePool,
          ranking: tournament.players.sort((a, b) => b.chips - a.chips),
        },
      });
    }

    return NextResponse.json({
      success: true,
      gameState: tournament.gameState || null,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar estado do torneio:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
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
