// app/api/get-game-state/route.js
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

    console.log("📊 GET /api/get-game-state - Usuário:", username);

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
        gameState: null,
        message: "Usuário não encontrado",
      });
    }

    const savedState = user.savedGameState;
    if (!savedState || typeof savedState !== "object") {
      return NextResponse.json({
        success: true,
        gameState: null,
        message: "Nenhum estado salvo",
      });
    }

    if (!savedState.handActive) {
      return NextResponse.json({
        success: true,
        gameState: null,
        message: "Jogo não está ativo",
      });
    }

    return NextResponse.json({
      success: true,
      gameState: savedState,
    });
  } catch (error) {
    console.error("❌ Erro ao recuperar estado do jogo:", error);
    return NextResponse.json({
      success: true,
      gameState: null,
      message: "Erro ao carregar estado",
    });
  }
}
