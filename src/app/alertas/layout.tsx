import React from "react";
import type { Metadata, Viewport } from "next";

// Metadados so desta rota. O layout raiz continua valendo para o site inteiro;
// aqui a gente so acrescenta o que transforma a pagina em aplicativo instalavel.
export const metadata: Metadata = {
  title: "NITO Alertas — vendas da sua live",
  description: "Acompanhe no celular, em tempo real, cada venda da sua live no TikTok Shop.",
  manifest: "/alertas/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NITO Alertas",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function LayoutAlertas({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
