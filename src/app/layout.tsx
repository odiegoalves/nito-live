import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Inter, TikTok_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });
const tiktokSans = TikTok_Sans({
  subsets: ["latin"],
  variable: "--font-tiktok-sans",
});

export const metadata: Metadata = {
  title: "NITO LIVE — Portal do Cliente",
  description:
    "Portal Oficial do Cliente NITO LIVE — Automação de alta performance para TikTok Shop com autoproteção e inteligência comercial em tempo real.",
};

// Este layout envolve TODAS as rotas. Por isso ele nao consulta banco nem
// autenticacao: qualquer falha aqui derruba o site inteiro de uma vez.
// Cada area monta a propria navegacao:
//   - Comunidade  -> components/community-beta/Sidebar
//   - Login       -> tela cheia, sem menu
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${tiktokSans.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
