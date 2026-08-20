"use client";

import React from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/community-beta/Sidebar";
import { Topbar } from "@/components/community-beta/Topbar";
import { CommunityFooter } from "@/components/community-beta/CommunityFooter";
import { Perfil } from "@/lib/nito-motor";
import { HelpCircle, MessageSquare, Mail, ExternalLink } from "lucide-react";

export default function SuportePage() {
  return (
    <AuthGuard>
      {(perfil) => <SuporteContent perfil={perfil} />}
    </AuthGuard>
  );
}

function SuporteContent({ perfil }: { perfil: Perfil }) {
  return (
    <div style={styles.appContainer}>
      <Sidebar activePath="/suporte" perfil={perfil} />

      <div style={styles.mainWrapper}>
        <Topbar perfil={perfil} />

        <div style={styles.contentBody}>
          {/* Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.headerIconBox}>
                <HelpCircle size={22} color="#ef4444" />
              </div>
              <div>
                <h1 style={styles.pageTitle}>Suporte NITO LIVE</h1>
                <p style={styles.pageSubtitle}>
                  Precisa de ajuda com sua conta, lives ou extensão? Fale com nosso time de atendimento.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.cardsGrid}>
            <div style={styles.card}>
              <div style={styles.iconWrapper}>
                <MessageSquare size={24} color="#10b981" />
              </div>
              <h2 style={styles.cardTitle}>Suporte via WhatsApp</h2>
              <p style={styles.cardText}>
                Atendimento rápido das 09h às 18h para dúvidas de configuração e extensão.
              </p>
              <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noreferrer"
                style={styles.whatsappBtn}
              >
                <span>CHAMAR NO WHATSAPP</span>
                <ExternalLink size={16} />
              </a>
            </div>

            <div style={styles.card}>
              <div style={styles.iconWrapper}>
                <Mail size={24} color="#ef4444" />
              </div>
              <h2 style={styles.cardTitle}>Suporte por E-mail</h2>
              <p style={styles.cardText}>
                Envie suas dúvidas detalhadas para nossa equipe técnica e receba resposta em até 24h.
              </p>
              <a href="mailto:suporte@nitolive.com.br" style={styles.emailBtn}>
                <span>ENVIAR E-MAIL</span>
              </a>
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
    maxWidth: "900px",
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
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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
  iconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#09090b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  whatsappBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "#10b981",
    color: "#ffffff",
    padding: "0.85rem 1.25rem",
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: "0.85rem",
    textDecoration: "none",
    marginTop: "0.5rem",
  },
  emailBtn: {
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
  },
};
