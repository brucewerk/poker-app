// app/api/save-game-state/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const { gameState } = await req.json();

    await connectDB();

    // ✅ Usar updateOne com $set para evitar conflitos
    await User.updateOne(
      { username: session.user.username },
      { $set: { gameState: gameState } },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar estado do jogo:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
