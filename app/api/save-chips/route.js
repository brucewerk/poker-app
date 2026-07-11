import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  const { username, chips } = await req.json();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return NextResponse.json({ success: false, error: 'Usuário inválido' });

  if (!Number.isInteger(chips) || chips < 0 || chips > 1_000_000)
    return NextResponse.json({ success: false, error: 'Fichas inválidas' });

  await connectDB();

  await User.findOneAndUpdate({ username }, { chips });

  return NextResponse.json({ success: true });
}