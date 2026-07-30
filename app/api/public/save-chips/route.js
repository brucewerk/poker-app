// app/api/public/save-chips/route.js
// 🔥 ROTA PÚBLICA (sem sessão) — chamada pelo socket-server.js (processo
// separado, sem cookies de sessão) para persistir as fichas globais do
// jogador após partidas de multiplayer online. NÃO exige autenticação de
// propósito, assim como /api/public/get-chips.
import { NextResponse } from "next/server";

// 🔥 MELHORIA: Verificar se MongoDB está configurado antes de tentar conectar
const isMongoDBConfigured = !!process.env.MONGODB_URI;

export async function POST(request) {
  try {
    const { username, chips } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    if (typeof chips !== "number" || chips < 0) {
      return NextResponse.json(
        { success: false, error: "Valor de fichas inválido" },
        { status: 400 },
      );
    }

    // 🔥 MELHORIA: Se MongoDB não estiver configurado, retornar sucesso sem persistir
    if (!isMongoDBConfigured) {
      console.log("⚠️ MongoDB não configurado, fichas não serão persistidas");
      return NextResponse.json({
        success: true,
        chips,
        message: "MongoDB não configurado, fichas não persistidas",
      });
    }

    // 🔥 MELHORIA: Tentar conectar com timeout e melhor tratamento de erro
    let dbConnect;
    try {
      dbConnect = (await import("@/lib/mongoose")).default;
      await Promise.race([
        dbConnect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na conexão com banco de dados')), 5000)
        )
      ]);
    } catch (dbError) {
      console.log("⚠️ Erro ao conectar ao MongoDB, fichas não serão persistidas:", dbError.message);
      return NextResponse.json({
        success: true,
        chips,
        message: "Erro de conexão, fichas não persistidas",
      });
    }

    const User = (await import("@/lib/models/User")).default;
    await User.updateOne({ username }, { $set: { chips } }, { upsert: true });

    return NextResponse.json({
      success: true,
      chips,
    });
  } catch (error) {
    console.error("Erro ao salvar fichas:", error);
    // 🔥 MELHORIA: Mesmo em caso de erro, retornar sucesso para não quebrar o jogo
    return NextResponse.json({
      success: true,
      message: "Erro ao salvar fichas, jogo continua normalmente",
    });
  }
}
