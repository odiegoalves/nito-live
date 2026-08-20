"use client";

import React, { useState } from "react";
import { X, Sparkles, Image as ImageIcon, Upload } from "lucide-react";

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topicData: {
    title: string;
    conteudo: string;
    imagemFile?: File | null;
    tipo?: "texto" | "print_ganho" | "depoimento";
  }) => Promise<void>;
}

export function NewTopicModal({ isOpen, onClose, onSubmit }: NewTopicModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tipo, setTipo] = useState<"texto" | "print_ganho" | "depoimento">("texto");
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErro(null);

    try {
      await onSubmit({
        title: title.trim() || "",
        conteudo: content.trim(),
        imagemFile,
        tipo: imagemFile ? "print_ganho" : tipo,
      });

      setTitle("");
      setContent("");
      setImagemFile(null);
      setTipo("texto");
      onClose();
    } catch (err: any) {
      setErro(err?.message || "Erro ao publicar tópico.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <Sparkles size={18} color="#ef4444" />
            <h2 style={styles.modalTitle}>Criar Novo Tópico</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose} type="button">
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        {erro && (
          <div style={styles.erroBox}>
            <span>{erro}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Tipo de Tópico */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Tipo de Publicação</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              style={styles.select}
            >
              <option value="texto">Texto / Discussão Geral</option>
              <option value="print_ganho">Print de Ganho / Resultado</option>
              <option value="depoimento">Depoimento</option>
            </select>
          </div>

          {/* Título */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Título (Opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Minha primeira live bateu R$ 1.500!"
              style={styles.input}
            />
          </div>

          {/* Conteúdo */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Conteúdo *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua mensagem para a comunidade..."
              style={styles.textarea}
              rows={4}
              required
            />
          </div>

          {/* Upload de Imagem */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <ImageIcon size={14} style={{ marginRight: 6 }} />
              Anexar Imagem / Print (Opcional)
            </label>
            <div style={styles.fileInputWrapper}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
              <div style={styles.fileCustomBtn}>
                <Upload size={16} color="#ef4444" />
                <span>
                  {imagemFile ? imagemFile.name : "Escolher Imagem..."}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={styles.footerRow}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              {isSubmitting ? "PUBLICANDO..." : "PUBLICAR TÓPICO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: "1rem",
  },
  modalCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "540px",
    padding: "1.75rem",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 25px rgba(239, 68, 68, 0.15)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
    paddingBottom: "0.85rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  modalTitle: {
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  erroBox: {
    padding: "0.5rem 0.75rem",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#f87171",
    fontSize: "0.8rem",
    marginBottom: "0.75rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.775rem",
    fontWeight: 700,
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
  },
  select: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
    cursor: "pointer",
  },
  textarea: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  fileInputWrapper: {
    position: "relative",
    width: "100%",
  },
  fileInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  fileCustomBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#09090b",
    border: "1px dashed rgba(255, 255, 255, 0.2)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    color: "#94a3b8",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "0.75rem 1.25rem",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: "0.85rem",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
  },
};
