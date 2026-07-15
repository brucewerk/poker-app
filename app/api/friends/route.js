// app/api/friends/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

// GET - Buscar amigos do usuário
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
        friends: [],
      });
    }

    // 🔥 Buscar dados atualizados de cada amigo
    const friendUsernames = (user.friends || []).map((f) => f.username);
    const friendUsers = await User.find({
      username: { $in: friendUsernames },
    });

    // 🔥 Criar mapa de amigos com dados atualizados
    const friendsMap = {};
    friendUsers.forEach((f) => {
      friendsMap[f.username] = {
        username: f.username,
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: false, // Poderia ser implementado com WebSocket
      };
    });

    // 🔥 Manter a ordem original e preencher dados
    const friends = (user.friends || []).map((f) => {
      const friendData = friendsMap[f.username];
      if (friendData) {
        return friendData;
      }
      // Se o amigo não existe mais no banco, retorna dados básicos
      return {
        username: f.username || "Desconhecido",
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: f.isOnline || false,
      };
    });

    console.log(`📊 ${friends.length} amigos encontrados para ${username}`);

    return NextResponse.json({
      success: true,
      friends: friends,
    });
  } catch (error) {
    console.error("Erro ao buscar amigos:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST - Adicionar ou remover amigo
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { friendUsername, action } = await request.json();
    const username = session.user.username;

    if (!username || !friendUsername) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos" },
        { status: 400 },
      );
    }

    if (username === friendUsername) {
      return NextResponse.json(
        { success: false, error: "Não é possível adicionar a si mesmo" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 🔥 Buscar dados do amigo
    const friend = await User.findOne({ username: friendUsername });
    if (!friend && action === "add") {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    let friends = user.friends || [];

    if (action === "add") {
      // Verificar se já é amigo
      if (friends.find((f) => f.username === friendUsername)) {
        return NextResponse.json(
          { success: false, error: "Este usuário já é seu amigo" },
          { status: 400 },
        );
      }

      // Adicionar amigo com dados atualizados
      friends.push({
        username: friendUsername,
        level: friend.level || 1,
        chips: friend.chips || 0,
        isOnline: false,
      });

      user.friends = friends;
      await user.save();

      console.log(`✅ ${username} adicionou ${friendUsername} como amigo`);
    } else if (action === "remove") {
      friends = friends.filter((f) => f.username !== friendUsername);
      user.friends = friends;
      await user.save();

      console.log(`✅ ${username} removeu ${friendUsername} dos amigos`);
    } else {
      return NextResponse.json(
        { success: false, error: "Ação inválida" },
        { status: 400 },
      );
    }

    // 🔥 Buscar dados atualizados de todos os amigos
    const friendUsernames = friends.map((f) => f.username);
    const friendUsers = await User.find({
      username: { $in: friendUsernames },
    });

    const friendsMap = {};
    friendUsers.forEach((f) => {
      friendsMap[f.username] = {
        username: f.username,
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: false,
      };
    });

    const updatedFriends = friends.map((f) => {
      const friendData = friendsMap[f.username];
      if (friendData) {
        return friendData;
      }
      return {
        username: f.username || "Desconhecido",
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: f.isOnline || false,
      };
    });

    return NextResponse.json({
      success: true,
      friends: updatedFriends,
    });
  } catch (error) {
    console.error("Erro ao gerenciar amigos:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
