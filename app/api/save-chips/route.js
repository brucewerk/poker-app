// app/api/save-chips/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const { chips } = await req.json();

    if (!Number.isInteger(chips) || chips < 0 || chips > 1_000_000) {
      return NextResponse.json(
        { success: false, error: "Fichas inválidas" },
        { status: 400 },
      );
    }

    await connectDB();

    // ✅ Usar updateOne com $set para evitar conflitos
    await User.updateOne(
      { username: session.user.username },
      { $set: { chips: chips } },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar fichas:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
