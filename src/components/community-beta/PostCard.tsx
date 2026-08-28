"use client";

import React, { useState } from "react";
import {
  Heart,
  MessageSquare,
  Eye,
  MoreVertical,
  Send,
  Award,
  Clock,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";
import { PostItem, CommentItem } from "@/lib/nito-motor";

interface PostCardProps {
  post: PostItem;
  currentUserName: string;
  currentUserId?: string;
  isModerator?: boolean;
  onTogglePostLike: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string, dados: { titulo?: string | null; conteudo: string }) => void;
}

export function PostCard({
  post,
  currentUserName,
  currentUserId,
  isModerator,
  onTogglePostLike,
  onAddComment,
  onToggleCommentLike,
  onDeletePost,
  onEditPost,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);

  const authorInitial = (post.authorName || "U").charAt(0).toUpperCase();

  // Só o dono do tópico ou moderador/fundador pode editar/excluir — nunca
  // qualquer membro da comunidade.
  const podeGerenciar =
    !!currentUserId && (post.authorId === currentUserId || !!isModerator);

  const handleStartEdit = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onEditPost?.(post.id, { titulo: editTitle || null, conteudo: editContent.trim() });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm("Tem certeza que quer excluir este tópico? Essa ação não pode ser desfeita.")) {
      onDeletePost?.(post.id);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(post.id, newCommentText.trim());
    setNewCommentText("");
  };

  return (
    <article style={styles.card}>
      {/* Top Header: Autor, Categoria e Menu 3 pontos */}
      <div style={styles.cardHeader}>
        <div style={styles.authorGroup}>
          <div style={styles.avatar}>{authorInitial}</div>
          <div style={styles.authorMeta}>
            <div style={styles.authorNameRow}>
              <span style={styles.authorName}>{post.authorName}</span>
              <span style={styles.levelBadge}>
                <Award size={10} color="#ef4444" />
                LV.{post.authorLevel}
              </span>
            </div>
            <div style={styles.subMeta}>
              <Clock size={11} color="#64748b" />
              <span>{post.createdAt}</span>
              <span style={styles.dotSeparator}>•</span>
              <span style={styles.categoryTag}>{post.category}</span>
            </div>
          </div>
        </div>

        {/* Menu de 3 Pontos */}
        <div style={styles.menuContainer}>
          <button
            style={styles.iconBtn}
            onClick={() => setShowMenu(!showMenu)}
            type="button"
          >
            <MoreVertical size={18} color="#94a3b8" />
          </button>

          {showMenu && (
            <div style={styles.dropdownMenu}>
              <button
                style={styles.menuItem}
                onClick={() => {
                  alert("Tópico reportado para a moderação.");
                  setShowMenu(false);
                }}
              >
                <Flag size={14} color="#f59e0b" />
                <span>Denunciar Tópico</span>
              </button>
              {podeGerenciar && (
                <>
                  <button style={styles.menuItem} onClick={handleStartEdit}>
                    <Edit size={14} color="#94a3b8" />
                    <span>Editar Tópico</span>
                  </button>
                  <button style={styles.menuItem} onClick={handleDelete}>
                    <Trash2 size={14} color="#ef4444" />
                    <span>Excluir Tópico</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo do Tópico */}
      <div style={styles.cardBody}>
        {isEditing ? (
          <div style={styles.editForm}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título (opcional)"
              style={styles.editTitleInput}
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Conteúdo do tópico"
              style={styles.editContentInput}
              rows={4}
            />
            <div style={styles.editActions}>
              <button
                type="button"
                style={styles.editCancelBtn}
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={styles.editSaveBtn}
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={styles.postTitle}>{post.title}</h3>
            <p style={styles.postContent}>{post.content}</p>

            {/* Imagem Opcional */}
            {post.imageUrl && (
              <div style={styles.imageContainer}>
                <img
                  src={post.imageUrl}
                  alt="Resultado/Anexo do Tópico"
                  style={styles.postImage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bar de Interações (Likes, Comentários, Views) */}
      <div style={styles.cardFooter}>
        <div style={styles.actionButtons}>
          {/* Botão LIKE */}
          <button
            style={{
              ...styles.actionBtn,
              ...(post.userLiked ? styles.likedBtn : {}),
            }}
            onClick={() => onTogglePostLike(post.id)}
            type="button"
          >
            <Heart
              size={16}
              color={post.userLiked ? "#ef4444" : "#94a3b8"}
              fill={post.userLiked ? "#ef4444" : "none"}
            />
            <span
              style={{
                color: post.userLiked ? "#ef4444" : "#94a3b8",
                fontWeight: post.userLiked ? 800 : 600,
              }}
            >
              {post.likesCount}
            </span>
          </button>

          {/* Botão COMENTÁRIOS */}
          <button
            style={{
              ...styles.actionBtn,
              ...(showComments ? styles.activeCommentBtn : {}),
            }}
            onClick={() => setShowComments(!showComments)}
            type="button"
          >
            <MessageSquare size={16} color="#94a3b8" />
            <span>{post.commentsCount}</span>
          </button>
        </div>

        {/* Contador de Visualizações */}
        <div style={styles.viewsCount}>
          <Eye size={14} color="#64748b" />
          <span>{post.viewsCount} visualizações</span>
        </div>
      </div>

      {/* Gaveta de Comentários */}
      {showComments && (
        <div style={styles.commentsDrawer}>
          {/* Formulário Novo Comentário */}
          <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              style={styles.commentInput}
            />
            <button type="submit" style={styles.sendCommentBtn}>
              <Send size={14} color="#ffffff" />
            </button>
          </form>

          {/* Lista de Comentários */}
          <div style={styles.commentsList}>
            {post.comments.length === 0 ? (
              <div style={styles.emptyComments}>
                Seja o primeiro a comentar neste tópico!
              </div>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.id} style={styles.commentItem}>
                  <div style={styles.commentAvatar}>
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.commentBody}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentAuthor}>
                        {comment.authorName}
                      </span>
                      <span style={styles.commentLevel}>
                        LV.{comment.authorLevel}
                      </span>
                      <span style={styles.commentTime}>
                        {comment.createdAt}
                      </span>
                    </div>
                    <p style={styles.commentText}>{comment.content}</p>
                    <div style={styles.commentActions}>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleCommentLike(post.id, comment.id)
                        }
                        style={styles.commentLikeBtn}
                      >
                        <Heart
                          size={12}
                          color={comment.userLiked ? "#ef4444" : "#64748b"}
                          fill={comment.userLiked ? "#ef4444" : "none"}
                        />
                        <span
                          style={{
                            color: comment.userLiked ? "#ef4444" : "#64748b",
                          }}
                        >
                          {comment.likesCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.5rem",
    marginBottom: "1.25rem",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "1.1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 10px rgba(239, 68, 68, 0.3)",
    flexShrink: 0,
  },
  authorMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  authorNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  authorName: {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#ffffff",
  },
  levelBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    border: "1px solid rgba(239, 68, 68, 0.25)",
  },
  subMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  dotSeparator: {
    color: "#475569",
  },
  categoryTag: {
    color: "#ef4444",
    fontWeight: 700,
  },
  menuContainer: {
    position: "relative",
  },
  iconBtn: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.35rem",
    borderRadius: "6px",
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: "100%",
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "0.4rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    minWidth: "160px",
    zIndex: 10,
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "transparent",
    border: "none",
    color: "#cbd5e1",
    fontSize: "0.775rem",
    padding: "0.45rem 0.65rem",
    borderRadius: "6px",
    cursor: "pointer",
    textAlign: "left",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  postTitle: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
    lineHeight: 1.3,
  },
  postContent: {
    fontSize: "0.9rem",
    color: "#cbd5e1",
    lineHeight: 1.5,
    margin: 0,
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  editTitleInput: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0.6rem 0.85rem",
    color: "#ffffff",
    fontSize: "0.95rem",
    fontWeight: 700,
    outline: "none",
  },
  editContentInput: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0.6rem 0.85rem",
    color: "#ffffff",
    fontSize: "0.9rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  editActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
  editCancelBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#94a3b8",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  editSaveBtn: {
    backgroundColor: "#ef4444",
    border: "none",
    color: "#ffffff",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  imageContainer: {
    marginTop: "0.5rem",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    maxHeight: "320px",
  },
  postImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "0.85rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "0.45rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#94a3b8",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  likedBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  activeCommentBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  viewsCount: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "0.75rem",
    color: "#64748b",
  },
  commentsDrawer: {
    marginTop: "0.5rem",
    paddingTop: "1rem",
    borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  commentForm: {
    display: "flex",
    gap: "0.5rem",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "0.6rem 0.85rem",
    color: "#ffffff",
    fontSize: "0.825rem",
    outline: "none",
  },
  sendCommentBtn: {
    backgroundColor: "#ef4444",
    border: "none",
    borderRadius: "8px",
    padding: "0 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  emptyComments: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  commentItem: {
    display: "flex",
    gap: "0.75rem",
    backgroundColor: "#09090b",
    padding: "0.75rem",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },
  commentAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#334155",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  commentBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    flex: 1,
  },
  commentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  commentAuthor: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  commentLevel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#ef4444",
  },
  commentTime: {
    fontSize: "0.7rem",
    color: "#64748b",
    marginLeft: "auto",
  },
  commentText: {
    fontSize: "0.825rem",
    color: "#cbd5e1",
    margin: 0,
    lineHeight: 1.4,
  },
  commentActions: {
    marginTop: "0.2rem",
  },
  commentLikeBtn: {
    backgroundColor: "transparent",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.7rem",
    cursor: "pointer",
    padding: 0,
  },
};
