// app/api/update-level/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import {
  getXpToNextLevel,
  getLevelTitle,
  checkLevelUp,
  calculateLevel,
} from "@/lib/level";
import { checkFindings } from "@/lib/findings";

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { username, xpGain, chipsGain } = await req.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
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

    // 🔥 Atualizar XP
    let newXp = (user.xp || 0) + (xpGain || 0);
    let currentLevel = user.level || 1;

    // 🔥 Verificar se subiu de nível
    const levelResult = checkLevelUp(currentLevel, newXp);

    if (levelResult.leveledUp) {
      user.level = levelResult.newLevel;
      console.log(`🎉 ${username} subiu para Nível ${levelResult.newLevel}!`);
    }

    user.xp = newXp;

    // 🔥 Atualizar fichas se houver ganho
    if (chipsGain) {
      user.chips = (user.chips || 0) + chipsGain;
    }

    // 🔥 Verificar novos achados
    const findings = await checkFindings(username, user.stats || {});
    if (findings && findings.length > 0) {
      user.findings = [...(user.findings || []), ...findings];
    }

    await user.save();

    // 🔥 Buscar dados atualizados
    const xpToNext = getXpToNextLevel(user.level);
    const levelTitle = getLevelTitle(user.level);

    return NextResponse.json({
      success: true,
      level: user.level,
      xp: user.xp,
      xpToNextLevel: xpToNext,
      levelTitle: levelTitle,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
      chips: user.chips,
      findings: user.findings || [],
    });
  } catch (error) {
    console.error("Erro ao atualizar nível:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
