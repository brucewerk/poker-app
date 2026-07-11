// app/api/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    // Validações
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Usuário inválido (3-20 caracteres, apenas letras, números e _)",
        },
        { status: 400 },
      );
    }

    if (password.length < 4 || password.length > 72) {
      return NextResponse.json(
        { success: false, error: "Senha inválida (4-72 caracteres)" },
        { status: 400 },
      );
    }

    await connectDB();

    const exists = await User.findOne({ username });
    if (exists) {
      return NextResponse.json(
        { success: false, error: "Usuário já existe" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashed,
      chips: 1000,
    });

    return NextResponse.json({
      success: true,
      message: "Cadastro realizado! Faça login.",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
