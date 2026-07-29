// app/api/auth/login-custom/route.js - API DE LOGIN CUSTOMIZADA
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Credenciais incompletas" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });

    if (!user) {
      console.log(`🔐 Login: ${username} - Usuário não encontrado`);
      return NextResponse.json(
        { success: false, error: "Usuário ou senha inválidos" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      console.log(`🔐 Login: ${username} - Senha incorreta`);
      return NextResponse.json(
        { success: false, error: "Usuário ou senha inválidos" },
        { status: 401 },
      );
    }

    console.log(`✅ Login: ${username} - Autenticado`);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        chips: user.chips || 1000,
        level: user.level || 1,
      },
    });
  } catch (error) {
    console.log(`🔐 Login - Erro interno`);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
