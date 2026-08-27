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
import { Feed, Enquetes, Post, Enquete, Perfil } from "@/lib/nito-motor";

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

const CHAVES_ABA: Sub[] = ["importante", "chat", "resultado", "insight", "melhoria"];

/** le a aba pedida no endereco: /comunidade#chat */
function abaDoEndereco(): Sub | null {
  if (typeof window === "undefined") return null;
  const pedida = window.location.hash.replace("#", "") as Sub;
  return CHAVES_ABA.indexOf(pedida) >= 0 ? pedida : null;
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [sub, setSub] = useState<Sub>("importante");
  const [posts, setPosts] = useState<Post[]>([]);
  const [curtidos, setCurtidos] = useState<Set<string>>(new Set());
  const [enquetes, setEnquetes] = useState<Record<string, Enquete>>({});
  const [carregando, setCarregando] = useState(true);

  // O aviso de "fulano ficou online" manda para ca com #chat no endereco.
  // Precisa dos dois: ao ABRIR a pagina, e enquanto ela ja esta aberta - senao
  // clicar no aviso estando na Comunidade nao trocaria de aba.
  useEffect(() => {
    const aplicar = () => {
      const pedida = abaDoEndereco();
      if (pedida) setSub(pedida);
    };
    aplicar();
    window.addEventListener("hashchange", aplicar);
    return () => window.removeEventListener("hashchange", aplicar);
  }, []);

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

  function aoFixar(postId: string, fixado: boolean) {
    setPosts((antes) => {
      const atualizado = antes.map((p) => (p.id === postId ? { ...p, fixado } : p));
      // Mesma ordem do banco: fixados primeiro, depois os mais recentes.
      return [...atualizado].sort((a, b) => {
        if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
        return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
      });
    });
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
          if (voto) sim += 1;
          else nao += 1;
        } else if (anterior !== voto) {
          if (voto) {
            sim += 1;
            nao -= 1;
          } else {
            nao += 1;
            sim -= 1;
          }
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
  // Fora da aba de chat, "sub" e sempre um tipo de publicacao valido.
  const tipoPost = sub as Exclude<Sub, "chat">;
  const t = sub === "chat" ? null : TEXTOS[tipoPost];

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
              onClick={() => {
                setSub(a.chave);
                // Tira o "#chat" do endereco ao trocar de aba na mao. Sem
                // isto, o proximo clique num aviso de "fulano entrou" nao
                // mudaria nada: o endereco ja estaria em #chat.
                if (window.location.hash) {
                  try {
                    window.history.replaceState(null, "", window.location.pathname);
                  } catch {
                    /* endereco continua com o hash, nada quebra */
                  }
                }
              }}
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
                tipo={tipoPost}
                nomeAutor={perfil.nome}
                exigeFoto={sub === "resultado"}
                permiteEnquete={sub === "melhoria"}
                permiteFixar={admin}
                permiteAudio={sub === "importante"}
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
                  admin={admin}
                  enquete={enquetes[p.id] ?? null}
                  onCurtir={aoCurtir}
                  onVotar={aoVotar}
                  onFixar={aoFixar}
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
