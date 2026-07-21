// app/api/tournaments/route.js - COMPLETO COM DELETE E UPDATE
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  createTournament,
  getActiveTournaments,
  getTournamentById,
  joinTournament,
  startTournament,
} from "@/lib/tournament";
import dbConnect from "@/lib/mongoose";
import Tournament from "@/models/Tournament";
import User from "@/lib/models/User";

// 🔥 GET - Listar torneios
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
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "active";

    await dbConnect();

    if (id) {
      const tournament = await getTournamentById(id);
      if (!tournament) {
        return NextResponse.json(
          { success: false, error: "Torneio não encontrado" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, tournament });
    }

    if (type === "active") {
      const tournaments = await getActiveTournaments();
      return NextResponse.json({ success: true, tournaments });
    }

    await dbConnect();
    const tournaments = await getActiveTournaments();
    return NextResponse.json({ success: true, tournaments });
  } catch (error) {
    console.error("❌ Erro ao buscar torneios:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao buscar torneios" },
      { status: 500 },
    );
  }
}

// 🔥 POST - Criar/inscrever/iniciar torneio
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, tournamentId, name, description, maxPlayers, buyIn } = body;

    await dbConnect();

    switch (action) {
      case "create": {
        const tournament = await createTournament({
          name,
          description,
          maxPlayers,
          buyIn,
          createdBy: session.user.username,
        });
        return NextResponse.json({ success: true, tournament });
      }

      case "join": {
        if (!tournamentId) {
          return NextResponse.json(
            { success: false, error: "ID do torneio não fornecido" },
            { status: 400 },
          );
        }
        const tournament = await joinTournament(
          tournamentId,
          session.user.username,
        );
        return NextResponse.json({ success: true, tournament });
      }

      case "start": {
        if (!tournamentId) {
          return NextResponse.json(
            { success: false, error: "ID do torneio não fornecido" },
            { status: 400 },
          );
        }
        const tournament = await startTournament(tournamentId);
        return NextResponse.json({ success: true, tournament });
      }

      case "update": {
        if (!tournamentId) {
          return NextResponse.json(
            { success: false, error: "ID do torneio não fornecido" },
            { status: 400 },
          );
        }

        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
          return NextResponse.json(
            { success: false, error: "Torneio não encontrado" },
            { status: 404 },
          );
        }

        // 🔥 VERIFICAR SE É O CRIADOR
        if (tournament.createdBy !== session.user.username) {
          return NextResponse.json(
            { success: false, error: "Apenas o criador pode editar o torneio" },
            { status: 403 },
          );
        }

        // 🔥 VERIFICAR SE O TORNEIO NÃO FOI INICIADO
        if (tournament.status !== "waiting") {
          return NextResponse.json(
            {
              success: false,
              error: "Torneio já iniciado, não pode ser editado",
            },
            { status: 400 },
          );
        }

        if (name) tournament.name = name;
        if (description !== undefined) tournament.description = description;
        if (maxPlayers) tournament.maxPlayers = maxPlayers;
        if (buyIn) {
          tournament.buyIn = buyIn;
          // 🔥 ATUALIZAR PRIZE POOL
          await tournament.updatePrizePool();
        }

        await tournament.save();
        return NextResponse.json({ success: true, tournament });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Ação inválida" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("❌ Erro na operação de torneio:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro na operação" },
      { status: 500 },
    );
  }
}

// 🔥 DELETE - Deletar torneio
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("id");

    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: "ID do torneio não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Torneio não encontrado" },
        { status: 404 },
      );
    }

    // 🔥 VERIFICAR SE É O CRIADOR
    if (tournament.createdBy !== session.user.username) {
      return NextResponse.json(
        { success: false, error: "Apenas o criador pode deletar o torneio" },
        { status: 403 },
      );
    }

    // 🔥 VERIFICAR SE O TORNEIO NÃO FOI INICIADO
    if (tournament.status !== "waiting") {
      return NextResponse.json(
        { success: false, error: "Torneio já iniciado, não pode ser deletado" },
        { status: 400 },
      );
    }

    // 🔥 DEVOLVER FICHAS DOS JOGADORES INSCRITOS
    for (const player of tournament.players) {
      const user = await User.findOne({ username: player.username });
      if (user) {
        user.chips += tournament.buyIn;
        await user.save();
      }
    }

    await tournament.deleteOne();

    return NextResponse.json({
      success: true,
      message: "Torneio deletado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar torneio:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao deletar torneio" },
      { status: 500 },
    );
  }
}
