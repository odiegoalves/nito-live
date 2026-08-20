"use client";

import React, { useState, useEffect } from "react";
import { Zap, Clock, ShoppingCart, MessageSquare, UserCheck } from "lucide-react";
import { Feed, Vendas, Chat, Fmt } from "@/lib/nito-motor";

interface EventItem {
  id: string;
  tipo: "venda" | "post" | "presenca";
  title: string;
  amount?: string;
  timeIso: string;
}

export function LiveEventsFeed() {
  const [eventos, setEventos] = useState<EventItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function carregarEventosIniciais() {
      setCarregando(true);
      try {
        const [posts, vendas] = await Promise.all([
          Feed.listar({ limite: 5 }).catch(() => []),
          Vendas.listar({ limite: 5 }).catch(() => []),
        ]);

        const evs: EventItem[] = [];

        posts.forEach((p) => {
          evs.push({
            id: `post-${p.id}`,
            tipo: "post",
            title: `Novo tópico de ${p.autor?.nome || "Membro"}`,
            amount: p.tipo === "print_ganho" ? "Print" : "Comunidade",
            timeIso: p.criado_em,
          });
        });

        vendas.forEach((v) => {
          evs.push({
            id: `venda-${v.id}`,
            tipo: "venda",
            title: `Venda TikTok Shop: ${v.produto || v.id_pedido}`,
            amount: Fmt.brl(v.valor_centavos),
            timeIso: v.ocorrido_em,
          });
        });

        evs.sort((a, b) => new Date(b.timeIso).getTime() - new Date(a.timeIso).getTime());

        if (mounted) {
          setEventos(evs.slice(0, 6));
        }
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarEventosIniciais();

    // Realtime Subscriptions
    const unsubFeed = Feed.assinar({
      onNovoPost: (p) => {
        if (!mounted) return;
        const novoEv: EventItem = {
          id: `post-${p.id}`,
          tipo: "post",
          title: `Novo tópico de ${p.autor?.nome || "Membro"}`,
          amount: p.tipo === "print_ganho" ? "Print" : "Comunidade",
          timeIso: p.criado_em,
        };
        setEventos((prev) => [novoEv, ...prev.filter((e) => e.id !== novoEv.id)].slice(0, 6));
      },
    });

    const unsubVendas = Vendas.assinar((v) => {
      if (!mounted || !v) return;
      const novoEv: EventItem = {
        id: `venda-${v.id}`,
        tipo: "venda",
        title: `Venda TikTok Shop: ${v.produto || v.id_pedido}`,
        amount: Fmt.brl(v.valor_centavos),
        timeIso: v.ocorrido_em,
      };
      setEventos((prev) => [novoEv, ...prev.filter((e) => e.id !== novoEv.id)].slice(0, 6));
    });

    const unsubChat = Chat.assinar("geral", {
      onOnline: (_, membros) => {
        if (!mounted || !membros.length) return;
        const ultimoEntrou = membros[membros.length - 1];
        if (ultimoEntrou?.nome) {
          const novoEv: EventItem = {
            id: `presenca-${ultimoEntrou.id || Math.random()}`,
            tipo: "presenca",
            title: `${ultimoEntrou.nome} entrou na plataforma`,
            amount: "Online",
            timeIso: new Date().toISOString(),
          };
          setEventos((prev) => [novoEv, ...prev.filter((e) => e.id !== novoEv.id)].slice(0, 6));
        }
      },
    });

    return () => {
      mounted = false;
      unsubFeed();
      unsubVendas();
      unsubChat.sair();
    };
  }, []);

  return (
    <div style={styles.card}>
      {/* Header com Indicador Ao Vivo */}
      <div style={styles.headerRow}>
        <div style={styles.titleGroup}>
          <Zap size={18} color="#ef4444" />
          <h2 style={styles.title}>ACONTECENDO AGORA</h2>
        </div>
        <div style={styles.liveBadge}>
          <span style={styles.pulseDot} />
          <span>AO VIVO</span>
        </div>
      </div>

      {/* Lista de eventos reais */}
      <div style={styles.eventsList}>
        {carregando ? (
          <div style={styles.emptyText}>Carregando eventos ao vivo...</div>
        ) : eventos.length === 0 ? (
          <div style={styles.emptyText}>Nenhum evento recente registrado.</div>
        ) : (
          eventos.map((event) => {
            const Icon =
              event.tipo === "venda"
                ? ShoppingCart
                : event.tipo === "post"
                ? MessageSquare
                : UserCheck;

            const iconColor =
              event.tipo === "venda"
                ? "#10b981"
                : event.tipo === "post"
                ? "#ef4444"
                : "#3b82f6";

            return (
              <div key={event.id} style={styles.eventItem}>
                <div style={{ ...styles.iconBox, borderColor: `${iconColor}40`, backgroundColor: `${iconColor}15` }}>
                  <Icon size={15} color={iconColor} />
                </div>
                <div style={styles.eventInfo}>
                  <span style={styles.eventTitle}>{event.title}</span>
                  <div style={styles.eventMeta}>
                    <Clock size={11} color="#64748b" />
                    <span style={styles.eventTime}>{Fmt.quando(event.timeIso)}</span>
                  </div>
                </div>
                {event.amount && (
                  <div style={{ ...styles.eventAmount, color: iconColor }}>{event.amount}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.5rem",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "0.85rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "0.04em",
    margin: 0,
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.675rem",
    fontWeight: 800,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: "0.25rem 0.6rem",
    borderRadius: "9999px",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    letterSpacing: "0.05em",
  },
  pulseDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    boxShadow: "0 0 8px #ef4444",
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    flex: 1,
  },
  emptyText: {
    fontSize: "0.825rem",
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: "2rem",
  },
  eventItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "0.75rem 0.85rem",
    borderRadius: "12px",
    transition: "border-color 0.2s",
  },
  iconBox: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: "0.75rem",
  },
  eventInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: "0.825rem",
    fontWeight: 700,
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  eventMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  eventTime: {
    fontSize: "0.7rem",
    color: "#94a3b8",
  },
  eventAmount: {
    fontSize: "0.8rem",
    fontWeight: 800,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: "0.2rem 0.5rem",
    borderRadius: "6px",
    marginLeft: "0.5rem",
    whiteSpace: "nowrap",
  },
};
