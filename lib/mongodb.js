// lib/mongodb.js
import { MongoClient } from "mongodb";

// 🔥 CORRIGIDO: mesmo bug crítico do lib/mongodb-client.js e
// lib/mongoose.js - ver comentários detalhados em lib/mongodb-client.js.
// Resumo: nunca lançar erro de forma síncrona no carregamento do módulo,
// pois isso derruba TODAS as rotas que o importam, mesmo as que nunca
// chegariam a usar o banco de dados.
const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise;

if (!uri) {
  clientPromise = Promise.reject(
    new Error(
      "MONGODB_URI não está definida nas variáveis de ambiente. " +
        "Configure-a no .env.local (desenvolvimento) ou no painel do seu " +
        "provedor de deploy (produção).",
    ),
  );
  clientPromise.catch(() => {});
} else if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// 🔥 Exportar clientPromise como padrão
export default clientPromise;

// 🔥 Exportar connectDB para compatibilidade
export async function connectDB() {
  try {
    const client = await clientPromise;
    return client.db();
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw error;
  }
}
