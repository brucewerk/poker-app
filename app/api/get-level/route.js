// app/api/get-level/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { getLevelInfo } from "@/lib/level";

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || session.user.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({
        success: true,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        levelTitle: "Iniciante",
        levelIcon: "🎴",
        findings: [],
      });
    }

    const levelInfo = getLevelInfo(user.level || 1);

    return NextResponse.json({
      success: true,
      level: user.level || 1,
      xp: user.xp || 0,
      xpToNextLevel: levelInfo.xpToNextLevel || 100,
      levelTitle: levelInfo.title || "Iniciante",
      levelIcon: levelInfo.icon || "🎴",
      findings: user.findings || [],
    });
  } catch (error) {
    console.error("Erro ao buscar nível:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
