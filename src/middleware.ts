import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PUBLICAS = [
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
  "/ativar",
];

async function proteger(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Variaveis ausentes no build. NEXT_PUBLIC_SUPABASE_URL=" +
        (url ? "ok" : "VAZIA") +
        " NEXT_PUBLIC_SUPABASE_ANON_KEY=" +
        (key ? "ok" : "VAZIA")
    );
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const ehPublica = ROTAS_PUBLICAS.some((r) => caminho.startsWith(r));
  const ehHome = caminho === "/";

  if (!user && !ehPublica && !ehHome) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (caminho === "/login" || caminho === "/cadastro")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  try {
    return await proteger(request);
  } catch (erro) {
    // NUNCA derrubar o site inteiro por causa do middleware.
    // Registra o motivo real nos Runtime Logs e deixa a pagina abrir.
    // O AuthGuard continua bloqueando o conteudo no lado do navegador.
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.error("[MIDDLEWARE] falhou em " + request.nextUrl.pathname + " -> " + msg);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|html|zip|mp3)$).*)",
  ],
};
