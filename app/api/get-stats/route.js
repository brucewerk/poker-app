// app/api/get-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getAchievementById } from "@/lib/achievements";

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

    // Formatar estatísticas para exibição
    const stats = user.stats || {};
    const achievements = (user.achievements || [])
      .map((id) => getAchievementById(id))
      .filter(Boolean);
    const totalAchievements = Object.keys(
      require("@/lib/achievements").ACHIEVEMENTS,
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        winRate:
          stats.handsPlayed > 0
            ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
            : 0,
        achievementProgress: `${achievements.length}/${totalAchievements}`,
      },
      achievements,
      totalAchievements,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
