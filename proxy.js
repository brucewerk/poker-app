// proxy.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const proxy = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const path = req.nextUrl.pathname;

    // 🔥 PÁGINAS PÚBLICAS - SEMPRE PERMITIR ACESSO
    const isPublicPage =
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/api/auth");

    if (isPublicPage) {
      return NextResponse.next();
    }

    // 🔥 Se NÃO estiver autenticado, redireciona para login
    if (!isAuth && !isPublicPage) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req?.nextUrl?.pathname || "";
        if (
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/api/auth")
        ) {
          return true;
        }
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
