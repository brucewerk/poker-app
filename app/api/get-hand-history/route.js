// app/api/get-hand-history/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

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
        history: [],
        total: 0,
      });
    }

    // 🔥 GARANTIR QUE handHistory É UM ARRAY
    const history = user.handHistory || [];

    // 🔥 ORDENAR POR TIMESTAMP (MAIS RECENTES PRIMEIRO)
    const sortedHistory = history.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB - dateA;
    });

    // 🔥 LIMITAR AOS 10 MAIS RECENTES
    const recentHistory = sortedHistory.slice(0, 10);

    console.log(
      `📜 [HISTORY] ${username}: ${recentHistory.length} partidas retornadas (total: ${history.length})`,
    );

    return NextResponse.json({
      success: true,
      history: recentHistory,
      total: history.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar histórico:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
