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

    // 🔥 Se não tiver amigos, retorna vazio
    if (!user.friends || user.friends.length === 0) {
      return NextResponse.json({
        success: true,
        friends: [],
      });
    }

    // 🔥 Buscar dados atualizados de CADA amigo
    const friendUsernames = user.friends.map((f) => f.username);
    const friendUsers = await User.find({
      username: { $in: friendUsernames },
    });

    // 🔥 Criar mapa de amigos com dados ATUALIZADOS
    const friendsMap = {};
    friendUsers.forEach((f) => {
      friendsMap[f.username] = {
        username: f.username || "Desconhecido",
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: false,
      };
    });

    // 🔥 Construir lista final de amigos
    const friends = user.friends.map((f) => {
      const username = f.username || "Desconhecido";
      const friendData = friendsMap[username];

      if (friendData) {
        return friendData;
      }

      // Se o amigo não existe mais no banco, retorna dados básicos
      return {
        username: username,
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: f.isOnline || false,
      };
    });

    console.log(`📊 ${friends.length} amigos encontrados para ${username}`);
    console.log(`📊 Amigos:`, friends.map((f) => f.username).join(", "));

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
        { success: false, error: `Usuário "${friendUsername}" não encontrado` },
        { status: 404 },
      );
    }

    // 🔥 Inicializar array de amigos se não existir
    if (!user.friends) {
      user.friends = [];
    }

    if (action === "add") {
      // 🔥 Verificar se já é amigo
      const alreadyFriend = user.friends.some(
        (f) => f.username === friendUsername,
      );
      if (alreadyFriend) {
        return NextResponse.json(
          { success: false, error: `${friendUsername} já é seu amigo` },
          { status: 400 },
        );
      }

      // 🔥 Adicionar amigo com dados COMPLETOS do banco
      user.friends.push({
        username: friend.username,
        level: friend.level || 1,
        chips: friend.chips || 0,
        isOnline: false,
      });

      await user.save();

      console.log(`✅ ${username} adicionou ${friendUsername} como amigo`);
      console.log(
        `📊 Dados do amigo: Nível ${friend.level || 1}, ${friend.chips || 0} fichas`,
      );
    } else if (action === "remove") {
      // 🔥 Remover amigo
      user.friends = user.friends.filter((f) => f.username !== friendUsername);
      await user.save();

      console.log(`✅ ${username} removeu ${friendUsername} dos amigos`);
    } else {
      return NextResponse.json(
        { success: false, error: "Ação inválida" },
        { status: 400 },
      );
    }

    // 🔥 Buscar dados atualizados de TODOS os amigos
    const friendUsernames = user.friends.map((f) => f.username);
    const friendUsers = await User.find({
      username: { $in: friendUsernames },
    });

    const friendsMap = {};
    friendUsers.forEach((f) => {
      friendsMap[f.username] = {
        username: f.username || "Desconhecido",
        level: f.level || 1,
        chips: f.chips || 0,
        isOnline: false,
      };
    });

    const updatedFriends = user.friends.map((f) => {
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
      message:
        action === "add"
          ? `${friendUsername} adicionado com sucesso!`
          : `${friendUsername} removido com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao gerenciar amigos:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
