"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Perfil, Fmt } from "@/lib/nito-motor";

interface MetricCardsProps {
  perfil?: Perfil | null;
  resumo?: {
    faturamento_centavos: number;
    pedidos_aprovados: number;
    ticket_medio_centavos: number;
  };
  daysRemaining?: number;
}

export function MetricCards({ perfil, resumo, daysRemaining }: MetricCardsProps) {
  const fat = resumo?.faturamento_centavos ?? 0;
  const ped = resumo?.pedidos_aprovados ?? 0;
  const tkt = resumo?.ticket_medio_centavos ?? 0;

  let dias = daysRemaining ?? 0;
  if (daysRemaining === undefined && perfil?.assinatura_expira_em) {
    const diff = new Date(perfil.assinatura_expira_em).getTime() - Date.now();
    dias = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const isSubActive = perfil?.assinatura_ativa ?? (dias > 0);

  const cards = [
    {
      id: "faturamento",
      title: "FATURAMENTO (30D)",
      value: Fmt.brl(fat),
      subtitle: "vendas acumuladas",
      icon: DollarSign,
    },
    {
      id: "pedidos",
      title: "PEDIDOS APROVADOS",
      value: String(ped),
      subtitle: "últimos 30 dias",
      icon: ShoppingBag,
    },
    {
      id: "ticket_medio",
      title: "TICKET MÉDIO",
      value: Fmt.brl(tkt),
      subtitle: "por pedido aprovado",
      icon: TrendingUp,
    },
    {
      id: "assinatura",
      title: "ASSINATURA",
      value: isSubActive ? `${dias} DIAS` : "INATIVA",
      subtitle: isSubActive ? "renovação automática" : "renove seu acesso",
      icon: isSubActive ? ShieldCheck : ShieldAlert,
      isAlert: !isSubActive,
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div key={card.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>{card.title}</span>
              <div
                style={{
                  ...styles.iconBox,
                  backgroundColor: card.isAlert ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  borderColor: card.isAlert ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)",
                }}
              >
                <Icon size={18} color={card.isAlert ? "#ef4444" : "#10b981"} />
              </div>
            </div>

            <div style={styles.cardValue}>{card.value}</div>

            <div style={styles.cardFooter}>
              <span style={styles.subtitle}>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.25rem",
    marginBottom: "1.75rem",
  },
  card: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#94a3b8",
    letterSpacing: "0.06em",
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    fontSize: "1.65rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "auto",
  },
  subtitle: {
    fontSize: "0.725rem",
    color: "#64748b",
  },
};
