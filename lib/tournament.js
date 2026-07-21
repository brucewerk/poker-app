// lib/tournament.js - COMPLETO
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/Tournament";
import User from "@/lib/models/User";

// 🔥 BLINDS POR NÍVEL
export const BLIND_LEVELS = [
  { level: 0, smallBlind: 25, bigBlind: 50, duration: 600 },
  { level: 1, smallBlind: 50, bigBlind: 100, duration: 600 },
  { level: 2, smallBlind: 75, bigBlind: 150, duration: 600 },
  { level: 3, smallBlind: 100, bigBlind: 200, duration: 600 },
  { level: 4, smallBlind: 150, bigBlind: 300, duration: 600 },
  { level: 5, smallBlind: 200, bigBlind: 400, duration: 600 },
  { level: 6, smallBlind: 300, bigBlind: 600, duration: 600 },
  { level: 7, smallBlind: 400, bigBlind: 800, duration: 600 },
  { level: 8, smallBlind: 600, bigBlind: 1200, duration: 600 },
  { level: 9, smallBlind: 800, bigBlind: 1600, duration: 600 },
  { level: 10, smallBlind: 1000, bigBlind: 2000, duration: 600 },
  { level: 11, smallBlind: 1500, bigBlind: 3000, duration: 600 },
  { level: 12, smallBlind: 2000, bigBlind: 4000, duration: 600 },
  { level: 13, smallBlind: 3000, bigBlind: 6000, duration: 600 },
  { level: 14, smallBlind: 4000, bigBlind: 8000, duration: 600 },
  { level: 15, smallBlind: 5000, bigBlind: 10000, duration: 600 },
];

// 🔥 CRIAR TORNEIO
export async function createTournament(data) {
  await dbConnect();

  const tournament = new Tournament({
    name: data.name,
    description: data.description || "",
    maxPlayers: data.maxPlayers || 20,
    minPlayers: data.minPlayers || 4,
    buyIn: data.buyIn || 100,
    createdBy: data.createdBy,
    blinds: {
      levels: BLIND_LEVELS.map((level) => ({
        level: level.level,
        smallBlind: level.smallBlind,
        bigBlind: level.bigBlind,
        duration: level.duration,
      })),
      currentLevel: 0,
    },
  });

  await tournament.save();
  return tournament;
}

// 🔥 INSCREVER JOGADOR
export async function joinTournament(tournamentId, username) {
  await dbConnect();

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error("Torneio não encontrado");
  }

  if (tournament.status !== "waiting") {
    throw new Error("Torneio já iniciado ou finalizado");
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  if (user.chips < tournament.buyIn) {
    throw new Error("Fichas insuficientes para o buy-in");
  }

  user.chips -= tournament.buyIn;
  await user.save();

  await tournament.addPlayer(username, tournament.buyIn * 10);
  await tournament.updatePrizePool();

  return tournament;
}

// 🔥 INICIAR TORNEIO
export async function startTournament(tournamentId) {
  await dbConnect();

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error("Torneio não encontrado");
  }

  if (tournament.players.length < tournament.minPlayers) {
    throw new Error(`Mínimo de ${tournament.minPlayers} jogadores necessário`);
  }

  tournament.status = "active";
  tournament.startedAt = new Date();

  // 🔥 Inicializar chips dos jogadores
  const startingChips = tournament.buyIn * 10;
  tournament.players.forEach((p) => {
    p.chips = startingChips;
    p.isEliminated = false;
  });

  await tournament.save();
  return tournament;
}

// 🔥 PROCESSAR ELIMINAÇÃO
export async function eliminatePlayer(tournamentId, username) {
  await dbConnect();

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error("Torneio não encontrado");
  }

  await tournament.eliminatePlayer(username);

  const activePlayers = tournament.players.filter((p) => !p.isEliminated);
  if (activePlayers.length <= 1) {
    await finishTournament(tournamentId);
  }

  return tournament;
}

// 🔥 FINALIZAR TORNEIO
export async function finishTournament(tournamentId) {
  await dbConnect();

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error("Torneio não encontrado");
  }

  tournament.status = "finished";
  tournament.finishedAt = new Date();

  const sortedPlayers = [...tournament.players]
    .filter((p) => !p.isEliminated)
    .sort((a, b) => b.chips - a.chips);

  const prizeDist = tournament.prizeDistribution || [];

  sortedPlayers.forEach((player, index) => {
    if (index < prizeDist.length && prizeDist[index]) {
      player.prize = prizeDist[index].prize || 0;
      player.position = index + 1;
    } else {
      player.position = index + 1;
      player.prize = 0;
    }
  });

  for (const player of sortedPlayers) {
    if (player.prize > 0) {
      const user = await User.findOne({ username: player.username });
      if (user) {
        user.chips += player.prize;
        await user.save();
      }
    }
  }

  await tournament.save();
  return tournament;
}

// 🔥 AVANÇAR NÍVEL DE BLINDS
export async function advanceBlinds(tournamentId) {
  await dbConnect();

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error("Torneio não encontrado");
  }

  const currentLevel = tournament.blinds.currentLevel || 0;
  const nextLevel = currentLevel + 1;

  if (nextLevel < tournament.blinds.levels.length) {
    tournament.blinds.currentLevel = nextLevel;
    await tournament.save();
  }

  return tournament;
}

// 🔥 OBTER TORNEIOS ATIVOS
export async function getActiveTournaments() {
  await dbConnect();

  const tournaments = await Tournament.find({
    status: { $in: ["waiting", "active"] },
  }).sort({ createdAt: -1 });

  return tournaments;
}

// 🔥 OBTER TORNEIO POR ID
export async function getTournamentById(tournamentId) {
  await dbConnect();

  const tournament = await Tournament.findById(tournamentId);
  return tournament;
}

// 🔥 OBTER HISTÓRICO DE TORNEIOS DO JOGADOR
export async function getPlayerTournaments(username) {
  await dbConnect();

  const tournaments = await Tournament.find({
    "players.username": username,
    status: "finished",
  }).sort({ finishedAt: -1 });

  return tournaments;
}
