// lib/mongodb-client.js
import { MongoClient } from "mongodb";

// 🔥 CORRIGIDO (mesmo bug crítico do lib/mongoose.js): antes, a ausência
// de MONGODB_URI lançava um erro de forma SÍNCRONA no carregamento do
// módulo (fora de qualquer função). Como isso acontece assim que o
// arquivo é importado, qualquer rota que dependesse dele quebrava por
// completo caso a variável de ambiente estivesse ausente ou mal
// configurada - o servidor devolvia uma página de erro HTML no lugar do
// JSON esperado.
//
// Agora, se a variável estiver ausente, criamos uma Promise REJEITADA em
// vez de lançar um erro síncrono. Isso não quebra o carregamento do
// módulo - o erro só aparece quando (e se) alguém de fato tentar usar a
// conexão (`await clientPromise`), com uma mensagem clara.
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
  // Evita um aviso de "unhandled promise rejection" no log do servidor
  // antes que algum código realmente tente usar esta conexão.
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

export default clientPromise;
