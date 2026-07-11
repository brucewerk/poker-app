import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  const { username } = await req.json();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return NextResponse.json({ success: false, error: 'Usuário inválido' });

  await connectDB();

  const user = await User.findOne({ username });
  if (!user)
    return NextResponse.json({ success: false, error: 'Usuário não encontrado' });

  return NextResponse.json({ success: true, chips: user.chips });
}