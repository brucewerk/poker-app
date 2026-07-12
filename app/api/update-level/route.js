// app/api/update-level/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getXpToNextLevel, getLevelTitle } from "@/lib/level";
import { checkFindings } from "@/lib/findings";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const { xpGained, stats } = await req.json();

    await connectDB();

    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Adicionar XP
    let newXp = (user.xp || 0) + xpGained;
    let newLevel = user.level || 1;
    let xpToNext = getXpToNextLevel(newLevel);
    let leveledUp = false;

    // Verificar se subiu de nível
    while (newXp >= xpToNext) {
      newXp -= xpToNext;
      newLevel++;
      xpToNext = getXpToNextLevel(newLevel);
      leveledUp = true;
    }

    // Verificar findings
    const userStats = user.stats || {};
    const currentFindings = user.findings || [];
    const newFindings = checkFindings(userStats, currentFindings);

    let findingsGained = [];
    if (newFindings.length > 0) {
      const findingIds = newFindings.map((f) => f.id);
      user.findings = [...currentFindings, ...findingIds];
      findingsGained = newFindings;

      // Adicionar XP extra dos findings
      const extraXp = newFindings.reduce((sum, f) => sum + (f.xp || 0), 0);
      newXp += extraXp;

      // Re-verificar level-up com o XP extra
      while (newXp >= xpToNext) {
        newXp -= xpToNext;
        newLevel++;
        xpToNext = getXpToNextLevel(newLevel);
        leveledUp = true;
      }
    }

    // Atualizar
    user.xp = newXp;
    user.level = newLevel;
    user.xpToNextLevel = xpToNext;
    await user.save();

    return NextResponse.json({
      success: true,
      leveledUp,
      newLevel,
      xp: newXp,
      xpToNextLevel: xpToNext,
      levelTitle: getLevelTitle(newLevel),
      findingsGained,
    });
  } catch (error) {
    console.error("Erro ao atualizar nível:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
