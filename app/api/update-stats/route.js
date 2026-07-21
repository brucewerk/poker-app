// app/api/update-stats/route.js - COMPLETO COM MÉTRICAS AVANÇADAS
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
        handsLost: 0,
        handsTied: 0,
        // 🔥 NOVAS MÉTRICAS PARA ESTATÍSTICAS AVANÇADAS
        totalChips: 0,
        lastHandTimestamp: null,
        handsByPosition: {
          early: 0,
          middle: 0,
          late: 0,
        },
        winsByPosition: {
          early: 0,
          middle: 0,
          late: 0,
        },
        handsByType: {},
        streakHistory: [],
      };
    }

    if (!user.findings) user.findings = [];
    if (!user.achievements) user.achievements = [];
    if (!user.handHistory) user.handHistory = [];

    // 🔥 NORMALIZAR O NOME DA MÃO
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

      // 🔥 MELHOR MÃO
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

        // 🔥 REGISTRAR DISTRIBUIÇÃO DE MÃOS
        if (!user.stats.handsByType) {
          user.stats.handsByType = {};
        }
        user.stats.handsByType[normalizedHandName] =
          (user.stats.handsByType[normalizedHandName] || 0) + 1;
      }

      // 🔥 STREAK
      user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
      if ((user.stats.currentStreak || 0) > (user.stats.bestStreak || 0)) {
        user.stats.bestStreak = user.stats.currentStreak;
      }

      if (wasAllIn) {
        user.stats.allInWins = (user.stats.allInWins || 0) + 1;
      }

      // 🔥 XP POR VITÓRIA
      xpGain = 10 + Math.floor(chips / 10);
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

    // 🔥 ATUALIZAR TOTAL DE FICHAS
    user.stats.totalChips = (user.stats.totalChips || 0) + chipsChange;

    // 🔥 ADICIONAR XP
    user.xp = (user.xp || 0) + xpGain;
    user.totalXpEarned = (user.totalXpEarned || 0) + xpGain;

    // 🔥 VERIFICAR SUBIDA DE NÍVEL
    const xpPerLevel = 100;
    const newLevel = Math.floor(user.xp / xpPerLevel) + 1;
    let leveledUp = false;
    let oldLevel = user.level || 1;

    if (newLevel > oldLevel) {
      user.level = newLevel;
      leveledUp = true;

      // 🔥 BÔNUS DE FICHAS POR SUBIR DE NÍVEL
      const levelBonus = newLevel * 100;
      user.chips = (user.chips || 0) + levelBonus;
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
            // 🔥 BÔNUS XP POR CONQUISTA
            if (ach.xpBonus) {
              user.xp = (user.xp || 0) + ach.xpBonus;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Erro ao verificar conquistas:", e);
    }

    // 🔥 VERIFICAR ACHADOS
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

    // 🔥 SALVAR HISTÓRICO DA MÃO (para gráficos e estatísticas)
    if (result === "win" || result === "loss" || result === "tie") {
      const handEntry = {
        result: result,
        playerHand: normalizedHandName || "Carta Alta",
        cpuHand: "CPU", // Será substituído pelo histórico real
        pot: chips || 0,
        chipsWon: result === "win" ? chips : 0,
        chipsLost: result === "loss" ? chips : 0,
        wasAllIn: wasAllIn || false,
        timestamp: new Date().toISOString(),
        // 🔥 NOVOS CAMPOS PARA ESTATÍSTICAS AVANÇADAS
        handType: normalizedHandName || "Carta Alta",
        chipsChange: chipsChange,
      };

      // Adicionar ao histórico (limitado a 100 entradas)
      user.handHistory.unshift(handEntry);
      if (user.handHistory.length > 100) {
        user.handHistory = user.handHistory.slice(0, 100);
      }
    }

    // 🔥 SALVAR STREAK HISTORY (para gráfico de streaks)
    if (!user.stats.streakHistory) {
      user.stats.streakHistory = [];
    }
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

    // 🔥 CALCULAR INFORMAÇÕES DO NÍVEL ATUAL
    const currentLevelInfo = calculateLevel(user.xp || 0);

    // 🔥 RESPONSE COM TODOS OS DADOS
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
      // 🔥 DADOS ADICIONAIS
      chips: user.chips || 0,
      totalChipsWon: user.stats.totalChipsWon || 0,
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
