// app/api/save-hand-history/route.js
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

    const { username, handData } = await request.json();

    if (!username || !handData) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Adicionar timestamp se não tiver
    if (!handData.timestamp) {
      handData.timestamp = new Date().toISOString();
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Inicializar array se não existir
    if (!user.handHistory) {
      user.handHistory = [];
    }

    // Adicionar no início (mais recente primeiro)
    user.handHistory.unshift(handData);

    // Manter apenas as últimas 100 mãos
    if (user.handHistory.length > 100) {
      user.handHistory = user.handHistory.slice(0, 100);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Histórico salvo com sucesso",
    });
  } catch (error) {
    console.error("Erro ao salvar histórico:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
