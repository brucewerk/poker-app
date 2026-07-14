// app/api/save-hand-history/route.js
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

    const { handData } = await req.json();

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Inicializar histórico se não existir
    if (!user.handHistory) {
      user.handHistory = [];
    }

    // Adicionar nova mão no início
    user.handHistory.unshift({
      ...handData,
      timestamp: new Date(),
    });

    // Manter apenas as últimas 20 mãos
    if (user.handHistory.length > 20) {
      user.handHistory = user.handHistory.slice(0, 20);
    }

    // ✅ Usar updateOne com $set para evitar conflitos
    await User.updateOne(
      { username: session.user.username },
      { $set: { handHistory: user.handHistory } },
    );

    return NextResponse.json({
      success: true,
      count: user.handHistory.length,
    });
  } catch (error) {
    console.error("Erro ao salvar histórico:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
