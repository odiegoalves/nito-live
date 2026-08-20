import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export function CommunityBanner() {
  return (
    <div style={styles.banner}>
      <div style={styles.contentGroup}>
        <div style={styles.badgeRow}>
          <Sparkles size={14} color="#ef4444" />
          <span style={styles.badgeText}>COMUNIDADE NITO LIVE</span>
        </div>
        <h2 style={styles.heading}>Foco. Estratégia. Resultados.</h2>
        <p style={styles.subtext}>
          Você não está sozinho. Faça parte da comunidade e aprenda com quem já está vendendo todos os dias.
        </p>
      </div>

      <div style={styles.actionGroup}>
        <button
          style={styles.disabledBtn}
          type="button"
          disabled
          title="Rota /comunidade será implementada na próxima fase"
        >
          <span>IR PARA COMUNIDADE</span>
          <ArrowRight size={16} />
        </button>
        <span style={styles.soonNotice}>Em breve na próxima rodada</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    backgroundColor: "#121215",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "18px",
    padding: "2rem 2.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1.5rem",
    marginBottom: "2rem",
    boxShadow: "0 10px 30px rgba(239, 68, 68, 0.08)",
    position: "relative",
    overflow: "hidden",
  },
  contentGroup: {
    maxWidth: "600px",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  badgeText: {
    fontSize: "0.7rem",
    fontWeight: 800,
    color: "#ef4444",
    letterSpacing: "0.06em",
  },
  heading: {
    fontSize: "1.65rem",
    fontWeight: 900,
    color: "#ffffff",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  subtext: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.5,
  },
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.4rem",
  },
  disabledBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.6rem",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "rgba(255, 255, 255, 0.6)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "0.85rem 1.5rem",
    borderRadius: "12px",
    fontWeight: 800,
    fontSize: "0.875rem",
    cursor: "not-allowed",
    letterSpacing: "0.03em",
  },
  soonNotice: {
    fontSize: "0.7rem",
    color: "#64748b",
    fontWeight: 600,
  },
};
