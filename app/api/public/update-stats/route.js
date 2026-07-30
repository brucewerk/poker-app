// app/api/public/update-stats/route.js
// 🔥 ROTA PÚBLICA (sem sessão) — chamada pelo socket-server.js para manter
// as estatísticas do jogador globais e únicas, também para partidas de
// multiplayer online (antes, só o modo CPU atualizava estatísticas).
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { checkLevelUp, calculateLevel } from "@/lib/level";
import { checkAchievements } from "@/lib/achievements";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, result, chips, handName, wasAllIn } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (!user.stats) {
      user.stats = {
        handsPlayed: 0,
        handsWon: 0,
        totalChipsWon: 0,
        biggestWin: 0,
        bestStreak: 0,
        bestHand: "",
        allInWins: 0,
        currentStreak: 0,
        handsLost: 0,
        handsTied: 0,
        totalChips: 0,
        lastHandTimestamp: null,
        handsByPosition: { early: 0, middle: 0, late: 0 },
        winsByPosition: { early: 0, middle: 0, late: 0 },
        handsByType: {},
        streakHistory: [],
      };
    }

    if (!user.findings) user.findings = [];
    if (!user.achievements) user.achievements = [];
    if (!user.handHistory) user.handHistory = [];

    let normalizedHandName = handName;
    if (handName) {
      const handMapping = {
        Sequência: "Sequencia",
        Sequencia: "Sequencia",
        Straight: "Sequencia",
        straight: "Sequencia",
        Flush: "Flush",
        flush: "Flush",
        "Full House": "Full House",
        "full house": "Full House",
        "Straight Flush": "Straight Flush",
        "Royal Flush": "Royal Flush",
        Quadra: "Quadra",
        Trinca: "Trinca",
        "Dois Pares": "Dois Pares",
        "Um Par": "Um Par",
        "Carta Alta": "Carta Alta",
      };
      normalizedHandName = handMapping[handName] || handName;
    }

    user.stats.handsPlayed = (user.stats.handsPlayed || 0) + 1;
    user.stats.lastHandTimestamp = new Date().toISOString();

    let xpGain = 0;
    let chipsChange = 0;

    if (result === "win") {
      user.stats.handsWon = (user.stats.handsWon || 0) + 1;
      user.stats.totalChipsWon = (user.stats.totalChipsWon || 0) + (chips || 0);
      chipsChange = chips || 0;

      if (chips > (user.stats.biggestWin || 0)) {
        user.stats.biggestWin = chips;
      }

      if (normalizedHandName) {
        const handOrder = [
          "Carta Alta",
          "Um Par",
          "Dois Pares",
          "Trinca",
          "Sequencia",
          "Flush",
          "Full House",
          "Quadra",
          "Straight Flush",
          "Royal Flush",
        ];
        const currentIndex = handOrder.indexOf(user.stats.bestHand || "");
        const newIndex = handOrder.indexOf(normalizedHandName);
        if (newIndex > currentIndex) {
          user.stats.bestHand = normalizedHandName;
        }

        if (!user.stats.handsByType) user.stats.handsByType = {};
        user.stats.handsByType[normalizedHandName] =
          (user.stats.handsByType[normalizedHandName] || 0) + 1;
      }

      user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
      if ((user.stats.currentStreak || 0) > (user.stats.bestStreak || 0)) {
        user.stats.bestStreak = user.stats.currentStreak;
      }

      if (wasAllIn) {
        user.stats.allInWins = (user.stats.allInWins || 0) + 1;
      }

      xpGain = 10 + Math.floor((chips || 0) / 10);
      if (wasAllIn) xpGain += 20;
      if (chips >= 500) xpGain += 15;
      if (normalizedHandName === "Royal Flush") xpGain += 100;
      if (normalizedHandName === "Straight Flush") xpGain += 50;
    } else if (result === "loss") {
      user.stats.handsLost = (user.stats.handsLost || 0) + 1;
      user.stats.currentStreak = 0;
      chipsChange = -(chips || 0);
      xpGain = 5;
    } else if (result === "tie") {
      user.stats.handsTied = (user.stats.handsTied || 0) + 1;
      xpGain = 5;
    }

    user.stats.totalChips = (user.stats.totalChips || 0) + chipsChange;

    user.xp = (user.xp || 0) + xpGain;
    user.totalXpEarned = (user.totalXpEarned || 0) + xpGain;

    const xpPerLevel = 100;
    const newLevel = Math.floor(user.xp / xpPerLevel) + 1;
    let leveledUp = false;
    let oldLevel = user.level || 1;

    if (newLevel > oldLevel) {
      user.level = newLevel;
      leveledUp = true;
      const levelBonus = newLevel * 100;
      user.chips = (user.chips || 0) + levelBonus;
    }

    let unlockedAchievements = [];
    try {
      const newAchievements = checkAchievements(
        user.stats,
        user.achievements || [],
      );
      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach((ach) => {
          if (!user.achievements.find((a) => a === ach.id)) {
            user.achievements.push(ach.id);
            unlockedAchievements.push(ach);
            if (ach.xpBonus) {
              user.xp = (user.xp || 0) + ach.xpBonus;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Erro ao verificar conquistas:", e);
    }

    let unlockedFindings = [];
    try {
      const { checkFindings } = await import("@/lib/findings");
      const newFindings = checkFindings(user.stats, user.findings || []);
      if (newFindings && newFindings.length > 0) {
        newFindings.forEach((finding) => {
          if (!user.findings.find((f) => f.id === finding.id)) {
            user.findings.push(finding);
            user.xp = (user.xp || 0) + (finding.xp || 0);
            unlockedFindings.push(finding);
          }
        });
      }
    } catch (e) {
      // Módulo findings não existe
    }

    if (!user.stats.streakHistory) user.stats.streakHistory = [];
    if (user.stats.currentStreak > 0 && user.stats.currentStreak % 5 === 0) {
      user.stats.streakHistory.push({
        streak: user.stats.currentStreak,
        timestamp: new Date().toISOString(),
      });
    }
    if (user.stats.streakHistory.length > 20) {
      user.stats.streakHistory = user.stats.streakHistory.slice(-20);
    }

    await user.save();

    const currentLevelInfo = calculateLevel(user.xp || 0);

    return NextResponse.json({
      success: true,
      stats: user.stats,
      level: user.level || 1,
      xp: user.xp || 0,
      xpToNextLevel: currentLevelInfo.xpToNextLevel,
      levelTitle: currentLevelInfo.title,
      levelIcon: currentLevelInfo.icon,
      leveledUp,
      newLevel,
      xpGain,
      newAchievements: unlockedAchievements,
      newFindings: unlockedFindings,
      chips: user.chips || 0,
      totalChipsWon: user.stats.totalChipsWon || 0,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar estatísticas (public):", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
