import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PUBLICAS = [
  // O aparelho pede estes dois ANTES de qualquer login, para conseguir
  // instalar o app de alertas na tela de inicio. Nenhum dos dois contem dado
  // de cliente - a pagina /alertas continua protegida normalmente.
  "/nito-alertas-sw.js",
  "/alertas/manifest.webmanifest",
  "/login",
  "/cadastro",
  "/criar-conta",
  "/recuperar-senha",
  "/auth/callback",
  "/landing",
  "/afiliados",
  "/api/webhook",
  // A extensao instalada pergunta por aqui qual e a versao publicada. Nao ha
  // login envolvido: quem pergunta e um programa, e a resposta e so o numero
  // da versao e a nota do que mudou.
  "/api/versao",
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

  const telasDeAcesso = ["/login", "/cadastro", "/criar-conta", "/recuperar-senha"];
  if (user && telasDeAcesso.includes(caminho)) {
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
