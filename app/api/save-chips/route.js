// app/api/save-chips/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { username, chips } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    if (typeof chips !== "number" || chips < 0) {
      return NextResponse.json(
        { success: false, error: "Valor de fichas inválido" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("poker");
    const users = db.collection("users");

    await users.updateOne({ username }, { $set: { chips } }, { upsert: true });

    return NextResponse.json({
      success: true,
      chips,
    });
  } catch (error) {
    console.error("Erro ao salvar fichas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
