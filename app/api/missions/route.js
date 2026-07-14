// app/api/missions/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getDailyMissions, checkMissionProgress } from "@/lib/missions";

// GET - Buscar missões do usuário
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Inicializar missões se não existir
    if (!user.missions) {
      user.missions = {
        daily: {},
        lastReset: new Date(),
      };
    }

    // Verificar se precisa resetar (24h)
    const now = new Date();
    const lastReset = new Date(user.missions.lastReset);
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      user.missions.daily = {};
      user.missions.lastReset = now;
      await user.save();
    }

    const allMissions = getDailyMissions();
    const missionStatus = allMissions.map((mission) => {
      const progress = checkMissionProgress(mission, user.stats || {});
      return {
        ...mission,
        completed: user.missions.daily[mission.id] || false,
        progress: progress.progress,
        current: progress.current,
        required: progress.required,
      };
    });

    return NextResponse.json({
      success: true,
      missions: missionStatus,
      lastReset: user.missions.lastReset,
    });
  } catch (error) {
    console.error("Erro ao buscar missões:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST - Completar/Recompensar missão
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const { missionId } = await req.json();

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se a missão já foi completada
    if (user.missions.daily[missionId]) {
      return NextResponse.json(
        { success: false, error: "Missão já completada" },
        { status: 400 },
      );
    }

    // Buscar missão
    const allMissions = getDailyMissions();
    const mission = allMissions.find((m) => m.id === missionId);
    if (!mission) {
      return NextResponse.json(
        { success: false, error: "Missão não encontrada" },
        { status: 404 },
      );
    }

    // Verificar se completou
    const progress = checkMissionProgress(mission, user.stats || {});
    if (!progress.completed) {
      return NextResponse.json(
        { success: false, error: "Missão não completada" },
        { status: 400 },
      );
    }

    // Marcar como completada
    user.missions.daily[missionId] = true;
    user.missions.lastReset = new Date();

    // Aplicar recompensas
    if (mission.xpReward > 0) {
      user.xp = (user.xp || 0) + mission.xpReward;
    }
    if (mission.chipsReward > 0) {
      user.chips = (user.chips || 0) + mission.chipsReward;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: `Missão "${mission.name}" completada!`,
      xpReward: mission.xpReward,
      chipsReward: mission.chipsReward,
    });
  } catch (error) {
    console.error("Erro ao completar missão:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
