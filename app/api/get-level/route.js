// app/api/get-level/route.js - CORRIGIDO
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// 🔥 DEFINIÇÃO DOS GRAUS E TÍTULOS
const RANKS = [
  { id: 1, type: "Comum", title: "Iniciante", minLevel: 1, xpBonus: 0 },
  { id: 2, type: "Comum", title: "Aprendiz", minLevel: 2, xpBonus: 5 },
  { id: 3, type: "Comum", title: "Estudante", minLevel: 4, xpBonus: 5 },
  { id: 4, type: "Comum", title: "Aspirante", minLevel: 6, xpBonus: 10 },
  { id: 5, type: "Incomum", title: "Jogador", minLevel: 8, xpBonus: 10 },
  { id: 6, type: "Incomum", title: "Estrategista", minLevel: 11, xpBonus: 15 },
  { id: 7, type: "Incomum", title: "Tático", minLevel: 14, xpBonus: 15 },
  { id: 8, type: "Raro", title: "Especialista", minLevel: 18, xpBonus: 20 },
  { id: 9, type: "Raro", title: "Mestre", minLevel: 22, xpBonus: 25 },
  { id: 10, type: "Raro", title: "Veterano", minLevel: 27, xpBonus: 25 },
  { id: 11, type: "Épico", title: "Lendário", minLevel: 33, xpBonus: 30 },
  { id: 12, type: "Épico", title: "Mítico", minLevel: 40, xpBonus: 35 },
  { id: 13, type: "Épico", title: "Imortal", minLevel: 48, xpBonus: 40 },
  { id: 14, type: "Lendário", title: "Cavaleiro", minLevel: 57, xpBonus: 45 },
  { id: 15, type: "Lendário", title: "Campeão", minLevel: 67, xpBonus: 50 },
  { id: 16, type: "Lendário", title: "Herói", minLevel: 78, xpBonus: 55 },
  { id: 17, type: "Mítico", title: "Mito", minLevel: 90, xpBonus: 60 },
  { id: 18, type: "Mítico", title: "Lenda Viva", minLevel: 105, xpBonus: 70 },
  {
    id: 19,
    type: "Mítico",
    title: "Imortal Lendário",
    minLevel: 125,
    xpBonus: 80,
  },
];

// 🔥 CALCULAR XP NECESSÁRIO POR NÍVEL
function getXpToLevel(level) {
  return Math.floor(100 * level * 0.8 + 20);
}

// 🔥 OBTER GRAU ATUAL
function getCurrentRank(level) {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.minLevel) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    // 🔥 Se for requisição para graus via query param ?ranks=true
    const isRanksRequest = url.searchParams.get("ranks") === "true";

    if (isRanksRequest) {
      return NextResponse.json({
        success: true,
        ranks: RANKS,
      });
    }

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Usuário não especificado" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("poker");
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpToNext = getXpToLevel(level);
    const progress = Math.min(100, (xp / xpToNext) * 100);
    const currentRank = getCurrentRank(level);

    const achievements = user.achievements || [];
    const findings = user.findings || [];

    return NextResponse.json({
      success: true,
      level,
      title: currentRank.title,
      rankType: currentRank.type,
      xp,
      xpToNext,
      progress,
      achievements: achievements.length,
      findings: findings.length,
      rank: currentRank,
      allRanks: RANKS,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar nível:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
