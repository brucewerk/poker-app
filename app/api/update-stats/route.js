// app/api/update-stats/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { username, result, chips, handName, wasAllIn } =
      await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });
    const stats = user?.stats || {
      handsPlayed: 0,
      handsWon: 0,
      totalChipsWon: 0,
      biggestWin: 0,
      bestStreak: 0,
      bestHand: "",
      allInWins: 0,
    };

    // Atualizar estatísticas
    stats.handsPlayed = (stats.handsPlayed || 0) + 1;

    if (result === "win") {
      stats.handsWon = (stats.handsWon || 0) + 1;
      stats.totalChipsWon = (stats.totalChipsWon || 0) + chips;

      if (chips > (stats.biggestWin || 0)) {
        stats.biggestWin = chips;
      }

      if (handName) {
        const handOrder = [
          "Carta Alta",
          "Um Par",
          "Dois Pares",
          "Trinca",
          "Sequencia",
          "Flush",
          "Full House",
          "Quadra",
          "Straight Flush",
        ];
        const currentIndex = handOrder.indexOf(stats.bestHand);
        const newIndex = handOrder.indexOf(handName);
        if (newIndex > currentIndex) {
          stats.bestHand = handName;
        }
      }

      if (wasAllIn) {
        stats.allInWins = (stats.allInWins || 0) + 1;
      }
    }

    // Salvar
    await User.updateOne({ username }, { $set: { stats } }, { upsert: true });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Erro ao atualizar estatísticas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
