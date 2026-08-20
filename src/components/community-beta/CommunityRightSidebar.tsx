"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, Send, AlertCircle, MessageSquare } from "lucide-react";
import { Chat, MensagemChat, Perfil } from "@/lib/nito-motor";

interface CommunityRightSidebarProps {
  perfil?: Perfil | null;
}

export function CommunityRightSidebar({ perfil }: CommunityRightSidebarProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [onlineMembers, setOnlineMembers] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [textoInput, setTextoInput] = useState("");
  const [erroChat, setErroChat] = useState<string | null>(null);
  const [digitandoNome, setDigitandoNome] = useState<string | null>(null);
  const [novasMensagensBadge, setNovasMensagensBadge] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastTypingTriggerRef = useRef<number>(0);
  const digitandoTimeoutRef = useRef<any>(null);
  const chatSubscriptionRef = useRef<{ digitando: (n: string) => void; sair: () => void } | null>(null);

  const isAtBottom = () => {
    if (!chatBoxRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatBoxRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNovasMensagensBadge(false);
  };

  useEffect(() => {
    let mounted = true;

    // Load initial chat history
    Chat.historico("geral")
      .then((history) => {
        if (mounted) {
          setMensagens(history);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView();
          }, 100);
        }
      })
      .catch((err) => console.error("Erro ao carregar histórico do chat:", err));

    // Subscribe to chat and presence
    const sub = Chat.assinar(
      "geral",
      {
        onMensagem: (novaMsg) => {
          if (!mounted) return;
          const wasBottom = isAtBottom();
          setMensagens((prev) => [...prev, novaMsg]);

          if (wasBottom) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          } else {
            setNovasMensagensBadge(true);
          }
        },

        onOnline: (qtd, membros) => {
          if (!mounted) return;
          setOnlineCount(qtd);
          setOnlineMembers(membros);
        },

        onDigitando: (payload) => {
          if (!mounted) return;
          if (payload?.nome && payload.nome !== perfil?.nome) {
            setDigitandoNome(payload.nome);
            if (digitandoTimeoutRef.current) clearTimeout(digitandoTimeoutRef.current);
            digitandoTimeoutRef.current = setTimeout(() => {
              if (mounted) setDigitandoNome(null);
            }, 3000);
          }
        },
      },
      perfil ?? null
    );

    chatSubscriptionRef.current = sub;

    return () => {
      mounted = false;
      if (digitandoTimeoutRef.current) clearTimeout(digitandoTimeoutRef.current);
      sub.sair();
    };
  }, [perfil]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextoInput(e.target.value);
    setErroChat(null);

    const now = Date.now();
    if (now - lastTypingTriggerRef.current > 1500) {
      lastTypingTriggerRef.current = now;
      if (perfil?.nome && chatSubscriptionRef.current) {
        chatSubscriptionRef.current.digitando(perfil.nome);
      }
    }
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoInput.trim()) return;

    const msg = textoInput;
    setTextoInput("");
    setErroChat(null);

    try {
      await Chat.enviar(msg, "geral");
    } catch (err: any) {
      setErroChat(err?.message || "Erro ao enviar mensagem.");
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. ONLINE AGORA (PRESENÇA REAL) */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.titleGroup}>
            <Users size={16} color="#ef4444" />
            <h3 style={styles.cardTitle}>ONLINE AGORA</h3>
          </div>
          <span style={styles.countBadge}>{onlineCount}</span>
        </div>

        <div style={styles.usersList}>
          {onlineMembers.length === 0 ? (
            <span style={styles.emptyText}>Conectando presenças...</span>
          ) : (
            onlineMembers.map((m, idx) => (
              <div key={m.id || idx} style={styles.userRow}>
                <div style={styles.avatarBox}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.nome} style={styles.avatarImg} />
                  ) : (
                    (m.nome || "M").charAt(0).toUpperCase()
                  )}
                  <span style={styles.onlineDot} />
                </div>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>{m.nome || "Membro"}</span>
                  <span style={styles.onlineText}>Online</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. CHAT AO VIVO */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.titleGroup}>
            <MessageSquare size={16} color="#ef4444" />
            <h3 style={styles.cardTitle}>CHAT AO VIVO</h3>
          </div>
        </div>

        {/* Mensagens Box */}
        <div ref={chatBoxRef} style={styles.chatBox}>
          {mensagens.length === 0 ? (
            <div style={styles.emptyChat}>Seja o primeiro a enviar uma mensagem no chat!</div>
          ) : (
            mensagens.map((msg) => {
              const autorNome = msg.autor?.nome || msg.autor?.username || "Membro";
              const initial = autorNome.charAt(0).toUpperCase();

              return (
                <div key={msg.id} style={styles.msgRow}>
                  <div style={styles.msgAvatar}>
                    {msg.autor?.avatar_url ? (
                      <img src={msg.autor.avatar_url} alt={autorNome} style={styles.avatarImg} />
                    ) : (
                      initial
                    )}
                  </div>
                  <div style={styles.msgBody}>
                    <div style={styles.msgHeader}>
                      <span style={styles.msgAutor}>{autorNome}</span>
                      <span style={styles.msgTime}>
                        {new Date(msg.criado_em).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p style={styles.msgText}>{msg.conteudo}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Notice of Digitando / Novas Mensagens */}
        {digitandoNome && (
          <div style={styles.digitandoBar}>
            <span>{digitandoNome} está digitando...</span>
          </div>
        )}

        {novasMensagensBadge && (
          <button type="button" onClick={scrollToBottom} style={styles.badgeBtn}>
            Novas mensagens ↓
          </button>
        )}

        {erroChat && (
          <div style={styles.erroBar}>
            <AlertCircle size={14} color="#f87171" />
            <span>{erroChat}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleEnviar} style={styles.inputForm}>
          <input
            type="text"
            placeholder="Digite no chat..."
            value={textoInput}
            onChange={handleInputChange}
            style={styles.chatInput}
          />
          <button type="submit" style={styles.sendBtn}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    width: "100%",
  },
  card: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.25rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
  },
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "0.04em",
    margin: 0,
  },
  countBadge: {
    fontSize: "0.7rem",
    fontWeight: 800,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: "0.15rem 0.45rem",
    borderRadius: "999px",
  },
  usersList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    maxHeight: "160px",
    overflowY: "auto",
  },
  emptyText: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
  },
  avatarBox: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: "8px",
    height: "8px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    border: "1px solid #121215",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.05rem",
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: "0.775rem",
    fontWeight: 700,
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  onlineText: {
    fontSize: "0.65rem",
    color: "#10b981",
    fontWeight: 600,
  },
  chatBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    height: "280px",
    overflowY: "auto",
    paddingRight: "0.25rem",
  },
  emptyChat: {
    fontSize: "0.775rem",
    color: "#64748b",
    textAlign: "center",
    marginTop: "2rem",
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  msgAvatar: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "#fff",
    fontSize: "0.7rem",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  msgBody: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#09090b",
    padding: "0.45rem 0.65rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    flex: 1,
  },
  msgHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.15rem",
  },
  msgAutor: {
    fontSize: "0.725rem",
    fontWeight: 700,
    color: "#ef4444",
  },
  msgTime: {
    fontSize: "0.625rem",
    color: "#64748b",
  },
  msgText: {
    fontSize: "0.775rem",
    color: "#e2e8f0",
    margin: 0,
    wordBreak: "break-word",
    lineHeight: 1.35,
  },
  digitandoBar: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    fontStyle: "italic",
    padding: "0.2rem 0.4rem",
  },
  badgeBtn: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.35rem 0.65rem",
    borderRadius: "6px",
    fontSize: "0.7rem",
    fontWeight: 700,
    cursor: "pointer",
    alignSelf: "center",
  },
  erroBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.725rem",
    color: "#f87171",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: "0.35rem 0.5rem",
    borderRadius: "6px",
  },
  inputForm: {
    display: "flex",
    gap: "0.4rem",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    color: "#ffffff",
    fontSize: "0.8rem",
    outline: "none",
  },
  sendBtn: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
