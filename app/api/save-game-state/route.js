// app/api/save-game-state/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { username, gameState } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Se gameState for null, remover o estado salvo
    if (gameState === null) {
      await User.updateOne({ username }, { $unset: { savedGameState: "" } });
      return NextResponse.json({ success: true });
    }

    // Salvar estado do jogo
    await User.updateOne(
      { username },
      { $set: { savedGameState: gameState } },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar estado do jogo:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
