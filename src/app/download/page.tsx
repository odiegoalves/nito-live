export default function DownloadPage() {
  const nitoLiveVersion = "1.1.0";
  const livecamVersion = "3.6.4";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080a0f",
      color: "#f0f2f5",
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px"
    }}>
      <style>{`
        .single-btn-container {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 16px;
        }

        .browser-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 28px;
          width: 100%;
          max-width: 340px;
          min-height: 58px;
          border-radius: 14px;
          color: #ffffff;
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          cursor: pointer;
          box-sizing: border-box;
        }

        .browser-btn:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
          box-shadow: 0 12px 30px rgba(239, 68, 68, 0.5);
        }

        .browser-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .grid-download {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 28px;
          width: 100%;
          margin-bottom: 40px;
        }

        .card-logo-img {
          width: 110px;
          height: 110px;
          object-fit: contain;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.3);
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: rgba(15, 18, 26, 0.8);
          padding: 8px;
          transition: transform 0.3s ease;
          margin-bottom: 16px;
        }

        .card-logo-img:hover {
          transform: scale(1.05);
        }

        @media (max-width: 600px) {
          .grid-download {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: "920px", textAlign: "center" }}>
        <h1 style={{
          fontSize: "clamp(2rem, 4vw, 2.5rem)",
          fontWeight: "900",
          background: "linear-gradient(135deg, #ffffff, #ef4444, #f87171)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px",
          letterSpacing: "-0.02em"
        }}>
          ⚡ NITO LIVE — CENTRAL DE DOWNLOADS OFICIAL
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "40px" }}>
          Pacotes oficiais homologados exclusivamente para Google Chrome.
        </p>

        <div className="grid-download">
          {/* CARD 1 — NITO LIVE */}
          <div style={{
            background: "rgba(15, 18, 26, 0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "24px",
            padding: "36px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)"
          }}>
            <img src="/nito-logo.png" alt="NITO LIVE Logo" className="card-logo-img" />
            <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#fff", margin: "0 0 6px 0" }}>NITO LIVE</h2>
            
            <div style={{ marginBottom: "16px" }}>
              <span style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 16px",
                borderRadius: "20px"
              }}>
                Versão v{nitoLiveVersion} (Oficial Homologada)
              </span>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px", lineHeight: "1.6", flexGrow: 1 }}>
              Sistema de automação inteligente NITO LIVE para TikTok Shop com GMV em tempo real, refixação de produtos, prova social, respostas automáticas e autoproteção anti-violação.
            </p>

            <div className="single-btn-container">
              <a
                href="/downloads/LIVE_INFINITY_OFICIAL.zip"
                download="NITO_LIVE_OFICIAL.zip"
                className="browser-btn"
              >
                <span className="browser-icon">🌐</span>
                <span>Baixar NITO LIVE (Google Chrome)</span>
              </a>
            </div>
          </div>

          {/* CARD 2 — LIVECAM INFINITY */}
          <div style={{
            background: "rgba(15, 18, 26, 0.9)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 204, 0, 0.35)",
            borderRadius: "24px",
            padding: "36px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)"
          }}>
            <img src="/livecam-logo.jpg" alt="LiveCam Infinity Logo" className="card-logo-img" />
            <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#fff", margin: "0 0 6px 0" }}>LiveCam Infinity</h2>
            
            <div style={{ marginBottom: "16px" }}>
              <span style={{
                background: "rgba(255, 204, 0, 0.15)",
                border: "1px solid rgba(255, 204, 0, 0.4)",
                color: "#ffcc00",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 16px",
                borderRadius: "20px"
              }}>
                Versão v{livecamVersion} (Mais Recente)
              </span>
            </div>

            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px", lineHeight: "1.6", flexGrow: 1 }}>
              Câmera virtual para TikTok Shop com vídeo vertical, áudio, playlist, overlays e perfis de qualidade.
            </p>

            <div className="single-btn-container">
              <a
                href="/downloads/LIVECAM_INFINITY_OFICIAL.zip"
                download="LIVECAM_INFINITY_OFICIAL.zip"
                className="browser-btn"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 8px 24px rgba(245, 158, 11, 0.35)" }}
              >
                <span className="browser-icon">🌐</span>
                <span>Baixar LiveCam (Google Chrome)</span>
              </a>
            </div>
          </div>
        </div>

        {/* INSTRUÇÕES DE INSTALAÇÃO */}
        <div style={{
          background: "rgba(15, 18, 26, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "28px",
          textAlign: "left"
        }}>
          <h3 style={{ fontSize: "18px", color: "#ef4444", marginBottom: "16px", fontWeight: "800" }}>
            🛠️ Como Instalar o NITO LIVE no Google Chrome:
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
            <div>1. Clique no botão <strong>"Baixar NITO LIVE"</strong> para obter o arquivo <strong>.zip</strong> oficial.</div>
            <div>2. Extraia/descompacte o arquivo <strong>.zip</strong> em uma pasta no seu computador.</div>
            <div>3. No Google Chrome, acesse o endereço: <code>chrome://extensions</code></div>
            <div>4. No canto superior direito da tela de extensões, ative a chave <strong>"Modo do Desenvolvedor"</strong>.</div>
            <div>5. Clique no botão <strong>"Carregar sem compactação"</strong> e selecione a pasta extraída. Pronto!</div>
          </div>
        </div>

      </div>
    </div>
  );
}
