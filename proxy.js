// proxy.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Rotas públicas (não precisam de autenticação)
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Rotas da API (não precisam de autenticação via proxy)
  const isApiRoute = pathname.startsWith("/api");

  // Rotas de arquivos estáticos
  const isStaticRoute = /\.(png|svg|ico|jpg|jpeg|webp)$/.test(pathname);

  // Se for rota pública, API ou estática, permite acesso
  if (isPublicRoute || isApiRoute || isStaticRoute) {
    return NextResponse.next();
  }

  // Verificar autenticação
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Se não estiver autenticado, redireciona para login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se estiver autenticado, permite acesso
  return NextResponse.next();
}

// Configurar em quais rotas o proxy será executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /_vercel (Vercel internals)
     * 4. /favicon.ico, /robots.txt, /sitemap.xml (SEO)
     */
    "/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$).*)",
  ],
};
