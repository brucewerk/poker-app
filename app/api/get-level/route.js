// app/api/get-level/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { calculateLevel } from "@/lib/level";

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

    let user = await User.findOne({ username });

    if (!user) {
      const newUser = new User({
        username: username,
        chips: 1000,
        level: 1,
        xp: 0,
        stats: {
          handsPlayed: 0,
          handsWon: 0,
          totalChipsWon: 0,
          biggestWin: 0,
          bestStreak: 0,
          bestHand: "",
          allInWins: 0,
          currentStreak: 0,
        },
        achievements: [],
        findings: [],
        friends: [],
        missions: [],
        handHistory: [],
      });
      user = await newUser.save();
      console.log(`✅ Usuário ${username} criado automaticamente`);
    }

    // 🔥 GARANTIR QUE OS CAMPOS EXISTEM
    if (!user.findings) {
      user.findings = [];
      await user.save();
    }
    if (!user.achievements) {
      user.achievements = [];
      await user.save();
    }

    // 🔥 REMOVER DUPLICATAS DO ARRAY DE ACHIEVEMENTS E SALVAR
    let changed = false;
    if (user.achievements && Array.isArray(user.achievements)) {
      const unique = [...new Set(user.achievements)];
      if (unique.length !== user.achievements.length) {
        const removed = user.achievements.length - unique.length;
        user.achievements = unique;
        changed = true;
        console.log(
          `🔄 [LEVEL] ${username}: removidas ${removed} duplicatas de conquistas (${unique.length} únicas)`,
        );
      }
    }

    // 🔥 REMOVER DUPLICATAS DO ARRAY DE FINDINGS
    if (user.findings && Array.isArray(user.findings)) {
      const uniqueFindings = [];
      const seenIds = new Set();
      for (const f of user.findings) {
        const id = f?.id || f;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          uniqueFindings.push(f);
        }
      }
      if (uniqueFindings.length !== user.findings.length) {
        const removed = user.findings.length - uniqueFindings.length;
        user.findings = uniqueFindings;
        changed = true;
        console.log(
          `🔄 [LEVEL] ${username}: removidas ${removed} duplicatas de achados (${uniqueFindings.length} únicos)`,
        );
      }
    }

    if (changed) {
      await user.save();
      console.log(`✅ [LEVEL] ${username}: dados corrigidos e salvos`);
    }

    const userXp = user.xp || 0;
    const levelInfo = calculateLevel(userXp);

    // 🔥 CONTAGEM CORRETA (USANDO O ARRAY JÁ LIMPO)
    const achievementsCount = Array.isArray(user.achievements)
      ? user.achievements.length
      : 0;
    const findingsCount = Array.isArray(user.findings)
      ? user.findings.length
      : 0;

    console.log(
      `📊 [LEVEL] ${username}: ${achievementsCount} conquistas, ${findingsCount} achados`,
    );

    return NextResponse.json({
      success: true,
      level: levelInfo.level,
      xp: levelInfo.xp,
      xpToNextLevel: levelInfo.xpToNextLevel,
      levelTitle: levelInfo.title,
      levelIcon: levelInfo.icon,
      findings: user.findings || [],
      findingsCount: findingsCount,
      achievements: user.achievements || [],
      achievementsCount: achievementsCount,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar nível:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
