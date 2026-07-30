import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// 🔥 MELHORIA: Verificar se MongoDB está configurado antes de tentar conectar
const isMongoDBConfigured = !!process.env.MONGODB_URI;

export async function POST(req) {
  const { username, password } = await req.json();

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return NextResponse.json({ success: false, error: 'Usuário inválido' });

  // 🔥 MELHORIA: Se MongoDB não estiver configurado, permitir login com valores padrão
  if (!isMongoDBConfigured) {
    console.log("⚠️ MongoDB não configurado, permitindo login modo demo");
    // 🔥 MELHORIA: Aceitar qualquer senha no modo demo
    return NextResponse.json({ 
      success: true, 
      chips: 1000,
      message: "Modo demo - MongoDB não configurado"
    });
  }

  try {
    const connectDB = (await import('@/lib/mongodb')).default;
    const User = (await import('@/lib/models/User')).default;
    
    await Promise.race([
      connectDB(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na conexão com banco de dados')), 5000)
      )
    ]);

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return NextResponse.json({ success: false, error: 'Usuário ou senha inválidos' });

    return NextResponse.json({ success: true, chips: user.chips });
  } catch (error) {
    console.log("⚠️ Erro ao conectar ao MongoDB, permitindo login modo demo:", error.message);
    return NextResponse.json({ 
      success: true, 
      chips: 1000,
      message: "Modo demo - Erro de conexão"
    });
  }
}