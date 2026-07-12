// app/api/update-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { checkAchievements } from "@/lib/achievements";
import { checkFindings } from "@/lib/findings";
import { getXpToNextLevel, getLevelTitle } from "@/lib/level";

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
    let xpGained = 5; // XP base por jogar

    if (result === "win") {
      stats.handsWon = (stats.handsWon || 0) + 1;
      stats.totalChipsWon = (stats.totalChipsWon || 0) + chips;
      stats.currentStreak = (stats.currentStreak || 0) + 1;

      // XP por vitória
      xpGained += 10 + Math.floor(chips / 50);

      if ((stats.currentStreak || 0) > (stats.bestStreak || 0)) {
        stats.bestStreak = stats.currentStreak;
      }

      if (chips > (stats.biggestWin || 0)) {
        stats.biggestWin = chips;
        // XP extra por recorde de vitória
        xpGained += 20;
      }

      if (wasAllIn) {
        stats.allInWins = (stats.allInWins || 0) + 1;
        xpGained += 15; // XP extra por all-in vitorioso
      }

      if (
        handName &&
        (!stats.bestHand ||
          getHandScore(handName) > getHandScore(stats.bestHand))
      ) {
        stats.bestHand = handName;
        xpGained += 25; // XP extra por melhor mão
      }
    } else if (result === "loss") {
      stats.handsLost = (stats.handsLost || 0) + 1;
      stats.currentStreak = 0;
      xpGained += 3; // XP por participar
    }

    // Atualizar fichas totais
    stats.totalChips = user.chips;

    // Verificar conquistas
    const newAchievements = checkAchievements(stats, user.achievements || []);
    if (newAchievements.length > 0) {
      const achievementIds = newAchievements.map((a) => a.id);
      user.achievements = [...(user.achievements || []), ...achievementIds];
      // XP extra por conquistas
      xpGained += newAchievements.length * 30;
    }

    // Verificar findings
    const currentFindings = user.findings || [];
    const newFindings = checkFindings(stats, currentFindings);
    if (newFindings.length > 0) {
      const findingIds = newFindings.map((f) => f.id);
      user.findings = [...currentFindings, ...findingIds];
      // XP extra dos findings
      const findingsXp = newFindings.reduce((sum, f) => sum + (f.xp || 0), 0);
      xpGained += findingsXp;
    }

    // Atualizar XP e nível
    let newXp = (user.xp || 0) + xpGained;
    let newLevel = user.level || 1;
    let xpToNext = getXpToNextLevel(newLevel);
    let leveledUp = false;

    while (newXp >= xpToNext) {
      newXp -= xpToNext;
      newLevel++;
      xpToNext = getXpToNextLevel(newLevel);
      leveledUp = true;
    }

    user.xp = newXp;
    user.level = newLevel;
    user.xpToNextLevel = xpToNext;

    // Salvar
    user.markModified("stats");
    user.markModified("achievements");
    user.markModified("findings");
    await user.save();

    return NextResponse.json({
      success: true,
      stats,
      achievements: user.achievements,
      newAchievements,
      findings: user.findings,
      newFindings,
      xpGained,
      leveledUp,
      newLevel,
      levelTitle: getLevelTitle(newLevel),
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
