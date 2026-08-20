"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { Auth, Storage, Perfil } from "@/lib/nito-motor";
import { User, Camera, Save, CheckCircle, AlertCircle } from "lucide-react";

export default function PerfilPage() {
  return (
    <AuthGuard>
      {(perfil) => <PerfilContent perfil={perfil} />}
    </AuthGuard>
  );
}

function PerfilContent({ perfil: perfilInicial }: { perfil: Perfil }) {
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial);
  const [nome, setNome] = useState(perfilInicial.nome || "");
  const [bio, setBio] = useState(perfilInicial.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(perfilInicial.avatar_url || null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);

    try {
      let avatar_url = perfil.avatar_url;

      if (avatarFile) {
        avatar_url = await Storage.enviar("avatars", avatarFile);
      }

      const perfilAtualizado = await Auth.atualizarPerfil({
        nome: nome.trim(),
        bio: bio.trim() || undefined,
        avatar_url,
      });

      setPerfil(perfilAtualizado);
      setMensagem({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (err: any) {
      setMensagem({ type: "error", text: err?.message || "Erro ao salvar perfil." });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/perfil" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <User size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Meu Perfil</h1>
                <p style={styles.pageSubtitle}>
                  Atualize suas informações pessoais, avatar e biografia da comunidade.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.profileCard}>
            {mensagem && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor:
                    mensagem.type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border:
                    mensagem.type === "success"
                      ? "1px solid rgba(34, 197, 94, 0.3)"
                      : "1px solid rgba(239, 68, 68, 0.3)",
                  color: mensagem.type === "success" ? "#4ade80" : "#f87171",
                }}
              >
                {mensagem.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{mensagem.text}</span>
              </div>
            )}

            <form onSubmit={handleSalvar} style={styles.form}>
              {/* Avatar Box */}
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={nome} style={styles.avatarImage} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {(nome || "M").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label style={styles.cameraBtn}>
                    <Camera size={16} color="#ffffff" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <span style={styles.avatarHint}>Clique no ícone de câmera para alterar a foto</span>
              </div>

              {/* Username (Readonly) */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nome de Usuário</label>
                <input
                  type="text"
                  value={`@${perfil.username}`}
                  disabled
                  style={{ ...styles.input, opacity: 0.6, cursor: "not-allowed" }}
                />
              </div>

              {/* Nome Completo */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nome de Exibição *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="Seu nome"
                />
              </div>

              {/* Bio */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Biografia (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  style={styles.textarea}
                  placeholder="Conte um pouco sobre suas lives e resultados..."
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={salvando} style={styles.submitBtn}>
                <Save size={18} />
                <span>{salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}</span>
              </button>
            </form>
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
    maxWidth: "800px",
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
  profileCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "2rem",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  avatarWrapper: {
    position: "relative",
    width: "90px",
    height: "90px",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(239, 68, 68, 0.5)",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontSize: "2.2rem",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ef4444",
    borderRadius: "50%",
    padding: "0.45rem",
    cursor: "pointer",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#cbd5e1",
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
  submitBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.85rem 1.5rem",
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: "0.875rem",
    cursor: "pointer",
    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
    marginTop: "0.5rem",
  },
};
