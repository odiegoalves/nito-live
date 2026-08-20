"use client";

import React from "react";
import { ShieldCheck, Calendar } from "lucide-react";
import { Perfil } from "@/lib/nito-motor";

interface TopbarProps {
  perfil: Perfil;
}

export function Topbar({ perfil }: TopbarProps) {
  const nome = perfil?.nome || perfil?.username || "Membro";
  const initial = nome.charAt(0).toUpperCase();

  const isSubActive = perfil?.assinatura_ativa ?? false;
  let daysRemaining = 0;
  if (perfil?.assinatura_expira_em) {
    const diff = new Date(perfil.assinatura_expira_em).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return (
    <header style={styles.topbar}>
      {/* Boas-Vindas & Mascot Asset */}
      <div style={styles.welcomeSection}>
        <div style={styles.mascotBox}>
          <img
            src="/nito-logo.png"
            alt="NITO Mascot"
            style={styles.mascotImg}
          />
        </div>
        <div style={styles.welcomeTextGroup}>
          <h1 style={styles.welcomeTitle}>
            👋 Bem-vindo de volta, <span style={styles.highlightName}>{nome}</span>!
          </h1>
          <p style={styles.welcomeSubtitle}>
            Seu NITO está trabalhando por você todos os dias.
          </p>
        </div>
      </div>

      {/* Direita: Status da Assinatura & Perfil */}
      <div style={styles.rightGroup}>
        {/* Status de Assinatura Real */}
        <div style={styles.subStatusCard}>
          <div style={styles.subBadgeRow}>
            <ShieldCheck size={14} color={isSubActive ? "#10b981" : "#ef4444"} />
            <span style={{ ...styles.subBadgeText, color: isSubActive ? "#10b981" : "#ef4444" }}>
              {isSubActive ? "ASSINATURA ATIVA" : "ASSINATURA INATIVA"}
            </span>
          </div>
          {isSubActive && daysRemaining > 0 && (
            <div style={styles.subExpiryRow}>
              <Calendar size={13} color="#94a3b8" />
              <span style={styles.subExpiryText}>
                Expira em: {daysRemaining} dias
              </span>
            </div>
          )}
        </div>

        {/* User Avatar & Info */}
        <div style={styles.userProfileCard}>
          {perfil.avatar_url ? (
            <img src={perfil.avatar_url} alt={nome} style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarCircle}>{initial}</div>
          )}
          <div style={styles.userInfoText}>
            <span style={styles.userName}>{nome}</span>
            <span style={styles.userEmail}>@{perfil.username}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    backgroundColor: "#121215",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "1.25rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1.25rem",
  },
  welcomeSection: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  mascotBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#1e293b",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 0 12px rgba(239, 68, 68, 0.2)",
    flexShrink: 0,
  },
  mascotImg: {
    width: "36px",
    height: "36px",
    objectFit: "contain",
  },
  welcomeTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  welcomeTitle: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
    lineHeight: 1.2,
  },
  highlightName: {
    color: "#ef4444",
    textShadow: "0 0 8px rgba(239, 68, 68, 0.4)",
  },
  welcomeSubtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: 0,
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    flexWrap: "wrap",
  },
  subStatusCard: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "0.55rem 0.95rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  subBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  subBadgeText: {
    fontSize: "0.725rem",
    fontWeight: 800,
    letterSpacing: "0.04em",
  },
  subExpiryRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  subExpiryText: {
    fontSize: "0.75rem",
    color: "#cbd5e1",
    fontWeight: 600,
  },
  userProfileCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "0.45rem 0.85rem 0.45rem 0.45rem",
    borderRadius: "9999px",
  },
  avatarCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)",
    flexShrink: 0,
  },
  avatarImg: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  userInfoText: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "160px",
  },
  userName: {
    fontSize: "0.825rem",
    fontWeight: 700,
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};
