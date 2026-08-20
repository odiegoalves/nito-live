"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { Feed, Chat, Vendas, Aulas, Post, MensagemChat, Aula, Fmt, Perfil } from "@/lib/nito-motor";
import { Home, MessageSquare, TrendingUp, BookOpen, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InicioPage() {
  return (
    <AuthGuard>
      {(perfil) => <InicioContent perfil={perfil} />}
    </AuthGuard>
  );
}

function InicioContent({ perfil }: { perfil: Perfil }) {
  const [ultimosPosts, setUltimosPosts] = useState<Post[]>([]);
  const [ultimasMensagens, setUltimasMensagens] = useState<MensagemChat[]>([]);
  const [resumoVendas, setResumoVendas] = useState({
    faturamento_centavos: 0,
    pedidos_aprovados: 0,
    ticket_medio_centavos: 0,
  });
  const [proximaAula, setProximaAula] = useState<Aula | null>(null);

  useEffect(() => {
    let mounted = true;

    async function carregarDashboard() {
      try {
        const [posts, chat, res, aulas] = await Promise.all([
          Feed.listar({ limite: 3 }),
          Chat.historico("geral", 3),
          Vendas.resumo(30).catch(() => ({ faturamento_centavos: 0, pedidos_aprovados: 0, ticket_medio_centavos: 0 })),
          Aulas.listar().catch(() => []),
        ]);

        if (mounted) {
          setUltimosPosts(posts);
          setUltimasMensagens(chat.slice(-3));
          setResumoVendas(res);
          setProximaAula(aulas[0] || null);
        }
      } catch (err) {
        console.error("Erro ao carregar início:", err);
      }
    }

    carregarDashboard();

    // Realtime Feed
    const unsubFeed = Feed.assinar({
      onNovoPost: (novoPost) => {
        setUltimosPosts((prev) => [novoPost, ...prev.slice(0, 2)]);
      },
    });

    // Realtime Chat
    const unsubChat = Chat.assinar("geral", {
      onMensagem: (novaMsg) => {
        setUltimasMensagens((prev) => [...prev.slice(1), novaMsg]);
      },
    });

    // Realtime Vendas
    const unsubVendas = Vendas.assinar(() => {
      Vendas.resumo(30).then((res) => {
        if (mounted) setResumoVendas(res);
      });
    });

    return () => {
      mounted = false;
      unsubFeed();
      unsubChat.sair();
      unsubVendas();
    };
  }, []);

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/inicio" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <Home size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Visão Geral NITO LIVE</h1>
                <p style={styles.pageSubtitle}>
                  Acompanhe em tempo real suas métricas, últimas publicações e comunidade.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Superiores (Resumo de Vendas) */}
          <div style={styles.resumoRow}>
            <div style={styles.resumoCard}>
              <div style={styles.resumoIconBox}>
                <TrendingUp size={20} color="#10b981" />
              </div>
              <div style={styles.resumoMeta}>
                <span style={styles.resumoTitle}>Faturamento (30d)</span>
                <span style={styles.resumoVal}>{Fmt.brl(resumoVendas.faturamento_centavos)}</span>
              </div>
            </div>

            <div style={styles.resumoCard}>
              <div style={styles.resumoIconBox}>
                <TrendingUp size={20} color="#3b82f6" />
              </div>
              <div style={styles.resumoMeta}>
                <span style={styles.resumoTitle}>Pedidos Aprovados</span>
                <span style={styles.resumoVal}>{resumoVendas.pedidos_aprovados}</span>
              </div>
            </div>

            <div style={styles.resumoCard}>
              <div style={styles.resumoIconBox}>
                <BookOpen size={20} color="#ef4444" />
              </div>
              <div style={styles.resumoMeta}>
                <span style={styles.resumoTitle}>Próxima Aula</span>
                <span style={styles.resumoValSimple}>
                  {proximaAula ? proximaAula.titulo : "Nenhuma aula"}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Principal */}
          <div style={styles.mainGrid}>
            {/* Coluna 1: Últimas Publicações da Comunidade */}
            <div style={styles.gridCard}>
              <div style={styles.cardHeaderRow}>
                <div style={styles.cardTitleGroup}>
                  <MessageSquare size={18} color="#ef4444" />
                  <h2 style={styles.cardTitle}>Últimos Tópicos na Comunidade</h2>
                </div>
                <Link href="/comunidade" style={styles.linkVerMais}>
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>

              <div style={styles.itemsList}>
                {ultimosPosts.length === 0 ? (
                  <div style={styles.emptyText}>Nenhum tópico publicado ainda.</div>
                ) : (
                  ultimosPosts.map((post) => (
                    <div key={post.id} style={styles.postItemRow}>
                      <span style={styles.postItemTitle}>{post.titulo || post.conteudo}</span>
                      <span style={styles.postItemMeta}>
                        {post.autor?.nome || "Membro"} • {Fmt.quando(post.criado_em)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 2: Últimas Mensagens do Chat */}
            <div style={styles.gridCard}>
              <div style={styles.cardHeaderRow}>
                <div style={styles.cardTitleGroup}>
                  <MessageCircle size={18} color="#ef4444" />
                  <h2 style={styles.cardTitle}>Mensagens Recentes do Chat</h2>
                </div>
                <Link href="/comunidade" style={styles.linkVerMais}>
                  Abrir Chat <ArrowRight size={14} />
                </Link>
              </div>

              <div style={styles.itemsList}>
                {ultimasMensagens.length === 0 ? (
                  <div style={styles.emptyText}>Nenhuma mensagem no chat ainda.</div>
                ) : (
                  ultimasMensagens.map((msg) => (
                    <div key={msg.id} style={styles.chatMsgRow}>
                      <span style={styles.chatAutor}>{msg.autor?.nome || "Membro"}:</span>
                      <span style={styles.chatText}>{msg.conteudo}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
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
  resumoRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
  resumoCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  resumoIconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#09090b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resumoMeta: {
    display: "flex",
    flexDirection: "column",
  },
  resumoTitle: {
    fontSize: "0.775rem",
    color: "#94a3b8",
    fontWeight: 600,
  },
  resumoVal: {
    fontSize: "1.35rem",
    fontWeight: 900,
    color: "#ffffff",
  },
  resumoValSimple: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "1.75rem",
    marginBottom: "2rem",
  },
  gridCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  cardTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  cardTitle: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
  },
  linkVerMais: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    color: "#ef4444",
    fontSize: "0.8rem",
    fontWeight: 700,
    textDecoration: "none",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  emptyText: {
    fontSize: "0.825rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  postItemRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    backgroundColor: "#09090b",
    padding: "0.75rem",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },
  postItemTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  postItemMeta: {
    fontSize: "0.7rem",
    color: "#64748b",
  },
  chatMsgRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.4rem",
    backgroundColor: "#09090b",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
  },
  chatAutor: {
    fontWeight: 800,
    color: "#ef4444",
    flexShrink: 0,
  },
  chatText: {
    color: "#cbd5e1",
    wordBreak: "break-word",
  },
};
