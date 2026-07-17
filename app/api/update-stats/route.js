// app/api/update-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { checkLevelUp, calculateLevel } from "@/lib/level";
import { checkAchievements } from "@/lib/achievements";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

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

    // 🔥 INICIALIZAR STATS
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
      };
    }

    // 🔥 GARANTIR QUE FINDINGS E ACHIEVEMENTS EXISTEM
    if (!user.findings) {
      user.findings = [];
    }
    if (!user.achievements) {
      user.achievements = [];
    }

    // 🔥 NORMALIZAR O NOME DA MÃO (MAPEAMENTO COMPLETO)
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

    // 🔥 ATUALIZAR STATS
    user.stats.handsPlayed = (user.stats.handsPlayed || 0) + 1;

    // 🔥 CALCULAR GANHO DE XP
    let xpGain = 0;

    if (result === "win") {
      user.stats.handsWon = (user.stats.handsWon || 0) + 1;
      user.stats.totalChipsWon = (user.stats.totalChipsWon || 0) + (chips || 0);

      if (chips > (user.stats.biggestWin || 0)) {
        user.stats.biggestWin = chips;
      }

      // 🔥 MELHOR MÃO (USANDO O NOME NORMALIZADO)
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
          console.log(`🏆 ${username} melhor mão: ${normalizedHandName}`);
        }
      }

      // 🔥 STREAK
      user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
      if ((user.stats.currentStreak || 0) > (user.stats.bestStreak || 0)) {
        user.stats.bestStreak = user.stats.currentStreak;
      }

      // 🔥 ALL-IN WINS
      if (wasAllIn) {
        user.stats.allInWins = (user.stats.allInWins || 0) + 1;
      }

      // 🔥 XP POR VITÓRIA
      xpGain = 10 + Math.floor(chips / 10);
      if (wasAllIn) xpGain += 20;
      if (chips >= 500) xpGain += 15;
    } else if (result === "loss") {
      user.stats.currentStreak = 0;
      xpGain = 5;
    } else if (result === "tie") {
      xpGain = 5;
    }

    // 🔥 ADICIONAR XP
    user.xp = (user.xp || 0) + xpGain;

    // 🔥 VERIFICAR SUBIDA DE NÍVEL
    const levelUpInfo = checkLevelUp(user.level || 1, user.xp || 0);
    let leveledUp = false;
    let newLevel = user.level || 1;

    if (levelUpInfo.leveledUp) {
      user.level = levelUpInfo.newLevel;
      newLevel = levelUpInfo.newLevel;
      leveledUp = true;
      console.log(`🎉 ${username} subiu para Nível ${newLevel}!`);
    }

    // 🔥 VERIFICAR CONQUISTAS
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
            console.log(`🏅 ${username} desbloqueou: ${ach.name}`);
          }
        });
      }
    } catch (e) {
      console.warn("Erro ao verificar conquistas:", e);
    }

    // 🔥 VERIFICAR ACHADOS (FINDINGS)
    let unlockedFindings = [];
    try {
      const { checkFindings } = await import("@/lib/findings");
      const newFindings = await checkFindings(username, user.stats);
      if (newFindings && newFindings.length > 0) {
        newFindings.forEach((finding) => {
          if (!user.findings.find((f) => f.id === finding.id)) {
            user.findings.push(finding);
            user.xp = (user.xp || 0) + (finding.xp || 0);
            unlockedFindings.push(finding);
            console.log(`🔍 ${username} descobriu: ${finding.name}`);
          }
        });
      }
    } catch (e) {
      // Módulo findings não existe
    }

    await user.save();

    // 🔥 CALCULAR INFORMAÇÕES DO NÍVEL ATUAL
    const currentLevelInfo = calculateLevel(user.xp || 0);

    console.log(`📊 ${username}: ${user.xp} XP (Nível ${user.level})`);

    // 🔥 DISPARAR EVENTO DE ATUALIZAÇÃO DE NÍVEL
    const response = {
      success: true,
      stats: user.stats,
      level: user.level || 1,
      xp: user.xp || 0,
      xpToNextLevel: currentLevelInfo.xpToNextLevel,
      levelTitle: currentLevelInfo.title,
      levelIcon: currentLevelInfo.icon,
      leveledUp: leveledUp,
      newLevel: newLevel,
      xpGain: xpGain,
      newAchievements: unlockedAchievements,
      newFindings: unlockedFindings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erro ao atualizar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
