// app/api/public/save-chips/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const { username, chips } = await req.json();

    console.log(
      `📥 Recebendo requisição para salvar ${username}: ${chips} fichas`,
    );

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Usuário não informado" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(chips) || chips < 0 || chips > 1_000_000) {
      return NextResponse.json(
        { success: false, error: "Fichas inválidas" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    user.chips = chips;
    await user.save();

    console.log(`✅ ${username}: ${chips} fichas salvas no MongoDB`);

    return NextResponse.json({
      success: true,
      chips: user.chips,
      message: `Fichas de ${username} atualizadas para ${chips}`,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar fichas:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
