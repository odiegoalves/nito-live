"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Users,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Puzzle,
  HelpCircle,
  User as UserIcon,
  LogOut,
  Award,
} from "lucide-react";
import { Auth, Perfil } from "@/lib/nito-motor";

interface SidebarProps {
  activePath?: string;
  perfil?: Perfil | null;
}

export function Sidebar({ activePath = "/inicio", perfil }: SidebarProps) {
  const handleLogout = async () => {
    await Auth.sair();
  };

  const navItems = [
    { label: "INÍCIO", icon: Home, path: "/inicio" },
    { label: "COMUNIDADE", icon: Users, path: "/comunidade" },
    { label: "DEPOIMENTOS", icon: MessageSquare, path: "/depoimentos" },
    { label: "AULAS", icon: BookOpen, path: "/aulas" },
    { label: "MINHAS VENDAS", icon: TrendingUp, path: "/vendas" },
    { label: "EXTENSÃO", icon: Puzzle, path: "/extensao" },
    { label: "SUPORTE", icon: HelpCircle, path: "/suporte" },
    { label: "MEU PERFIL", icon: UserIcon, path: "/perfil" },
  ];

  const nivel = perfil?.nivel ?? 1;
  const xp = perfil?.xp ?? 0;
  const targetXp = 1000;
  const xpPercentage = Math.min(100, Math.round((xp / targetXp) * 100));

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandHeader}>
        <div style={styles.brandTitleRow}>
          <span style={styles.brandNito}>NITO</span>
          <span style={styles.brandLive}>LIVE</span>
        </div>
        <span style={styles.brandBadge}>
          {perfil?.papel ? perfil.papel.toUpperCase() : "COMUNIDADE"}
        </span>
      </div>

      {/* Navigation Menu */}
      <nav style={styles.navContainer}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === activePath;

          return (
            <Link key={item.label} href={item.path} style={{ textDecoration: "none" }}>
              <div
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <div style={styles.navItemLeft}>
                  <Icon
                    size={18}
                    color={isActive ? "#ef4444" : "#94a3b8"}
                    style={styles.navIcon}
                  />
                  <span
                    style={{
                      ...styles.navLabel,
                      color: isActive ? "#ffffff" : "#cbd5e1",
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* XP / Level Component */}
      <div style={styles.levelCard}>
        <div style={styles.levelHeader}>
          <div style={styles.levelTitleGroup}>
            <Award size={16} color="#ef4444" />
            <span style={styles.levelText}>NÍVEL {nivel}</span>
          </div>
          <span style={styles.levelSubText}>
            {perfil?.papel === "fundador"
              ? "FUNDADOR"
              : perfil?.papel === "moderador"
              ? "MODERADOR"
              : `Lvl ${nivel}`}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressBarTrack}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${xpPercentage}%`,
            }}
          />
        </div>

        <div style={styles.xpTextRow}>
          <span>
            {xp.toLocaleString()} / {targetXp.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Logout Button */}
      <div style={styles.logoutWrapper}>
        <button style={styles.logoutBtn} type="button" onClick={handleLogout}>
          <LogOut size={16} color="#ef4444" />
          <span>SAIR</span>
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "280px",
    backgroundColor: "#09090b",
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 1rem",
    height: "100vh",
    position: "sticky",
    top: 0,
    overflowY: "auto",
    flexShrink: 0,
  },
  brandHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "1.25rem",
    marginBottom: "1.25rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  brandTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    fontSize: "1.2rem",
    fontWeight: 900,
    letterSpacing: "0.05em",
  },
  brandNito: {
    color: "#ffffff",
  },
  brandLive: {
    color: "#ef4444",
    textShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
  },
  brandBadge: {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: "0.25rem 0.55rem",
    borderRadius: "6px",
    letterSpacing: "0.05em",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
  navContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.7rem 0.85rem",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid transparent",
  },
  navItemActive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    boxShadow: "0 0 12px rgba(239, 68, 68, 0.15)",
  },
  navItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  navIcon: {
    flexShrink: 0,
  },
  navLabel: {
    fontSize: "0.825rem",
    letterSpacing: "0.03em",
  },
  levelCard: {
    backgroundColor: "#121215",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    padding: "1rem",
    marginTop: "1.25rem",
    marginBottom: "1rem",
  },
  levelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.6rem",
  },
  levelTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  levelText: {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "0.05em",
  },
  levelSubText: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
  },
  progressBarTrack: {
    width: "100%",
    height: "6px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: "9999px",
    overflow: "hidden",
    marginBottom: "0.4rem",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ef4444",
    borderRadius: "9999px",
    boxShadow: "0 0 8px #ef4444",
    transition: "width 0.4s ease",
  },
  xpTextRow: {
    fontSize: "0.7rem",
    color: "#94a3b8",
    textAlign: "right",
    marginBottom: "0.2rem",
    fontWeight: 600,
  },
  logoutWrapper: {
    paddingTop: "0.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  },
  logoutBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    padding: "0.6rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
};
