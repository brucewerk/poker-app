// app/api/get-game-state/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

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

    return NextResponse.json({
      success: true,
      gameState: user?.gameState || null,
    });
  } catch (error) {
    console.error("Erro ao recuperar estado do jogo:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
