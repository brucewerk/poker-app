// app/api/public/get-chips/route.js
import { NextResponse } from "next/server";

// 🔥 MELHORIA: Verificar se MongoDB está configurado antes de tentar conectar
const isMongoDBConfigured = !!process.env.MONGODB_URI;

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    // 🔥 MELHORIA: Se MongoDB não estiver configurado, retornar valor padrão imediatamente
    if (!isMongoDBConfigured) {
      console.log("⚠️ MongoDB não configurado, usando valor padrão de fichas");
      return NextResponse.json({
        success: true,
        chips: 1000,
        message: "MongoDB não configurado, usando valor padrão",
      });
    }

    // 🔥 MELHORIA: Tentar conectar com timeout mais curto e melhor tratamento de erro
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
      console.log("⚠️ Erro ao conectar ao MongoDB, usando valor padrão:", dbError.message);
      return NextResponse.json({
        success: true,
        chips: 1000,
        message: "Erro de conexão, usando valor padrão",
      });
    }

    const User = (await import("@/lib/models/User")).default;
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({
        success: true,
        chips: 1000,
        message: "Usuário não encontrado, usando valor padrão",
      });
    }

    return NextResponse.json({
      success: true,
      chips: user.chips || 1000,
    });
  } catch (error) {
    console.error("Erro ao buscar fichas:", error);
    // 🔥 MELHORIA: Mesmo em caso de erro, retornar valor padrão para não quebrar o jogo
    return NextResponse.json({
      success: true,
      chips: 1000,
      message: "Erro ao buscar fichas, usando valor padrão",
    });
  }
}
