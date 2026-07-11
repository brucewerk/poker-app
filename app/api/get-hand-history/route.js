// app/api/get-hand-history/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      handHistory: user.handHistory || [],
    });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
