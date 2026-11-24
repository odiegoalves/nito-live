"use client";

// =============================================================================
// NITO LIVE - Novelinhas.
// Aba do Novela Studio (novela.nitolive.com.br): roteiro, prompts e edicao de
// novelinhas com IA. Incluido no plano PRO do NITO LIVE (e no Premium); a regra
// fica em novelinhasLiberadas. A pagina confere o plano na hora com a funcao
// "chaves", e o servidor do Studio confere de novo por conta propria.
// =============================================================================

import React, { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, novelinhasLiberadas } from "@/components/nito/AppShell";
import { Chaves, Perfil, planoSalvo } from "@/lib/nito-motor";
import { createClient } from "@/lib/supabase";

const STUDIO = "https://novela.nitolive.com.br";
const UPGRADE_PRO = "https://pay.cakto.com.br/3477jz3_976117";

const RECURSOS = [
  "Roteiro pronto a partir de uma ideia ou de um viral",
  "Frutinhas 3D ou novela realista",
  "Prompts das imagens e dos vídeos do Flow, cena por cena",
  "Junta os clipes, corta os silêncios e põe legenda",
];

function Bloqueada({ planoAtual }: { planoAtual: string | null }) {
  return (
    <div className="panel pad" style={{ marginTop: 16, textAlign: "center", padding: "40px 24px" }}>
      <div
        aria-hidden
        style={{
          width: 64, height: 64, margin: "0 auto 16px", borderRadius: 18, display: "grid", placeItems: "center",
          fontSize: "1.8rem", background: "rgba(255,255,255,.04)", border: "1px solid var(--line)",
        }}
      >
        🔒
      </div>
      <span className="eyebrow">INCLUSO NO PLANO PRO</span>
      <h2 className="h-sec" style={{ marginTop: 8, justifyContent: "center" }}>Novelinhas com IA</h2>
      <p className="muted" style={{ maxWidth: 460, margin: "10px auto 0" }}>
        Crie novelinhas virais para o Reels e o TikTok sem saber editar.
      </p>
      <ul className="muted tiny" style={{ listStyle: "none", padding: 0, margin: "18px auto 0", maxWidth: 380, textAlign: "left", display: "grid", gap: 6 }}>
        {RECURSOS.map((i) => <li key={i}>✓ {i}</li>)}
      </ul>
      <p className="muted tiny" style={{ marginTop: 22 }}>
        As Novelinhas fazem parte do <b>plano PRO</b> do NITO LIVE
        {planoAtual ? <> (o seu hoje é o <b style={{ textTransform: "uppercase" }}>{planoAtual}</b>)</> : null}.
      </p>
      <a className="btn p" href={UPGRADE_PRO} target="_blank" rel="noopener noreferrer" style={{ marginTop: 16 }}>
        Quero o plano PRO
      </a>
    </div>
  );
}

// O Studio aparece dentro da pagina (iframe), ja logado. O token da sessao do
// portal vai no "#" do endereco (nao vai para servidor nem para log); o Studio
// confere direto no Supabase e abre a sessao dele.
function Liberada() {
  const [src, setSrc] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!vivo) return;
        const token = data.session?.access_token;
        setSrc(token ? `${STUDIO}/entrar#t=${encodeURIComponent(token)}` : `${STUDIO}/login`);
      })
      .catch(() => vivo && setErro("Não consegui abrir o Studio agora. Recarregue a página."));
    return () => { vivo = false; };
  }, []);

  // Ocupa a area de conteudo inteira (abaixo do topo de 67px e da margem de 26px
  // da .view), sem borda nem fundo: o Studio veste o visual do portal sozinho.
  return (
    <div style={{ marginBottom: -26 }}>
      {erro && <p className="tiny" style={{ color: "var(--red, #ff3b5c)" }}>{erro}</p>}
      {src ? (
        <iframe
          src={src}
          title="Novelinhas"
          allow="clipboard-read; clipboard-write; fullscreen; autoplay"
          style={{
            width: "100%",
            height: "calc(100vh - 93px)",
            minHeight: 520,
            border: 0,
            background: "transparent",
            colorScheme: "normal",
            display: "block",
          }}
        />
      ) : (
        !erro && <p className="muted tiny">Carregando…</p>
      )}
    </div>
  );
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  // Confere o plano na hora (o que ficou salvo serve so para nao piscar).
  const [plano, setPlano] = useState(planoSalvo());
  const [conferido, setConferido] = useState(perfil.papel === "fundador");
  useEffect(() => {
    if (perfil.papel === "fundador") return;
    Chaves.chamar("listar")
      .then(() => setPlano(planoSalvo()))
      .catch(() => {})
      .finally(() => setConferido(true));
  }, [perfil.papel]);
  const liberada = novelinhasLiberadas(perfil, plano);
  return (
    <AppShell perfil={perfil} ativa="novelinhas" recado="Novelinhas com IA, do roteiro ao vídeo.">
      <div className="view on">
        {!conferido && !liberada ? (
          <p className="muted tiny">Conferindo o seu plano…</p>
        ) : liberada ? (
          <Liberada />
        ) : (
          <div>
            <h1 className="title-xl">
              Novelinhas <em>IA</em>.
            </h1>
            <p className="sub">Roteiro, prompts e edição das suas novelinhas num lugar só.</p>
            <Bloqueada planoAtual={plano?.plano ?? null} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PaginaNovelinhas() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
