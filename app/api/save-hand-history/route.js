// app/api/save-hand-history/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { username, handData } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    if (!handData) {
      return NextResponse.json({
        success: true,
        message: "Nenhum dado para salvar",
        total: 0,
      });
    }

    await dbConnect();

    const handToSave = {
      ...handData,
      timestamp: handData.timestamp || new Date().toISOString(),
    };

    // 🔥 USAR updateOne COM $push
    const result = await User.updateOne(
      { username },
      {
        $push: {
          handHistory: {
            $each: [handToSave],
            $slice: -100,
            $position: 0,
          },
        },
      },
      {
        optimisticConcurrency: false,
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 🔥 BUSCAR O USUÁRIO ATUALIZADO PARA RETORNAR O TOTAL
    const updatedUser = await User.findOne({ username });
    const total = updatedUser?.handHistory?.length || 0;

    console.log(
      `✅ [HISTORY] Histórico salvo para ${username} (total: ${total})`,
    );

    return NextResponse.json({
      success: true,
      message: "Histórico salvo com sucesso!",
      total: total,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar histórico:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar histórico" },
      { status: 500 },
    );
  }
}
