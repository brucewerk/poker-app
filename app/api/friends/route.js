// app/api/friends/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

// GET - Buscar lista de amigos
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

    // Buscar dados dos amigos
    const friends = await User.find({
      username: { $in: user.friends || [] },
    }).select("username level xp chips stats");

    return NextResponse.json({
      success: true,
      friends: friends.map((f) => ({
        username: f.username,
        level: f.level || 1,
        xp: f.xp || 0,
        chips: f.chips || 0,
        handsPlayed: f.stats?.handsPlayed || 0,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar amigos:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST - Adicionar ou remover amigo
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }

    const { friendUsername, action } = await req.json();

    if (!friendUsername) {
      return NextResponse.json(
        { success: false, error: "Nome do amigo é obrigatório" },
        { status: 400 },
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

    // Verificar se o amigo existe
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Não pode adicionar a si mesmo
    if (friendUsername === session.user.username) {
      return NextResponse.json(
        { success: false, error: "Não pode adicionar a si mesmo" },
        { status: 400 },
      );
    }

    if (action === "add") {
      if (user.friends?.includes(friendUsername)) {
        return NextResponse.json(
          { success: false, error: "Amigo já adicionado" },
          { status: 400 },
        );
      }
      user.friends = [...(user.friends || []), friendUsername];
    } else if (action === "remove") {
      user.friends = (user.friends || []).filter((f) => f !== friendUsername);
    } else {
      return NextResponse.json(
        { success: false, error: "Ação inválida" },
        { status: 400 },
      );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      friends: user.friends,
    });
  } catch (error) {
    console.error("Erro ao gerenciar amigos:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
