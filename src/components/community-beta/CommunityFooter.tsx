import React from "react";

export function CommunityFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.leftCol}>
        <div style={styles.brandRow}>
          <span style={styles.brandWhite}>NITO</span>
          <span style={styles.brandRed}>LIVE</span>
        </div>
        <p style={styles.copyText}>
          © 2026 NITO LIVE. Todos os direitos reservados.
        </p>
      </div>

      <div style={styles.rightCol}>
        <p style={styles.metaText}>
          Ambiente Beta Privado de Homologação — FASE 1 (Aba Início)
        </p>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    backgroundColor: "#09090b",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "1.5rem 2rem",
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  brandRow: {
    fontSize: "0.95rem",
    fontWeight: 900,
    letterSpacing: "0.05em",
  },
  brandWhite: {
    color: "#ffffff",
  },
  brandRed: {
    color: "#ef4444",
  },
  copyText: {
    fontSize: "0.75rem",
    color: "#64748b",
    margin: 0,
  },
  rightCol: {
    display: "flex",
    alignItems: "center",
  },
  metaText: {
    fontSize: "0.725rem",
    color: "#475569",
    margin: 0,
  },
};
