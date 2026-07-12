// app/api/get-level/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getLevelTitle, getLevelIcon } from "@/lib/level";
import { getUnlockedFindings } from "@/lib/findings";

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

    const level = user.level || 1;
    const findings = getUnlockedFindings(user.findings || []);

    return NextResponse.json({
      success: true,
      level: level,
      xp: user.xp || 0,
      xpToNextLevel: user.xpToNextLevel || 100,
      levelTitle: getLevelTitle(level),
      levelIcon: getLevelIcon(level),
      findings: findings,
      totalFindings: findings.length,
    });
  } catch (error) {
    console.error("Erro ao buscar nível:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
