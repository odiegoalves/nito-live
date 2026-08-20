"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { PostCard } from "@/components/community-beta/PostCard";
import { NewTopicModal } from "@/components/community-beta/NewTopicModal";
import { Feed, Post, Perfil, Fmt } from "@/lib/nito-motor";
import { MessageSquare, Plus, RefreshCw } from "lucide-react";

export default function DepoimentosPage() {
  return (
    <AuthGuard>
      {(perfil) => <DepoimentosContent perfil={perfil} />}
    </AuthGuard>
  );
}

function DepoimentosContent({ perfil }: { perfil: Perfil }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [minhasCurtidasSet, setMinhasCurtidasSet] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function carregarDepoimentos() {
      setCarregando(true);
      try {
        const data = await Feed.listar({ tipo: "depoimento" });
        if (mounted) {
          setPosts(data);
          if (data.length > 0) {
            const ids = data.map((p) => p.id);
            const curtidas = await Feed.minhasCurtidas(ids);
            setMinhasCurtidasSet(curtidas);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar depoimentos:", err);
      } finally {
        if (mounted) setCarregando(false);
      }
    }

    carregarDepoimentos();

    const unsub = Feed.assinar({
      onNovoPost: (novoPost) => {
        if (novoPost.tipo === "depoimento") {
          setPosts((prev) => [novoPost, ...prev]);
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
      onPostRemovido: (id) => {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      },
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleTogglePostLike = async (postId: string) => {
    const jaCurtiu = minhasCurtidasSet.has(postId);
    setMinhasCurtidasSet((prev) => {
      const copy = new Set(prev);
      if (jaCurtiu) copy.delete(postId);
      else copy.add(postId);
      return copy;
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              curtidas_count: jaCurtiu ? Math.max(0, p.curtidas_count - 1) : p.curtidas_count + 1,
            }
          : p
      )
    );

    try {
      await Feed.alternarCurtida(postId, jaCurtiu);
    } catch (err) {
      setMinhasCurtidasSet((prev) => {
        const copy = new Set(prev);
        if (jaCurtiu) copy.add(postId);
        else copy.delete(postId);
        return copy;
      });
    }
  };

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/depoimentos" perfil={perfil} />

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
                <h1 style={styles.pageTitle}>Depoimentos de Sucesso</h1>
                <p style={styles.pageSubtitle}>
                  Histórias reais de membros que transformaram suas lives com o Nito Live.
                </p>
              </div>
            </div>

            <button
              style={styles.newBtn}
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <Plus size={16} />
              <span>ENVIAR DEPOIMENTO</span>
            </button>
          </div>

          {carregando ? (
            <div style={styles.emptyCard}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: "0.5rem" }} />
              <span>Carregando depoimentos...</span>
            </div>
          ) : posts.length === 0 ? (
            <div style={styles.emptyCard}>
              Nenhum depoimento registrado ainda. Seja o primeiro a compartilhar sua história!
            </div>
          ) : (
            <div style={styles.postsList}>
              {posts.map((post) => {
                const autorNome = post.autor?.nome || post.autor?.username || "Membro";
                const postFormatted = {
                  id: post.id,
                  authorName: autorNome,
                  authorLevel: post.autor?.nivel ?? 1,
                  createdAt: Fmt.quando(post.criado_em),
                  category: "Depoimento",
                  categorySlug: "depoimento",
                  title: post.titulo || "Depoimento da Comunidade",
                  content: post.conteudo,
                  imageUrl: post.imagem_url || undefined,
                  likesCount: post.curtidas_count,
                  userLiked: minhasCurtidasSet.has(post.id),
                  commentsCount: post.comentarios_count,
                  viewsCount: 1,
                  comments: [],
                };

                return (
                  <PostCard
                    key={post.id}
                    post={postFormatted as any}
                    currentUserName={perfil.nome}
                    onTogglePostLike={handleTogglePostLike}
                    onAddComment={() => {}}
                    onToggleCommentLike={() => {}}
                  />
                );
              })}
            </div>
          )}

          <CommunityFooter />
        </div>
      </div>

      <NewTopicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await Feed.criar({ ...data, tipo: "depoimento" });
        }}
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
    maxWidth: "1100px",
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
  newBtn: {
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
  },
  emptyCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "3rem 2rem",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "0.95rem",
    marginBottom: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  postsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
};
