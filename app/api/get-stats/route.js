// app/api/get-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { ACHIEVEMENTS } from "@/lib/achievements";

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

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({
        success: true,
        stats: {
          handsPlayed: 0,
          handsWon: 0,
          totalChipsWon: 0,
          biggestWin: 0,
          bestStreak: 0,
          bestHand: "",
          allInWins: 0,
          winRate: 0,
        },
        achievements: [],
        level: 1,
        xp: 0,
        newAchievements: [],
      });
    }

    const stats = user.stats || {};
    const winRate =
      stats.handsPlayed > 0
        ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
        : 0;

    // 🔥 REMOVER DUPLICATAS SEM SALVAR (EVITAR VERSION ERROR)
    const userAchievements = user.achievements || [];
    const uniqueAchievements = [...new Set(userAchievements)];

    // 🔥 VERIFICAR NOVAS CONQUISTAS
    const allAchievements = Object.values(ACHIEVEMENTS);
    const newAchievements = allAchievements.filter(
      (ach) => !userAchievements.includes(ach.id) && ach.condition(stats),
    );

    // 🔥 SALVAR NOVAS CONQUISTAS (APENAS SE HOUVER NOVAS)
    if (newAchievements.length > 0) {
      const newIds = newAchievements.map((a) => a.id);
      const merged = [...uniqueAchievements, ...newIds];

      // 🔥 USAR findOneAndUpdate PARA EVITAR VERSION ERROR
      await User.findOneAndUpdate(
        { username },
        { achievements: merged },
        { new: true, runValidators: false },
      );
    }

    // 🔥 CONQUISTAS DESBLOQUEADAS
    const unlockedAchievements = allAchievements.filter((ach) =>
      uniqueAchievements.includes(ach.id),
    );

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        winRate: winRate,
        totalChips: user.chips || 0,
      },
      achievements: unlockedAchievements,
      level: user.level || 1,
      xp: user.xp || 0,
      newAchievements: newAchievements,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
