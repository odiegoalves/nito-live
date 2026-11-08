import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import "./globals.css";
import "./nito-ui.css";
import { ThemeProvider } from "@/context/ThemeContext";

// Fontes do site, carregadas do Google Fonts pelo navegador.
//
// Antes elas vinham do next/font/google, que baixa as fontes DURANTE o build.
// Em nov/2026 o build da Vercel (Next 16 + Turbopack) passou a falhar nesse
// passo ("Can't resolve '@vercel/turbopack-next/internal/font/google/font'"),
// e nenhum deploy novo subia. Carregando pelo navegador, o build nao depende
// mais disso.
//
// As variaveis --font-* continuam com o mesmo nome, entao o CSS do site nao
// muda:
//   --font-roboto       texto do site inteiro (mesma familia do YouTube)
//   --font-tiktok-sans  marca
//   --font-archivo      titulos do ecossistema de membros
//   --font-jetbrains    numeros, etiquetas e codigos
const FONTES_GOOGLE =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=JetBrains+Mono:wght@500;700;800&family=Roboto:wght@400;500;700;900&family=TikTok+Sans:wght@300..900&display=swap";

const VARIAVEIS_FONTES = `
:root{
  --font-roboto:'Roboto',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-tiktok-sans:'TikTok Sans','Roboto',system-ui,sans-serif;
  --font-archivo:'Archivo','Roboto',system-ui,sans-serif;
  --font-jetbrains:'JetBrains Mono',ui-monospace,'SFMono-Regular',Consolas,monospace;
}
body{font-family:var(--font-roboto)}
`;

export const metadata: Metadata = {
  title: "NITO LIVE — Portal do Cliente",
  description:
    "Portal Oficial do Cliente NITO LIVE — Automação de alta performance para TikTok Shop com autoproteção e inteligência comercial em tempo real.",
};

// Este layout envolve TODAS as rotas. Por isso ele nao consulta banco nem
// autenticacao: qualquer falha aqui derruba o site inteiro de uma vez.
// Cada area monta a propria navegacao:
//   - Ecossistema de membros -> components/nito/AppShell
//   - Login                  -> tela cheia, sem menu
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTES_GOOGLE} />
        <style dangerouslySetInnerHTML={{ __html: VARIAVEIS_FONTES }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
