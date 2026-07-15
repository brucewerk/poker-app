// app/api/get-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    // 🔥 Usar o username da sessão se não for fornecido
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
        },
        achievements: [],
        message: "Usuário não encontrado",
      });
    }

    return NextResponse.json({
      success: true,
      stats: user.stats || {
        handsPlayed: 0,
        handsWon: 0,
        totalChipsWon: 0,
        biggestWin: 0,
        bestStreak: 0,
        bestHand: "",
        allInWins: 0,
      },
      achievements: user.achievements || [],
      level: user.level || 1,
      xp: user.xp || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
