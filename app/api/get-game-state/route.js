// app/api/get-game-state/route.js
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
    const username = searchParams.get("username") || session.user.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });

    if (!user || !user.savedGameState) {
      return NextResponse.json({
        success: true,
        gameState: null,
        message: "Nenhum estado salvo encontrado",
      });
    }

    return NextResponse.json({
      success: true,
      gameState: user.savedGameState,
    });
  } catch (error) {
    console.error("Erro ao recuperar estado do jogo:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
