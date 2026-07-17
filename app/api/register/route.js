// app/api/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validações
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Usuário deve ter pelo menos 3 caracteres" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Senha deve ter pelo menos 6 caracteres" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Usuário já existe" },
        { status: 400 },
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Criar usuário - SEM EMAIL
    const user = new User({
      username,
      password: hashedPassword,
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
      },
      achievements: [],
      findings: [],
      savedGameState: null,
      friends: [],
      missions: [],
      handHistory: [],
    });

    await user.save();

    console.log(`✅ Novo usuário registrado: ${username}`);

    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar usuário" },
      { status: 500 },
    );
  }
}
