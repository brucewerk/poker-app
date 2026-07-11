import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  const { username, password } = await req.json();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return NextResponse.json({ success: false, error: 'Usuário inválido' });

  await connectDB();

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return NextResponse.json({ success: false, error: 'Usuário ou senha inválidos' });

  return NextResponse.json({ success: true, chips: user.chips });
}