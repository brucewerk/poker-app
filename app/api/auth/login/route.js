// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { signIn } from "next-auth/react";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Credenciais incompletas" },
        { status: 400 },
      );
    }

    // Tenta fazer login via NextAuth
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro no login alternativo:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
