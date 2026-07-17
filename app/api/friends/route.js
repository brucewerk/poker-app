// app/api/friends/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

// ====================== GET - Buscar amigos ======================
export async function GET(request) {
  try {
    // 🔥 USAR AUTHOPTIONS EXPLICITAMENTE
    const session = await getServerSession(authOptions);
    console.log("🔍 GET /api/friends - Session:", session?.user?.username);

    if (!session) {
      console.log("❌ GET /api/friends - Não autorizado (sem sessão)");
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || session.user.username;

    console.log(`🔍 GET /api/friends - Buscando amigos para: ${username}`);

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ GET /api/friends - Usuário ${username} não encontrado`);
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

    console.log(`✅ GET /api/friends - ${friends.length} amigos retornados`);

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
    // 🔥 USAR AUTHOPTIONS EXPLICITAMENTE
    const session = await getServerSession(authOptions);
    console.log("🔍 POST /api/friends - Session:", session?.user?.username);

    if (!session || !session.user) {
      console.log("❌ POST /api/friends - Não autorizado (sem sessão)");
      return NextResponse.json(
        { success: false, error: "Não autorizado. Faça login novamente." },
        { status: 401 },
      );
    }

    const username = session.user.username;
    if (!username) {
      console.log("❌ POST /api/friends - Username não encontrado na sessão");
      return NextResponse.json(
        { success: false, error: "Usuário não identificado." },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("❌ Erro ao ler body:", e);
      return NextResponse.json(
        { success: false, error: "Body inválido" },
        { status: 400 },
      );
    }

    const { friendUsername, action } = body;

    console.log(`🔍 POST /api/friends - Dados recebidos:`, {
      username,
      friendUsername,
      action,
    });

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
      console.log(`⚠️ ${username} tentou adicionar a si mesmo`);
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
      console.log(`❌ POST /api/friends - Usuário ${username} não encontrado`);
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (!user.friends) {
      user.friends = [];
    }

    if (action === "add") {
      const friend = await User.findOne({
        username: { $regex: new RegExp(`^${friendUsername}$`, "i") },
      });

      console.log(
        `🔍 Buscando amigo: ${friendUsername} -> ${friend?.username || "NÃO ENCONTRADO"}`,
      );

      if (!friend) {
        const allUsers = await User.find({}, { username: 1 });
        const userList = allUsers.map((u) => u.username).join(", ");
        console.log(`📊 Usuários disponíveis: ${userList}`);

        return NextResponse.json(
          {
            success: false,
            error: `Usuário "${friendUsername}" não encontrado.`,
          },
          { status: 404 },
        );
      }

      const alreadyFriend = user.friends.some(
        (f) =>
          f.username &&
          f.username.toLowerCase() === friend.username.toLowerCase(),
      );

      if (alreadyFriend) {
        console.log(`⚠️ ${friend.username} já é amigo de ${username}`);
        return NextResponse.json(
          { success: false, error: `${friend.username} já é seu amigo` },
          { status: 400 },
        );
      }

      user.friends.push({
        username: friend.username,
        level: friend.level || 1,
        chips: friend.chips || 0,
        isOnline: false,
      });

      await user.save();

      console.log(`✅ ${username} adicionou ${friend.username}`);

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
        message: `${friend.username} adicionado com sucesso!`,
        friends: updatedFriends,
      });
    }

    if (action === "remove") {
      user.friends = user.friends.filter((f) => f.username !== friendUsername);
      await user.save();

      console.log(`✅ ${username} removeu ${friendUsername}`);

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
