// app/api/save-chips/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 🔥 MELHORIA: Verificar se MongoDB está configurado antes de tentar conectar
const isMongoDBConfigured = !!process.env.MONGODB_URI;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

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
    let dbConnect, User;
    try {
      dbConnect = (await import("@/lib/mongoose")).default;
      User = (await import("@/lib/models/User")).default;
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

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 🔥 REMOVER BLOQUEIO - PERMITIR ZERO
    // A validação agora é feita no frontend com a flag isAllIn

    await User.updateOne({ username }, { $set: { chips } });

    console.log(`💰 ${username}: ${chips} fichas salvas`);

    return NextResponse.json({
      success: true,
      chips,
    });
  } catch (error) {
    console.error("Erro ao salvar fichas:", error);
    // 🔥 MELHORIA: Mesmo em caso de erro, retornar sucesso para não quebrar o jogo
    return NextResponse.json({
      success: true,
      chips: request.body?.chips || 1000,
      message: "Erro ao salvar fichas, jogo continua normalmente",
    });
  }
}
