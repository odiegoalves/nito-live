import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { Roboto, TikTok_Sans, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./nito-ui.css";
import { ThemeProvider } from "@/context/ThemeContext";

// Texto do site inteiro. E a mesma familia que o YouTube usa na interface.
//
// Vai como VARIAVEL, nao so como classe: o CSS do ecossistema pedia a fonte
// pelo nome literal, e o Next entrega a fonte com um nome interno gerado. O
// navegador nao achava "Inter" e caia no Segoe UI — ou seja, a fonte que o
// site carregava nao era a que ele mostrava.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
});

const tiktokSans = TikTok_Sans({
  subsets: ["latin"],
  variable: "--font-tiktok-sans",
});

// Titulos do ecossistema de membros: mais encorpado que a fonte de texto.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-archivo",
});

// Numeros, etiquetas e codigos.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-jetbrains",
});

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
      <body
        className={`${roboto.className} ${roboto.variable} ${tiktokSans.variable} ${archivo.variable} ${jetbrains.variable}`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
