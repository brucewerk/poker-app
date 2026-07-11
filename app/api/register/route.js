import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  const { username, password } = await req.json();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return NextResponse.json({ success: false, error: 'Usuário inválido' });

  if (password.length < 4 || password.length > 72)
    return NextResponse.json({ success: false, error: 'Senha inválida' });

  await connectDB();

  const exists = await User.findOne({ username });
  if (exists)
    return NextResponse.json({ success: false, error: 'Usuário já existe' });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashed });

  return NextResponse.json({ success: true, message: 'Cadastro realizado!' });
}