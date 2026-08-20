"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MetricCards } from "./MetricCards";
import { SalesChartCard } from "./SalesChartCard";
import { LiveEventsFeed } from "./LiveEventsFeed";
import { CommunityBanner } from "./CommunityBanner";
import { CommunityFooter } from "./CommunityFooter";
import { Perfil, Vendas } from "@/lib/nito-motor";

interface CommunityShellProps {
  perfil: Perfil;
  daysRemaining?: number;
}

export function CommunityShell({
  perfil,
  daysRemaining = 30,
}: CommunityShellProps) {
  const [resumo, setResumo] = useState({
    faturamento_centavos: 0,
    pedidos_aprovados: 0,
    ticket_medio_centavos: 0,
  });

  useEffect(() => {
    let mounted = true;
    Vendas.resumo(30)
      .then((res) => {
        if (mounted) setResumo(res);
      })
      .catch(() => {});

    const unsub = Vendas.assinar(() => {
      Vendas.resumo(30).then((res) => {
        if (mounted) setResumo(res);
      });
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Fixa à Esquerda */}
      <Sidebar activePath="/inicio-beta" perfil={perfil} />

      {/* Área de Conteúdo Principal */}
      <div style={styles.mainWrapper}>
        {/* Topbar com dados reais */}
        <Topbar perfil={perfil} />

        {/* Scrollable Content Body */}
        <div style={styles.contentBody}>
          {/* 4 Cards Principais de Métricas */}
          <MetricCards perfil={perfil} resumo={resumo} daysRemaining={daysRemaining} />

          {/* Grid do Gráfico + Feed "Acontecendo Agora" */}
          <div style={styles.dashboardGrid}>
            <div style={styles.chartColumn}>
              <SalesChartCard />
            </div>

            <div style={styles.liveColumn}>
              <LiveEventsFeed />
            </div>
          </div>

          {/* Banner Inferior de Assinatura Visual */}
          <CommunityBanner />

          {/* Footer */}
          <CommunityFooter />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#09090b",
    color: "#f8fafc",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  },
  mainWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflowX: "hidden",
  },
  contentBody: {
    flex: 1,
    padding: "1.75rem 2rem",
    display: "flex",
    flexDirection: "column",
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1.5rem",
    alignItems: "start",
    marginBottom: "0.5rem",
  },
  chartColumn: {
    gridColumn: "span 2",
    minWidth: 0,
  },
  liveColumn: {
    gridColumn: "span 1",
    minWidth: 0,
  },
};
