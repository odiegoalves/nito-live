"use client";

// =============================================================================
// NITO LIVE - Novelinhas.
// Aba do Novela Studio (novela.nitolive.com.br): roteiro, prompts e edicao de
// novelinhas com IA. Produto separado: so abre para quem tem acesso.
// Por enquanto o acesso e so do fundador (regra de compra entra depois, em
// novelinhasLiberadas). O botao abre o Studio ja logado: manda o token da
// sessao do portal no "#" do endereco (nao vai para servidor nem para log), e
// o Studio confere o token direto no Supabase antes de deixar entrar.
// =============================================================================

import React, { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, novelinhasLiberadas } from "@/components/nito/AppShell";
import { Perfil } from "@/lib/nito-motor";
import { createClient } from "@/lib/supabase";

const STUDIO = "https://novela.nitolive.com.br";

const RECURSOS = [
  "Roteiro pronto a partir de uma ideia ou de um viral",
  "Frutinhas 3D ou novela realista",
  "Prompts das imagens e dos vídeos do Flow, cena por cena",
  "Junta os clipes, corta os silêncios e põe legenda",
];

function Bloqueada() {
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
      <span className="eyebrow">EM BREVE</span>
      <h2 className="h-sec" style={{ marginTop: 8, justifyContent: "center" }}>Novelinhas com IA</h2>
      <p className="muted" style={{ maxWidth: 460, margin: "10px auto 0" }}>
        Crie novelinhas virais para o Reels e o TikTok sem saber editar.
      </p>
      <ul className="muted tiny" style={{ listStyle: "none", padding: 0, margin: "18px auto 0", maxWidth: 380, textAlign: "left", display: "grid", gap: 6 }}>
        {RECURSOS.map((i) => <li key={i}>✓ {i}</li>)}
      </ul>
      <p className="muted tiny" style={{ marginTop: 22 }}>Essa ferramenta ainda não está liberada para a sua conta.</p>
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
  const liberada = novelinhasLiberadas(perfil);
  return (
    <AppShell perfil={perfil} ativa="novelinhas" recado="Novelinhas com IA, do roteiro ao vídeo.">
      <div className="view on">
        {liberada ? (
          <Liberada />
        ) : (
          <div>
            <h1 className="title-xl">
              Novelinhas <em>IA</em>.
            </h1>
            <p className="sub">Roteiro, prompts e edição das suas novelinhas num lugar só.</p>
            <Bloqueada />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PaginaNovelinhas() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
