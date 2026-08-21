"use client";

// =============================================================================
// NITO LIVE - Comunidade.
// Cinco abas no mesmo lugar:
//   Importante  -> mural oficial, so a administracao publica
//   Chat        -> conversa ao vivo
//   Resultado   -> print de venda, foto obrigatoria
//   Insights    -> sacadas, foto opcional
//   Melhorias   -> sugestoes com enquete Sim / Nao
// =============================================================================

import React, { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { PostNito } from "@/components/nito/PostNito";
import { CompositorNito } from "@/components/nito/CompositorNito";
import { ChatNito } from "@/components/nito/ChatNito";
import { Feed, Enquetes, Post, Enquete, Perfil, TipoPost } from "@/lib/nito-motor";

type Sub = "importante" | "chat" | "resultado" | "insight" | "melhoria";

const ABAS: { chave: Sub; rotulo: string }[] = [
  { chave: "importante", rotulo: "📌 Importante" },
  { chave: "chat", rotulo: "💬 Chat ao vivo" },
  { chave: "resultado", rotulo: "📸 Seu resultado" },
  { chave: "insight", rotulo: "💡 Insights" },
  { chave: "melhoria", rotulo: "🛠 Melhorias" },
];

const TEXTOS: Record<Exclude<Sub, "chat">, { placeholder: string; botao: string; vazio: string }> = {
  importante: {
    placeholder: "Escreva o comunicado oficial para todos os membros…",
    botao: "Publicar comunicado",
    vazio: "Nenhum comunicado publicado ainda.",
  },
  resultado: {
    placeholder: "Conta como foi essa live: quanto tempo, quantos produtos, o que funcionou…",
    botao: "Publicar resultado",
    vazio: "Ninguém postou resultado ainda. Seja o primeiro — vale 150 XP.",
  },
  insight: {
    placeholder: "Que sacada você teve nessa semana que outro vendedor precisa saber?",
    botao: "Publicar insight",
    vazio: "Nenhum insight por aqui ainda.",
  },
  melhoria: {
    placeholder: "O que o NITO LIVE precisa ter que ainda não tem?",
    botao: "Publicar sugestão",
    vazio: "Nenhuma sugestão aberta no momento.",
  },
};

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [sub, setSub] = useState<Sub>("importante");
  const [posts, setPosts] = useState<Post[]>([]);
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set());
  const [enquetes, setEnquetes] = useState<Record<string, Enquete>>({});
  const [carregando, setCarregando] = useState(true);

  const admin = ehAdmin(perfil);

  const carregar = useCallback(async (tipo: Sub) => {
    if (tipo === "chat") return;
    setCarregando(true);
    try {
      const lista = await Feed.listar({ tipo, limite: 20 });
      setPosts(lista);
      const ids = lista.map((p) => p.id);
      const [curt, enq] = await Promise.all([
        Feed.minhasCurtidas(ids),
        tipo === "melhoria" ? Enquetes.doPosts(ids) : Promise.resolve({}),
      ]);
      setCurtidos(curt);
      setEnquetes(enq as Record<string, Enquete>);
    } catch {
      setPosts([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(sub);
  }, [sub, carregar]);

  // Publicacao nova de qualquer pessoa aparece sem recarregar.
  useEffect(() => {
    if (sub === "chat") return;
    const parar = Feed.assinar({
      onNovoPost: (novo: Post) => {
        if (novo.tipo !== sub) return;
        setPosts((antes) => (antes.some((p) => p.id === novo.id) ? antes : [novo, ...antes]));
      },
    });
    return () => parar?.();
  }, [sub]);

  function aoCurtir(postId: string, agoraCurtiu: boolean) {
    setCurtidos((antes) => {
      const novo = new Set(antes);
      if (agoraCurtiu) novo.add(postId);
      else novo.delete(postId);
      return novo;
    });
    setPosts((antes) =>
      antes.map((p) =>
        p.id === postId
          ? { ...p, curtidas_count: Math.max(0, (p.curtidas_count ?? 0) + (agoraCurtiu ? 1 : -1)) }
          : p
      )
    );
  }

  function aoVotar(enqueteId: string, voto: boolean) {
    setEnquetes((antes) => {
      const novo = { ...antes };
      for (const chave of Object.keys(novo)) {
        const e = novo[chave];
        if (e.id !== enqueteId) continue;
        const anterior = e.meu_voto;
        let sim = e.votos_sim;
        let nao = e.votos_nao;
        if (anterior === null || anterior === undefined) {
          voto ? sim++ : nao++;
        } else if (anterior !== voto) {
          voto ? (sim++, nao--) : (nao++, sim--);
        }
        novo[chave] = { ...e, votos_sim: Math.max(0, sim), votos_nao: Math.max(0, nao), meu_voto: voto };
      }
      return novo;
    });
  }

  function aoPublicar(post: Post) {
    setPosts((antes) => [post, ...antes]);
    if (sub === "melhoria") carregar("melhoria");
  }

  const podeCompor = sub !== "chat" && (sub !== "importante" || admin);
  const t = sub === "chat" ? null : TEXTOS[sub];

  return (
    <AppShell perfil={perfil} ativa="comunidade">
      <div className="view on">
        <div className="spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 className="title-xl">
              Comunidade <em>NITO LIVE</em>
            </h1>
            <p className="sub">Onde quem vende de verdade troca o que funciona.</p>
          </div>
        </div>

        <div className="filtros">
          {ABAS.map((a) => (
            <button
              key={a.chave}
              className={sub === a.chave ? "on" : ""}
              onClick={() => setSub(a.chave)}
              type="button"
            >
              {a.rotulo}
              {a.chave === "chat" && <span className="dot-live" />}
            </button>
          ))}
        </div>

        {sub === "chat" ? (
          <ChatNito perfil={perfil} />
        ) : (
          <>
            {podeCompor && t && (
              <CompositorNito
                tipo={sub as TipoPost as never}
                nomeAutor={perfil.nome}
                exigeFoto={sub === "resultado"}
                permiteEnquete={sub === "melhoria"}
                placeholder={t.placeholder}
                rotuloBotao={t.botao}
                onPublicado={aoPublicar}
              />
            )}

            {carregando && (
              <div className="panel pad muted" style={{ textAlign: "center" }}>
                Carregando publicações…
              </div>
            )}

            {!carregando && posts.length === 0 && t && (
              <div className="panel pad muted" style={{ textAlign: "center" }}>
                {t.vazio}
              </div>
            )}

            {!carregando &&
              posts.map((p) => (
                <PostNito
                  key={p.id}
                  post={p}
                  curtiu={curtidos.has(p.id)}
                  enquete={enquetes[p.id] ?? null}
                  onCurtir={aoCurtir}
                  onVotar={aoVotar}
                />
              ))}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function ComunidadePage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
