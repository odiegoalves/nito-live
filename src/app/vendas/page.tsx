"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { Vendas, Venda, Fmt, Perfil } from "@/lib/nito-motor";
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, RefreshCw } from "lucide-react";

export default function VendasPage() {
  return (
    <AuthGuard>
      {(perfil) => <VendasContent perfil={perfil} />}
    </AuthGuard>
  );
}

function VendasContent({ perfil }: { perfil: Perfil }) {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [resumo, setResumo] = useState({
    faturamento_centavos: 0,
    pedidos_aprovados: 0,
    ticket_medio_centavos: 0,
  });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregarResumo = async () => {
    try {
      const res = await Vendas.resumo(30);
      setResumo(res);
    } catch (err) {
      console.error("Erro ao carregar resumo de vendas:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function carregarVendas() {
      setCarregando(true);
      try {
        const [lista, res] = await Promise.all([Vendas.listar(), Vendas.resumo(30)]);
        if (mounted) {
          setVendas(lista);
          setResumo(res);
        }
      } catch (err) {
        console.error("Erro ao carregar vendas:", err);
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarVendas();

    // Assinatura Realtime
    const unsub = Vendas.assinar((novaVenda) => {
      if (!mounted) return;
      if (novaVenda) {
        setVendas((prev) => [novaVenda, ...prev.filter((v) => v.id !== novaVenda.id)]);
        setHighlightId(novaVenda.id);
        recarregarResumo();

        setTimeout(() => {
          if (mounted) setHighlightId(null);
        }, 3000);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/vendas" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <TrendingUp size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Minhas Vendas (TikTok Shop)</h1>
                <p style={styles.pageSubtitle}>
                  Vendas capturadas em tempo real pela extensão NITO LIVE.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Superiores */}
          <div style={styles.cardsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Faturamento (30 dias)</span>
                <DollarSign size={20} color="#10b981" />
              </div>
              <div style={styles.cardValue}>{Fmt.brl(resumo.faturamento_centavos)}</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Pedidos Aprovados</span>
                <ShoppingBag size={20} color="#3b82f6" />
              </div>
              <div style={styles.cardValue}>{resumo.pedidos_aprovados}</div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Ticket Médio</span>
                <CreditCard size={20} color="#ef4444" />
              </div>
              <div style={styles.cardValue}>{Fmt.brl(resumo.ticket_medio_centavos)}</div>
            </div>
          </div>

          {/* Tabela de Vendas */}
          <div style={styles.tableCard}>
            <h2 style={styles.tableTitle}>Histórico de Vendas</h2>

            {carregando ? (
              <div style={styles.emptyBox}>
                <RefreshCw size={24} className="spin" style={{ marginBottom: "0.5rem" }} />
                <span>Carregando registro de vendas...</span>
              </div>
            ) : vendas.length === 0 ? (
              <div style={styles.emptyBox}>
                Nenhuma venda registrada ainda. Conecte a extensão NITO LIVE.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID Pedido</th>
                      <th style={styles.th}>Produto</th>
                      <th style={styles.th}>Origem</th>
                      <th style={styles.th}>Valor</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda) => {
                      const isHighlighted = venda.id === highlightId;

                      return (
                        <tr
                          key={venda.id}
                          style={{
                            ...styles.tr,
                            ...(isHighlighted ? styles.trHighlight : {}),
                          }}
                        >
                          <td style={styles.tdId}>{venda.id_pedido}</td>
                          <td style={styles.td}>{venda.produto || "Produto não identificado"}</td>
                          <td style={styles.td}>{venda.origem}</td>
                          <td style={styles.tdValor}>{Fmt.brl(venda.valor_centavos)}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                backgroundColor:
                                  venda.status === "aprovado"
                                    ? "rgba(16, 185, 129, 0.12)"
                                    : "rgba(239, 68, 68, 0.12)",
                                color: venda.status === "aprovado" ? "#10b981" : "#ef4444",
                              }}
                            >
                              {venda.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.tdData}>{Fmt.quando(venda.ocorrido_em)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
    maxWidth: "1340px",
    width: "100%",
    margin: "0 auto",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  headerIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#ffffff",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: 0,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
  metricCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: "0.825rem",
    color: "#94a3b8",
    fontWeight: 600,
  },
  cardValue: {
    fontSize: "1.6rem",
    fontWeight: 900,
    color: "#ffffff",
  },
  tableCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  tableTitle: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "1.25rem",
    margin: 0,
  },
  emptyBox: {
    padding: "3rem",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.95rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#94a3b8",
    fontSize: "0.775rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tr: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    transition: "background-color 0.3s ease",
  },
  trHighlight: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  td: {
    padding: "0.85rem 1rem",
    fontSize: "0.85rem",
    color: "#e2e8f0",
  },
  tdId: {
    padding: "0.85rem 1rem",
    fontSize: "0.8rem",
    fontFamily: "monospace",
    color: "#ef4444",
    fontWeight: 700,
  },
  tdValor: {
    padding: "0.85rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 800,
    color: "#10b981",
  },
  statusBadge: {
    fontSize: "0.7rem",
    fontWeight: 800,
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
  },
  tdData: {
    padding: "0.85rem 1rem",
    fontSize: "0.8rem",
    color: "#64748b",
  },
};
