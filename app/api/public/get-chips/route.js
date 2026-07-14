// app/api/public/get-chips/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Usuário não informado" },
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

    return NextResponse.json({
      success: true,
      chips: user.chips || 1000,
      username: user.username,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar fichas:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
