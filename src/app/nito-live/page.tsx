"use client";

import { useState } from "react";

export default function NitoLivePortalPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setKey(null);

    try {
      const res = await fetch("/api/public/claim-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), product: "liveinfinity" }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setKey(data.key);
      } else {
        setError(data.error || "Não encontramos uma compra ativa para este e-mail.");
      }
    } catch {
      setError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080a0f",
      color: "#f0f2f5",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        background: "rgba(15, 18, 26, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "20px",
        padding: "40px 32px",
        textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.1)"
      }}>
        {/* BRAND HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
          <img src="/nito-logo.png" alt="NITO LIVE" style={{ width: "48px", height: "48px", borderRadius: "12px" }} />
          <h1 style={{ fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px" }}>
            <span style={{ color: "#ffffff" }}>NITO</span>{" "}
            <span style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LIVE</span>
          </h1>
        </div>

        <span style={{
          background: "rgba(239, 68, 68, 0.12)",
          color: "#f87171",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          fontSize: "11px",
          fontWeight: "800",
          padding: "5px 14px",
          borderRadius: "20px",
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          Portal Oficial do Cliente
        </span>

        <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "18px", marginBottom: "30px", lineHeight: "1.6" }}>
          Digite o mesmo e-mail que você utilizou ao realizar a compra para visualizar e recuperar suas chaves de acesso ativas.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <label style={{ fontSize: "13px", fontWeight: "700", color: "#cbd5e1", display: "block", marginBottom: "8px" }}>
            E-mail de Compra
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu-email@exemplo.com"
            required
            style={{
              width: "100%",
              background: "rgba(9, 11, 17, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "#fff",
              fontSize: "15px",
              outline: "none",
              marginBottom: "20px",
              boxSizing: "border-box"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "800",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(239, 68, 68, 0.3)"
            }}
          >
            {loading ? "⏳ Buscando licença..." : "🔑 Visualizar Minha Chave NITO LIVE"}
          </button>
        </form>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", fontSize: "13px", padding: "14px", borderRadius: "12px", marginTop: "20px", textAlign: "left" }}>
            ⚠️ {error}
          </div>
        )}

        {key && (
          <div style={{ background: "rgba(10, 14, 23, 0.9)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "16px", padding: "24px", marginTop: "24px", textAlign: "center" }}>
            <div style={{ color: "#34d399", fontSize: "13px", fontWeight: "800", letterSpacing: "0.3px" }}>✅ CHAVE ENCONTRADA COM SUCESSO</div>
            <div style={{ fontFamily: "monospace", fontSize: "17px", fontWeight: "800", color: "#38bdf8", background: "#06080d", border: "1px dashed rgba(56, 189, 248, 0.5)", padding: "14px", borderRadius: "10px", margin: "16px 0", wordBreak: "break-all" }}>
              {key}
            </div>
            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                background: "#10b981",
                color: "#042f2e",
                fontWeight: "900",
                fontSize: "14px",
                padding: "12px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
              }}
            >
              {copied ? "✅ Chave Copiada com Sucesso!" : "📋 Copiar Chave de Acesso"}
            </button>

            <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
              <h4 style={{ fontSize: "13px", color: "#ef4444", marginBottom: "10px", fontWeight: "800" }}>Como Ativar na Extensão NITO LIVE:</h4>
              <div style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "6px" }}>1. Copie a chave de acesso acima.</div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "6px" }}>2. Abra a extensão <strong>NITO LIVE</strong> no seu Google Chrome.</div>
              <div style={{ fontSize: "12px", color: "#cbd5e1" }}>3. Insira seu e-mail e cole a chave no campo de ativação.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
