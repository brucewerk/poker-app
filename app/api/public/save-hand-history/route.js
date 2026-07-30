// app/api/public/save-hand-history/route.js
// 🔥 ROTA PÚBLICA (sem sessão) — chamada pelo socket-server.js para que as
// mãos jogadas no multiplayer online entrem no MESMO histórico global do
// jogador (antes, só o modo CPU salvava histórico).
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
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

    const handId =
      handData.id ||
      `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const handToSave = {
      id: handId,
      ...handData,
      timestamp: handData.timestamp || new Date().toISOString(),
    };

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (!user.handHistory) user.handHistory = [];

    const existingIndex = user.handHistory.findIndex((h) => h.id === handId);

    if (existingIndex !== -1) {
      user.handHistory[existingIndex] = handToSave;
    } else {
      const existsByData = user.handHistory.some(
        (h) =>
          h.timestamp === handToSave.timestamp &&
          h.result === handToSave.result &&
          h.pot === handToSave.pot,
      );

      if (existsByData) {
        return NextResponse.json({
          success: true,
          message: "Duplicata ignorada (dados)",
          total: user.handHistory.length,
        });
      }

      user.handHistory.unshift(handToSave);
    }

    if (user.handHistory.length > 100) {
      user.handHistory = user.handHistory.slice(0, 100);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Histórico salvo com sucesso!",
      total: user.handHistory.length,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar histórico (public):", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao salvar histórico" },
      { status: 500 },
    );
  }
}
