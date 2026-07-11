// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage =
      req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register";

    // Se está autenticado e tenta acessar login/register, redireciona para /
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Se não está autenticado e tenta acessar qualquer página (exceto login/register)
    if (!isAuthPage && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Permitir acesso a páginas de autenticação sem token
        return true;
      },
    },
  },
);

// Configurar quais rotas o middleware deve proteger
export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
