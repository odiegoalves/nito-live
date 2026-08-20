import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const publicRoutes = [
    "/login",
    "/cadastro",
    "/auth/callback",
    "/landing",
    "/afiliados",
    "/api/webhook",
    "/download",
    "/downloads",
    "/ativar-liveinfinity",
    "/ativar-livecam",
    "/ativar"
  ];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isHome = request.nextUrl.pathname === "/";

  // Se não estiver logado e tentar acessar rota privada
  if (!user && !isPublicRoute && !isHome) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se estiver logado e tentar acessar login/cadastro
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/cadastro")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
