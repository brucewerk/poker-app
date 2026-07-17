// app/api/missions/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { calculateLevel } from "@/lib/level";

// 🔥 MISSÕES PADRÃO - DIÁRIAS (SEM FLUSH)
const DEFAULT_MISSIONS = [
  {
    id: "mission_1",
    name: "Jogar 5 mãos",
    description: "Complete 5 mãos de poker",
    icon: "🎯",
    completed: false,
    claimed: false,
    progress: 0,
    required: 5,
    current: 0,
    xpReward: 50,
    chipsReward: 100,
    type: "daily",
  },
  {
    id: "mission_2",
    name: "Ganhar 3 mãos",
    description: "Vença 3 mãos contra a CPU",
    icon: "🏆",
    completed: false,
    claimed: false,
    progress: 0,
    required: 3,
    current: 0,
    xpReward: 100,
    chipsReward: 200,
    type: "daily",
  },
  {
    id: "mission_3",
    name: "Ganhar 500 fichas",
    description: "Acumule 500 fichas em vitórias",
    icon: "💰",
    completed: false,
    claimed: false,
    progress: 0,
    required: 500,
    current: 0,
    xpReward: 150,
    chipsReward: 300,
    type: "daily",
  },
  // 🔥 MISSÃO 4 (FLUSH) REMOVIDA - SUBSTITUÍDA POR "Ganhar 20 mãos"
  {
    id: "mission_4",
    name: "Jogar 20 mãos",
    description: "Complete 20 mãos de poker",
    icon: "🎯",
    completed: false,
    claimed: false,
    progress: 0,
    required: 20,
    current: 0,
    xpReward: 120,
    chipsReward: 250,
    type: "daily",
  },
  {
    id: "mission_5",
    name: "All-in Vitorioso",
    description: "Ganhe uma mão com All-in",
    icon: "⚡",
    completed: false,
    claimed: false,
    progress: 0,
    required: 1,
    current: 0,
    xpReward: 150,
    chipsReward: 300,
    type: "daily",
  },
  {
    id: "mission_6",
    name: "10 Mãos Jogadas",
    description: "Complete 10 mãos de poker",
    icon: "🎯",
    completed: false,
    claimed: false,
    progress: 0,
    required: 10,
    current: 0,
    xpReward: 80,
    chipsReward: 200,
    type: "daily",
  },
  {
    id: "mission_7",
    name: "Streak de 3",
    description: "Ganhe 3 mãos seguidas",
    icon: "🔥",
    completed: false,
    claimed: false,
    progress: 0,
    required: 3,
    current: 0,
    xpReward: 120,
    chipsReward: 250,
    type: "daily",
  },
];

// ====================== GET - Buscar missões ======================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || session.user.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    let user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({
        success: true,
        missions: DEFAULT_MISSIONS,
        completedCount: 0,
        totalCount: DEFAULT_MISSIONS.length,
      });
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

    const stats = user.stats;
    const today = new Date().toDateString();

    // 🔥 SE NÃO TIVER MISSÕES, CRIAR
    if (!user.missions || user.missions.length === 0) {
      user.missions = DEFAULT_MISSIONS.map((m) => ({
        ...m,
        current: 0,
        progress: 0,
        completed: false,
        claimed: false,
        lastReset: today,
        claimedAt: null,
      }));
      await user.save();
      return NextResponse.json({
        success: true,
        missions: user.missions,
        completedCount: 0,
        claimedCount: 0,
        totalCount: user.missions.length,
      });
    }

    // 🔥 VERIFICAR SE DEVE RESETAR (MUDOU O DIA)
    const shouldReset = user.missions[0]?.lastReset !== today;
    let missions = user.missions;

    if (shouldReset) {
      missions = missions.map((m) => {
        return {
          ...m,
          completed: false,
          claimed: false,
          progress: 0,
          current: 0,
          lastReset: today,
          claimedAt: null,
        };
      });
      user.missions = missions;
      await user.save();
    }

    // 🔥 ATUALIZAR PROGRESSO E REIVINDICAR AUTOMATICAMENTE
    let hasChanges = false;
    const updatedMissions = missions.map((mission) => {
      let current = mission.current || 0;
      let completed = mission.completed || false;
      let progress = mission.progress || 0;
      let claimed = mission.claimed || false;

      // 🔥 ATUALIZAR PROGRESSO
      if (mission.id === "mission_1") {
        current = stats.handsPlayed || 0;
      } else if (mission.id === "mission_2") {
        current = stats.handsWon || 0;
      } else if (mission.id === "mission_3") {
        current = stats.totalChipsWon || 0;
      } else if (mission.id === "mission_4") {
        // 🔥 NOVA MISSÃO: Jogar 20 mãos
        current = stats.handsPlayed || 0;
      } else if (mission.id === "mission_5") {
        current = stats.allInWins || 0;
      } else if (mission.id === "mission_6") {
        current = stats.handsPlayed || 0;
      } else if (mission.id === "mission_7") {
        current = stats.bestStreak || 0;
      }

      progress = Math.min(current / mission.required, 1);
      completed = current >= mission.required;

      // 🔥 REIVINDICAR AUTOMATICAMENTE SE COMPLETADA E NÃO REIVINDICADA
      if (completed && !claimed) {
        claimed = true;
        hasChanges = true;
        mission.claimedAt = new Date().toISOString();

        if (mission.chipsReward) {
          user.chips = (user.chips || 0) + mission.chipsReward;
        }
        if (mission.xpReward) {
          user.xp = (user.xp || 0) + mission.xpReward;
        }

        console.log(
          `🎉 Missão "${mission.name}" completada e reivindicada automaticamente!`,
        );
      }

      return {
        ...mission,
        current: Math.min(current, mission.required),
        progress: progress,
        completed: completed,
        claimed: claimed,
      };
    });

    if (hasChanges) {
      user.missions = updatedMissions;

      const levelInfo = calculateLevel(user.xp || 0);
      if (levelInfo.level > (user.level || 1)) {
        user.level = levelInfo.level;
      }

      await user.save();
    }

    const completedCount = updatedMissions.filter((m) => m.completed).length;
    const claimedCount = updatedMissions.filter((m) => m.claimed).length;

    return NextResponse.json({
      success: true,
      missions: updatedMissions,
      completedCount: completedCount,
      claimedCount: claimedCount,
      totalCount: updatedMissions.length,
      level: user.level,
      xp: user.xp,
      chips: user.chips,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar missões:", error);
    return NextResponse.json({
      success: true,
      missions: DEFAULT_MISSIONS,
      completedCount: 0,
      totalCount: DEFAULT_MISSIONS.length,
    });
  }
}
