// app/api/public/get-chips/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export async function POST(request) {
  try {
    const { username } = await request.json();

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
        chips: 1000,
        message: "Usuário não encontrado, usando valor padrão",
      });
    }

    return NextResponse.json({
      success: true,
      chips: user.chips || 1000,
    });
  } catch (error) {
    console.error("Erro ao buscar fichas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
