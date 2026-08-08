// lib/mongoose.js
import mongoose from "mongoose";

// 🔥 CORRIGIDO (bug crítico): antes, a ausência de MONGODB_URI lançava um
// erro no TOPO DO ARQUIVO (fora de qualquer função), no momento em que o
// módulo era importado. Como 16 rotas de API importam este arquivo -
// incluindo app/api/auth/[...nextauth]/route.js - qualquer problema com
// essa variável de ambiente fazia TODAS essas rotas falharem por completo
// ao carregar, mesmo endpoints que não usam banco de dados nenhum (como
// /api/auth/session, que o NextAuth chama automaticamente em toda troca
// de página, inclusive na tela de login). O servidor então devolvia uma
// página de erro em HTML no lugar do JSON esperado, e é exatamente isso
// que gera o erro "Unexpected token '<', <!DOCTYPE ... is not valid
// JSON" reportado pelo NextAuth no console.
//
// Agora a verificação só acontece quando alguém de fato chama dbConnect()
// - então rotas que não precisam de banco continuam funcionando
// normalmente mesmo se a variável estiver ausente, e quem realmente
// precisa dela recebe um erro claro e tratável (não uma queda total do
// processo/rota).
function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI não está definida. Configure essa variável de ambiente " +
        "(no arquivo .env.local em desenvolvimento, ou nas variáveis de " +
        "ambiente do seu provedor de deploy - Vercel/Render/etc - em produção).",
    );
  }
  return uri;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = getMongoUri();

    const opts = {
      bufferCommands: false,
      // 🔥 DESABILITAR LOGS DESNECESSÁRIOS
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // 🔥 REMOVER LOG DE CONEXÃO OU DEIXAR APENAS EM DESENVOLVIMENTO
      if (process.env.NODE_ENV === "development") {
        console.log("✅ MongoDB conectado");
      }
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
