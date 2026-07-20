// app/api/friends/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ====================== GET - Buscar amigos ======================
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
        friends: [],
      });
    }

    const friendList = user.friends || [];

    const friendUsernames = friendList.map((f) => f.username).filter(Boolean);
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

    const friends = friendList
      .map((f) => {
        const username = f.username;
        if (!username) return null;

        const friendData = friendsMap[username];
        if (friendData) {
          return friendData;
        }

        return {
          username: username,
          level: f.level || 1,
          chips: f.chips || 0,
          isOnline: f.isOnline || false,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      friends: friends,
    });
  } catch (error) {
    console.error("❌ GET /api/friends - Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ====================== POST - Adicionar/Remover amigo ======================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado. Faça login novamente." },
        { status: 401 },
      );
    }

    const username = session.user.username;
    if (!username) {
      return NextResponse.json(
        { success: false, error: "Usuário não identificado." },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Body inválido" },
        { status: 400 },
      );
    }

    const { friendUsername, action } = body;

    if (!friendUsername) {
      return NextResponse.json(
        { success: false, error: "Nome do amigo não fornecido" },
        { status: 400 },
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Ação não fornecida" },
        { status: 400 },
      );
    }

    if (username.toLowerCase() === friendUsername.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Não é possível adicionar a si mesmo" },
        { status: 400 },
      );
    }

    if (!["add", "remove"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Ação inválida. Use 'add' ou 'remove'" },
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

    if (!user.friends) {
      user.friends = [];
    }

    // 🔥 ADICIONAR AMIGO - TODAS AS RESPOSTAS COM STATUS 200
    if (action === "add") {
      const friend = await User.findOne({
        username: { $regex: new RegExp(`^${friendUsername}$`, "i") },
      });

      // 🔥 CASO 1: Amigo não encontrado → status 200 com flag
      if (!friend) {
        return NextResponse.json({
          success: false,
          notFound: true,
          message: `Usuário "${friendUsername}" não encontrado.`,
        });
      }

      const alreadyFriend = user.friends.some(
        (f) =>
          f.username &&
          f.username.toLowerCase() === friend.username.toLowerCase(),
      );

      // 🔥 CASO 2: Amigo já existe → status 200 com flag
      if (alreadyFriend) {
        return NextResponse.json({
          success: false,
          alreadyFriend: true,
          message: `${friend.username} já é seu amigo`,
          friend: {
            username: friend.username,
            level: friend.level || 1,
            chips: friend.chips || 0,
          },
        });
      }

      // 🔥 CASO 3: Sucesso → status 200
      user.friends.push({
        username: friend.username,
        level: friend.level || 1,
        chips: friend.chips || 0,
        isOnline: false,
      });

      await user.save();

      // Retorna a lista atualizada
      const friendUsernames = user.friends
        .map((f) => f.username)
        .filter(Boolean);
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

      const updatedFriends = user.friends
        .map((f) => {
          if (!f.username) return null;
          const friendData = friendsMap[f.username];
          if (friendData) {
            return friendData;
          }
          return {
            username: f.username,
            level: f.level || 1,
            chips: f.chips || 0,
            isOnline: f.isOnline || false,
          };
        })
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        message: `${friend.username} adicionado com sucesso!`,
        friends: updatedFriends,
      });
    }

    // 🔥 REMOVER AMIGO
    if (action === "remove") {
      user.friends = user.friends.filter(
        (f) =>
          f.username &&
          f.username.toLowerCase() !== friendUsername.toLowerCase(),
      );
      await user.save();

      return NextResponse.json({
        success: true,
        message: `${friendUsername} removido com sucesso!`,
        friends: user.friends,
      });
    }

    return NextResponse.json(
      { success: false, error: "Ação inválida" },
      { status: 400 },
    );
  } catch (error) {
    console.error("❌ POST /api/friends - Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
