// app/api/get-level/route.js - COMPLETO CORRIGIDO
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

// 🔥 TÍTULOS POR NÍVEL
const LEVEL_TITLES = [
  { min: 1, title: "Iniciante", icon: "🎴" },
  { min: 5, title: "Aprendiz", icon: "🃏" },
  { min: 10, title: "Jogador", icon: "🎯" },
  { min: 20, title: "Apostador", icon: "💰" },
  { min: 35, title: "Mestre", icon: "👑" },
  { min: 50, title: "Lenda", icon: "🏆" },
  { min: 75, title: "Mito", icon: "⭐" },
  { min: 100, title: "Deus do Poker", icon: "🔥" },
];

function getLevelInfo(level, xp) {
  const xpPerLevel = 100;
  const xpToNextLevel = xpPerLevel;
  const currentLevelXp = (level - 1) * xpPerLevel;
  const xpInCurrentLevel = xp - currentLevelXp;

  let title = LEVEL_TITLES[0].title;
  let icon = LEVEL_TITLES[0].icon;
  for (const lt of LEVEL_TITLES) {
    if (level >= lt.min) {
      title = lt.title;
      icon = lt.icon;
    }
  }

  return {
    level,
    xp,
    xpToNextLevel,
    xpInCurrentLevel,
    levelTitle: title,
    levelIcon: icon,
  };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
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
        achievementsCount: 0,
        findingsCount: 0,
        findings: [],
        achievements: [],
      });
    }

    const levelInfo = getLevelInfo(user.level || 1, user.xp || 0);

    // 🔥 CONTAGEM DE CONQUISTAS E ACHADOS
    const achievementsCount = user.achievements?.length || 0;
    const findingsCount = user.findings?.length || 0;

    return NextResponse.json({
      success: true,
      level: levelInfo.level,
      xp: levelInfo.xp,
      xpToNextLevel: levelInfo.xpToNextLevel,
      xpInCurrentLevel: levelInfo.xpInCurrentLevel,
      levelTitle: levelInfo.levelTitle,
      levelIcon: levelInfo.levelIcon,
      achievementsCount: achievementsCount,
      findingsCount: findingsCount,
      findings: user.findings || [],
      achievements: user.achievements || [],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar nível:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
