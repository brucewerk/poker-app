// lib/mongodb-client.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

if (!process.env.MONGODB_URI) {
  throw new Error("Por favor, defina a variável MONGODB_URI no .env.local");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Em desenvolvimento, usar uma variável global para manter a conexão
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
