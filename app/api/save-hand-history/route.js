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

    // 🔥 GERAR ID ÚNICO (se não veio)
    const handId =
      handData.id ||
      `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const handToSave = {
      id: handId,
      ...handData,
      timestamp: handData.timestamp || new Date().toISOString(),
    };

    // 🔥 BUSCAR USUÁRIO
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 🔥 INICIALIZAR handHistory SE NÃO EXISTIR
    if (!user.handHistory) {
      user.handHistory = [];
    }

    // 🔥 VERIFICAR SE JÁ EXISTE UMA ENTRADA COM O MESMO ID
    const existingIndex = user.handHistory.findIndex((h) => h.id === handId);

    if (existingIndex !== -1) {
      // 🔥 ATUALIZAR A ENTRADA EXISTENTE (SUBSTITUIR)
      user.handHistory[existingIndex] = handToSave;
      console.log(`🔄 [HISTORY] Entrada ${handId} atualizada para ${username}`);
    } else {
      // 🔥 VERIFICAR POR DUPLICATA BASEADA EM TIMESTAMP + RESULTADO + POTE
      const existsByData = user.handHistory.some(
        (h) =>
          h.timestamp === handToSave.timestamp &&
          h.result === handToSave.result &&
          h.pot === handToSave.pot,
      );

      if (existsByData) {
        console.log(`⚠️ [HISTORY] Duplicata por dados detectada, ignorando...`);
        return NextResponse.json({
          success: true,
          message: "Duplicata ignorada (dados)",
          total: user.handHistory.length,
        });
      }

      // 🔥 ADICIONAR NOVA ENTRADA NO INÍCIO
      user.handHistory.unshift(handToSave);
      console.log(
        `✅ [HISTORY] Nova entrada ${handId} adicionada para ${username}`,
      );
    }

    // 🔥 LIMITAR A 100 ENTRADAS
    if (user.handHistory.length > 100) {
      user.handHistory = user.handHistory.slice(0, 100);
    }

    // 🔥 SALVAR
    await user.save();

    const total = user.handHistory.length;

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
