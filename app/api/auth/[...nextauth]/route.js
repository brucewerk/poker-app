// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/lib/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          await dbConnect();

          if (!credentials?.username || !credentials?.password) {
            console.error("❌ Credenciais incompletas");
            return null;
          }

          const user = await User.findOne({ username: credentials.username });

          if (!user) {
            console.error(`❌ Usuário não encontrado: ${credentials.username}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValid) {
            console.error(`❌ Senha inválida para: ${credentials.username}`);
            return null;
          }

          console.log(`✅ Login bem-sucedido: ${credentials.username}`);

          return {
            id: user._id.toString(),
            username: user.username,
            chips: user.chips || 1000,
            level: user.level || 1,
            xp: user.xp || 0,
          };
        } catch (error) {
          console.error("❌ Erro no authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.chips = user.chips;
        token.level = user.level;
        token.xp = user.xp;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username;
        session.user.chips = token.chips;
        session.user.level = token.level;
        session.user.xp = token.xp;
        session.user.id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
