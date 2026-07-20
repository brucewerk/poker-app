// proxy.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Usa withAuth para garantir que o token esteja disponível
export const proxy = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register");

    // Se estiver na página de autenticação e já estiver logado, redireciona para home
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Se não estiver logado e tentar acessar página protegida, redireciona para login
    if (!isAuth && !isAuthPage) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => true,
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
