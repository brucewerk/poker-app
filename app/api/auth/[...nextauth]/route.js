// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            console.log("❌ Credenciais incompletas");
            return null;
          }

          console.log(`🔍 Buscando usuário: ${credentials.username}`);

          await dbConnect();

          const user = await User.findOne({ username: credentials.username });

          if (!user) {
            console.log(`❌ Usuário não encontrado: ${credentials.username}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValid) {
            console.log(`❌ Senha incorreta para: ${credentials.username}`);
            return null;
          }

          console.log(`✅ Usuário autenticado: ${credentials.username}`);

          return {
            id: user._id.toString(),
            username: user.username,
            chips: user.chips || 1000,
            level: user.level || 1,
            email: user.email || null,
          };
        } catch (error) {
          console.error("❌ Erro na autenticação:", error);
          return null;
        }
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "poker",
  }),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.chips = user.chips || 1000;
        token.level = user.level || 1;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username;
        session.user.chips = token.chips || 1000;
        session.user.level = token.level || 1;
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // 🔥 Adicionar trustHost para evitar problemas de CORS
  trustHost: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
