// app/api/update-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { checkAchievements } from "@/lib/achievements";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const { result, chips, handName, wasAllIn } = await req.json();

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Inicializar stats se não existir
    if (!user.stats) {
      user.stats = {
        handsPlayed: 0,
        handsWon: 0,
        handsLost: 0,
        totalChipsWon: 0,
        bestHand: "",
        biggestWin: 0,
        currentStreak: 0,
        bestStreak: 0,
        allInWins: 0,
        totalHands: 0,
      };
    }

    const stats = user.stats;
    stats.handsPlayed = (stats.handsPlayed || 0) + 1;

    if (result === "win") {
      stats.handsWon = (stats.handsWon || 0) + 1;
      stats.totalChipsWon = (stats.totalChipsWon || 0) + chips;
      stats.currentStreak = (stats.currentStreak || 0) + 1;

      if ((stats.currentStreak || 0) > (stats.bestStreak || 0)) {
        stats.bestStreak = stats.currentStreak;
      }

      if (chips > (stats.biggestWin || 0)) {
        stats.biggestWin = chips;
      }

      if (wasAllIn) {
        stats.allInWins = (stats.allInWins || 0) + 1;
      }

      // Atualizar melhor mão
      if (
        handName &&
        (!stats.bestHand ||
          getHandScore(handName) > getHandScore(stats.bestHand))
      ) {
        stats.bestHand = handName;
      }
    } else if (result === "loss") {
      stats.handsLost = (stats.handsLost || 0) + 1;
      stats.currentStreak = 0; // Resetar streak
    }

    // Atualizar fichas totais
    stats.totalChips = user.chips;

    // Verificar conquistas
    const newAchievements = checkAchievements(stats, user.achievements || []);

    if (newAchievements.length > 0) {
      const achievementIds = newAchievements.map((a) => a.id);
      user.achievements = [...(user.achievements || []), ...achievementIds];
    }

    // Salvar
    user.markModified("stats");
    user.markModified("achievements");
    await user.save();

    return NextResponse.json({
      success: true,
      stats,
      achievements: user.achievements,
      newAchievements,
    });
  } catch (error) {
    console.error("Erro ao atualizar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

function getHandScore(handName) {
  const ranking = {
    "Carta Alta": 1,
    "Um Par": 2,
    "Dois Pares": 3,
    Trinca: 4,
    Sequência: 5,
    Flush: 6,
    "Full House": 7,
    Quadra: 8,
    "Straight Flush": 9,
  };
  return ranking[handName] || 0;
}
