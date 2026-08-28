"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommunityFooter } from "./CommunityFooter";
import { CommunityRightSidebar } from "./CommunityRightSidebar";
import { PostCard } from "./PostCard";
import { NewTopicModal } from "./NewTopicModal";
import { Feed, Post, Comentario, Perfil, Fmt } from "@/lib/nito-motor";
import { Plus, MessageSquare, ArrowUp, RefreshCw } from "lucide-react";

interface CommunityPageContentProps {
  perfil: Perfil;
}

export function CommunityPageContent({ perfil }: CommunityPageContentProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [minhasCurtidasSet, setMinhasCurtidasSet] = useState<Set<string>>(new Set());
  const [comentariosMap, setComentariosMap] = useState<Record<string, Comentario[]>>({});
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novasPublicacoesCount, setNovasPublicacoesCount] = useState(0);
  const [novosPostsFila, setNovosPostsFila] = useState<Post[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [temMais, setTemMais] = useState(true);

  const observerTargetRef = useRef<HTMLDivElement>(null);

  // Carregar posts iniciais
  const carregarPostsIniciais = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const data = await Feed.listar({ tipo: selectedTipo, limite: 15 });
      setPosts(data);
      setTemMais(data.length === 15);

      if (data.length > 0) {
        const ids = data.map((p) => p.id);
        const curtidas = await Feed.minhasCurtidas(ids);
        setMinhasCurtidasSet(curtidas);
      }
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    } finally {
      setLoadingInitial(false);
    }
  }, [selectedTipo]);

  useEffect(() => {
    carregarPostsIniciais();
  }, [carregarPostsIniciais]);

  // Realtime Feed Subscription
  useEffect(() => {
    const unsub = Feed.assinar({
      onNovoPost: (novoPost) => {
        // Se for criado pelo próprio usuário, insere no topo na hora
        if (novoPost.autor_id === perfil.id) {
          setPosts((prev) => [novoPost, ...prev]);
        } else {
          // Se for outra pessoa: verifica scroll
          const scrolled = window.scrollY > 300;
          if (scrolled) {
            setNovosPostsFila((prev) => [novoPost, ...prev]);
            setNovasPublicacoesCount((c) => c + 1);
          } else {
            setPosts((prev) => [novoPost, ...prev]);
          }
        }
      },

      onContadores: (postAtualizado) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postAtualizado.id
              ? {
                  ...p,
                  curtidas_count: postAtualizado.curtidas_count ?? p.curtidas_count,
                  comentarios_count: postAtualizado.comentarios_count ?? p.comentarios_count,
                }
              : p
          )
        );
      },

      onPostRemovido: (idRemovido) => {
        setPosts((prev) => prev.filter((p) => p.id !== idRemovido));
      },

      onNovoComentario: (novoComentario) => {
        const postId = (novoComentario as any).post_id;
        if (postId && comentariosMap[postId]) {
          setComentariosMap((prev) => ({
            ...prev,
            [postId]: [...(prev[postId] || []), novoComentario],
          }));
        }
      },
    });

    return () => {
      unsub();
    };
  }, [perfil.id, comentariosMap]);

  // Carregar mais posts (Scroll Infinito)
  const carregarMais = async () => {
    if (loadingMore || !temMais || posts.length === 0) return;
    setLoadingMore(true);
    const ultimo = posts[posts.length - 1];

    try {
      const novos = await Feed.listar({
        tipo: selectedTipo,
        limite: 15,
        antesDe: ultimo.criado_em,
      });

      if (novos.length < 15) {
        setTemMais(false);
      }

      if (novos.length > 0) {
        const ids = novos.map((p) => p.id);
        const curtidasNovas = await Feed.minhasCurtidas(ids);

        setPosts((prev) => [...prev, ...novos]);
        setMinhasCurtidasSet((prev) => {
          const res = new Set(prev);
          curtidasNovas.forEach((id) => res.add(id));
          return res;
        });
      }
    } catch (err) {
      console.error("Erro ao carregar mais posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // IntersectionObserver para scroll infinito
  useEffect(() => {
    const el = observerTargetRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && temMais && !loadingMore && !loadingInitial) {
          carregarMais();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [temMais, loadingMore, loadingInitial, posts]);

  // Aplicar fila de novos posts ao clicar na pílula
  const handleAplicarNovosPosts = () => {
    setPosts((prev) => [...novosPostsFila, ...prev]);
    setNovosPostsFila([]);
    setNovasPublicacoesCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Criar Tópico
  const handleCreateTopic = async (topicData: {
    title?: string;
    conteudo: string;
    imagemFile?: File | null;
    tipo?: "texto" | "print_ganho" | "depoimento";
  }) => {
    await Feed.criar(topicData);
  };

  // Alternar Curtida
  const handleTogglePostLike = async (postId: string) => {
    const jaCurtiu = minhasCurtidasSet.has(postId);

    // Otimista
    setMinhasCurtidasSet((prev) => {
      const copy = new Set(prev);
      if (jaCurtiu) copy.delete(postId);
      else copy.add(postId);
      return copy;
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            curtidas_count: jaCurtiu ? Math.max(0, p.curtidas_count - 1) : p.curtidas_count + 1,
          };
        }
        return p;
      })
    );

    try {
      await Feed.alternarCurtida(postId, jaCurtiu);
    } catch (err) {
      // Reverter se der erro
      setMinhasCurtidasSet((prev) => {
        const copy = new Set(prev);
        if (jaCurtiu) copy.add(postId);
        else copy.delete(postId);
        return copy;
      });
    }
  };

  // Carregar/Abrir Comentários
  const handleToggleComments = async (postId: string) => {
    if (!comentariosMap[postId]) {
      try {
        const list = await Feed.comentarios(postId);
        setComentariosMap((prev) => ({ ...prev, [postId]: list }));
      } catch (err) {
        console.error("Erro ao carregar comentários:", err);
      }
    }
  };

  // Adicionar Comentário
  const handleAddComment = async (postId: string, commentText: string) => {
    try {
      const novoComentario = await Feed.comentar(postId, commentText);
      setComentariosMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), novoComentario],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comentarios_count: p.comentarios_count + 1 } : p))
      );
    } catch (err) {
      console.error("Erro ao comentar:", err);
    }
  };

  const categories = [
    { label: "Todos os tópicos", tipo: null },
    { label: "Prints de Ganhos", tipo: "print_ganho" },
    { label: "Depoimentos", tipo: "depoimento" },
    { label: "Discussões", tipo: "texto" },
  ];

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/comunidade" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <MessageSquare size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Comunidade NITO LIVE</h1>
                <p style={styles.pageSubtitle}>
                  Conteúdo, troca de experiências e estratégias para você vender mais!
                </p>
              </div>
            </div>
          </div>

          {/* Categorias + Botão NOVO TÓPICO */}
          <div style={styles.categoriesHeaderRow}>
            <div style={styles.categoriesBar}>
              {categories.map((cat) => {
                const isSelected = cat.tipo === selectedTipo;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setSelectedTipo(cat.tipo)}
                    style={{
                      ...styles.catBtn,
                      ...(isSelected ? styles.catBtnActive : {}),
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              style={styles.newTopicBtn}
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <Plus size={16} />
              <span>+ NOVO TÓPICO</span>
            </button>
          </div>

          {/* Pílula de Novas Publicações (Padrão Twitter/Instagram) */}
          {novasPublicacoesCount > 0 && (
            <button
              onClick={handleAplicarNovosPosts}
              style={styles.newPostsPill}
              type="button"
            >
              <ArrowUp size={16} />
              <span>
                {novasPublicacoesCount}{" "}
                {novasPublicacoesCount === 1 ? "nova publicação" : "novas publicações"}
              </span>
            </button>
          )}

          {/* Grid Principal (Feed Central + Sidebar de Chat & Presença) */}
          <div style={styles.communityGrid}>
            <div style={styles.feedColumn}>
              {loadingInitial ? (
                <div style={styles.emptyFeedCard}>
                  <RefreshCw size={24} className="spin" style={{ marginBottom: "0.5rem" }} />
                  <span>Carregando publicações da comunidade...</span>
                </div>
              ) : posts.length === 0 ? (
                <div style={styles.emptyFeedCard}>
                  Seja o primeiro a postar na comunidade.
                </div>
              ) : (
                posts.map((post) => {
                  const autorNome = post.autor?.nome || post.autor?.username || "Membro";
                  const postFormatted = {
                    id: post.id,
                    authorName: autorNome,
                    authorLevel: post.autor?.nivel ?? 1,
                    createdAt: Fmt.quando(post.criado_em),
                    category:
                      post.tipo === "print_ganho"
                        ? "Print de Ganho"
                        : post.tipo === "depoimento"
                        ? "Depoimento"
                        : "Discussão",
                    categorySlug: post.tipo as any,
                    title: post.titulo || "Publicação da Comunidade",
                    content: post.conteudo,
                    imageUrl: post.imagem_url || undefined,
                    likesCount: post.curtidas_count,
                    userLiked: minhasCurtidasSet.has(post.id),
                    commentsCount: post.comentarios_count,
                    viewsCount: 1,
                    comments: (comentariosMap[post.id] || []).map((c) => ({
                      id: c.id,
                      authorName: c.autor?.nome || c.autor?.username || "Membro",
                      authorLevel: c.autor?.nivel ?? 1,
                      createdAt: Fmt.quando(c.criado_em),
                      content: c.conteudo,
                      likesCount: 0,
                    })),
                  };

                  return (
                    <PostCard
                      key={post.id}
                      post={postFormatted as any}
                      currentUserName={perfil.nome}
                      onTogglePostLike={handleTogglePostLike}
                      onAddComment={handleAddComment}
                      onToggleCommentLike={() => {}}
                    />
                  );
                })
              )}

              {/* Target Element for Infinite Scroll */}
              <div ref={observerTargetRef} style={{ height: "20px", marginTop: "1rem" }}>
                {loadingMore && (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                    Carregando mais publicações...
                  </div>
                )}
              </div>
            </div>

            <div style={styles.rightSidebarColumn}>
              <CommunityRightSidebar perfil={perfil} />
            </div>
          </div>

          <CommunityFooter />
        </div>
      </div>

      <NewTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTopic}
      />
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
    marginBottom: "1.25rem",
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
    boxShadow: "0 0 15px rgba(239, 68, 68, 0.2)",
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
  categoriesHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "1.75rem",
    flexWrap: "wrap",
  },
  categoriesBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    backgroundColor: "#121215",
    padding: "0.4rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    overflowX: "auto",
    maxWidth: "100%",
  },
  catBtn: {
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "none",
    padding: "0.5rem 0.95rem",
    borderRadius: "8px",
    fontSize: "0.825rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  catBtnActive: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: 700,
    boxShadow: "0 0 12px rgba(239, 68, 68, 0.4)",
  },
  newTopicBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.65rem 1.25rem",
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: "0.825rem",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
    letterSpacing: "0.03em",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  newPostsPill: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.6rem 1.25rem",
    borderRadius: "9999px",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    margin: "0 auto 1.5rem auto",
    boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
  },
  communityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "1.75rem",
    alignItems: "start",
    marginBottom: "2rem",
    width: "100%",
  },
  feedColumn: {
    minWidth: 0,
  },
  rightSidebarColumn: {
    minWidth: 0,
    width: "100%",
  },
  emptyFeedCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "3rem 2rem",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.95rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
};
