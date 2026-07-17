// app/api/save-game-state/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    // 🔥 USAR AUTHOPTIONS EXPLICITAMENTE
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { username, gameState } = body;

    console.log("💾 POST /api/save-game-state - Usuário:", username);

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

    // Se gameState for null, remover o estado salvo
    if (gameState === null) {
      user.savedGameState = null;
      await user.save();
      console.log("🗑️ Estado do jogo removido para:", username);
      return NextResponse.json({
        success: true,
        message: "Estado removido com sucesso",
      });
    }

    // Salvar estado do jogo
    user.savedGameState = gameState;
    await user.save();

    console.log("💾 Estado do jogo salvo para:", username);
    return NextResponse.json({
      success: true,
      message: "Estado salvo com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao salvar estado do jogo:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// 🔥 ADICIONAR GET PARA VERIFICAR O ESTADO SALVO (OPCIONAL)
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
        gameState: null,
        message: "Usuário não encontrado",
      });
    }

    return NextResponse.json({
      success: true,
      gameState: user.savedGameState || null,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar estado do jogo:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
