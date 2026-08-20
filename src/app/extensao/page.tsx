"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { Auth, Perfil } from "@/lib/nito-motor";
import { Puzzle, Download, Key, Copy, Check } from "lucide-react";

export default function ExtensaoPage() {
  return (
    <AuthGuard>
      {(perfil) => <ExtensaoContent perfil={perfil} />}
    </AuthGuard>
  );
}

function ExtensaoContent({ perfil }: { perfil: Perfil }) {
  const [token, setToken] = useState<string>("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    Auth.sessao().then((s) => {
      if (s) setToken(s.access_token);
    });
  }, []);

  const handleCopiarToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/extensao" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <Puzzle size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Extensão NITO LIVE</h1>
                <p style={styles.pageSubtitle}>
                  Conecte a extensão ao seu TikTok Studio para automatizar suas lives e capturar vendas.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.contentGrid}>
            {/* Step 1: Download */}
            <div style={styles.card}>
              <div style={styles.stepBadge}>PASSO 1</div>
              <h2 style={styles.cardTitle}>Baixar a Extensão</h2>
              <p style={styles.cardText}>
                Faça o download do pacote oficial da extensão NITO LIVE e instale no seu navegador Chrome ou Edge.
              </p>
              <a
                href="/downloads/LIVE_INFINITY_OFICIAL.zip"
                download
                style={styles.downloadBtn}
              >
                <Download size={18} />
                <span>BAIXAR EXTENSÃO (.ZIP)</span>
              </a>
            </div>

            {/* Step 2: Key */}
            <div style={styles.card}>
              <div style={styles.stepBadge}>PASSO 2</div>
              <h2 style={styles.cardTitle}>Seu Token de Acesso (JWT)</h2>
              <p style={styles.cardText}>
                Cole este token na extensão para autenticar suas capturas no painel.
              </p>
              <div style={styles.tokenBox}>
                <input
                  type="password"
                  readOnly
                  value={token || "Carregando token..."}
                  style={styles.tokenInput}
                />
                <button
                  type="button"
                  onClick={handleCopiarToken}
                  style={styles.copyBtn}
                >
                  {copiado ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
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
    maxWidth: "1000px",
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
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  stepBadge: {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    alignSelf: "flex-start",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
  },
  cardText: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    lineHeight: 1.5,
    margin: 0,
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    padding: "0.85rem 1.25rem",
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: "0.85rem",
    textDecoration: "none",
    marginTop: "0.5rem",
    boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
  },
  tokenBox: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  tokenInput: {
    flex: 1,
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "0.75rem",
    color: "#ffffff",
    fontSize: "0.85rem",
    outline: "none",
  },
  copyBtn: {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    padding: "0 1rem",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
