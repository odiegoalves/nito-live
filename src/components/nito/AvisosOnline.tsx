"use client";

// =============================================================================
// NITO LIVE - "fulano ficou online".
//
// O aviso estilo MSN: alguem entra na comunidade e aparece um cartaozinho no
// canto de baixo, com a foto da pessoa e um toque curto. Clicou, cai no chat.
//
// A regra de QUANDO avisar nao esta aqui - esta no modulo Presenca do motor,
// que e quem sabe diferenciar uma entrada de verdade de um F5. Aqui e so a
// aparencia, o som e o tempo que o cartao fica na tela.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Presenca, QuemEntrou, Perfil } from "@/lib/nito-motor";
import { Avatar } from "./Avatar";

const CHAVE_SOM = "nito_online_som";

/** quanto tempo o cartao fica na tela antes de sumir sozinho */
const TEMPO_NA_TELA_MS = 6_000;

/** nunca mais que isto empilhado, senao vira parede */
const MAX_NA_TELA = 3;

interface Cartao extends QuemEntrou {
  /** chave unica do cartao; a mesma pessoa pode entrar duas vezes na sessao */
  cartao: string;
  saindo?: boolean;
}

/**
 * O toque de chegada.
 *
 * Tres notas subindo, curtas. E de proposito diferente do "pop" de mensagem
 * nova do chat: quem escuta precisa saber, sem olhar, se chegou gente ou
 * chegou recado.
 *
 * Como em qualquer navegador, som so e liberado depois de um toque da pessoa.
 * O primeiro clique em qualquer lugar da pagina resolve, calado. E o contexto
 * nasce DENTRO do toque de proposito: no iPhone, um contexto criado fora de um
 * toque pode nunca mais ser destravado.
 */
function useToqueDeChegada() {
  const ctxRef = useRef<AudioContext | null>(null);

  const liberar = useCallback(() => {
    if (ctxRef.current) {
      if (ctxRef.current.state !== "running") {
        try {
          const p = ctxRef.current.resume() as unknown as Promise<void> | undefined;
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {
          /* so tenta */
        }
      }
      return;
    }
    try {
      const C =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!C) return;
      const ctx = new C();
      const p = ctx.resume() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
      ctxRef.current = ctx;
    } catch {
      /* aparelho sem Web Audio: o aviso continua, so nao apita */
    }
  }, []);

  useEffect(() => {
    const eventos = ["touchend", "click", "pointerdown", "keydown"] as const;
    const aoTocar = () => liberar();
    eventos.forEach((e) => window.addEventListener(e, aoTocar));
    return () => eventos.forEach((e) => window.removeEventListener(e, aoTocar));
  }, [liberar]);

  const tocar = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;
    try {
      const agora = ctx.currentTime;
      // Mi - Sol# - Si: um acorde maior tocado nota a nota. Soa como porta
      // abrindo, nao como alarme.
      [659.25, 830.61, 987.77].forEach((hz, i) => {
        const osc = ctx.createOscillator();
        const vol = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = hz;
        const inicio = agora + i * 0.085;
        vol.gain.setValueAtTime(0.0001, inicio);
        vol.gain.exponentialRampToValueAtTime(0.13, inicio + 0.015);
        vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.32);
        osc.connect(vol).connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + 0.36);
      });
    } catch {
      /* som e um extra, nunca pode atrapalhar o site */
    }
  }, []);

  return tocar;
}

export function AvisosOnline({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const tocar = useToqueDeChegada();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [mudo, setMudo] = useState(false);

  // Espelho do mudo em ref: quem chama o som e o canal de presenca, que foi
  // montado uma vez so e enxergaria para sempre o primeiro valor do estado.
  const mudoRef = useRef(false);
  const tocarRef = useRef(tocar);
  useEffect(() => {
    tocarRef.current = tocar;
  }, [tocar]);

  useEffect(() => {
    try {
      setMudo(window.localStorage.getItem(CHAVE_SOM) === "0");
    } catch {
      /* navegador sem armazenamento: fica com som */
    }
  }, []);

  useEffect(() => {
    mudoRef.current = mudo;
    try {
      window.localStorage.setItem(CHAVE_SOM, mudo ? "0" : "1");
    } catch {
      /* nao poder lembrar nao impede de silenciar agora */
    }
  }, [mudo]);

  const dispensar = useCallback((chave: string) => {
    // Marca como saindo para a animacao acontecer, e so depois tira da lista.
    setCartoes((antes) => antes.map((c) => (c.cartao === chave ? { ...c, saindo: true } : c)));
    window.setTimeout(() => {
      setCartoes((antes) => antes.filter((c) => c.cartao !== chave));
    }, 260);
  }, []);

  // Levar a pessoa para o chat tem dois caminhos, e isto nao e capricho:
  // estando em outra aba, o router do Next resolve. Estando JA na Comunidade,
  // o router usa history.pushState, que NAO dispara o evento de hashchange -
  // a pagina ouviria o endereco mudar e nao trocaria de aba. Mexer no hash na
  // mao dispara. Antes disso, limpa o hash: se ele ja fosse "#chat", grava-lo
  // de novo nao mudaria nada e o clique morreria sem efeito.
  const irParaOChat = useCallback(() => {
    if (window.location.pathname === "/comunidade") {
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        /* segue mesmo assim */
      }
      window.location.hash = "chat";
      return;
    }
    router.push("/comunidade#chat");
  }, [router]);

  const relogios = useRef<number[]>([]);

  useEffect(() => {
    const desligar = Presenca.assinar(perfil, {
      onEntrou: (quem) => {
        // A mesma pessoa pode entrar duas vezes na mesma sessao (fechou e
        // abriu de novo), entao a chave do cartao leva a hora junto.
        const chave = `${quem.visita}-${Date.now()}`;
        setCartoes((antes) => [...antes, { ...quem, cartao: chave }].slice(-MAX_NA_TELA));
        if (!mudoRef.current) tocarRef.current();
        relogios.current.push(window.setTimeout(() => dispensar(chave), TEMPO_NA_TELA_MS));
      },
    });
    return () => {
      relogios.current.forEach((r) => window.clearTimeout(r));
      relogios.current = [];
      desligar();
    };
    // Depende so do id: trocar de nome ou de foto nao pode derrubar o canal.
  }, [perfil.id, dispensar]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cartoes.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: "calc(100vw - 36px)",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes nitoEntraAviso {
          from { opacity: 0; transform: translateX(26px) scale(.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1);   }
        }
        @keyframes nitoSaiAviso {
          from { opacity: 1; transform: translateX(0)    scale(1);   }
          to   { opacity: 0; transform: translateX(26px) scale(.97); }
        }
        @keyframes nitoPulsaOnline {
          0%,100% { opacity: 1;  transform: scale(1);   }
          50%     { opacity: .5; transform: scale(.82); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nito-aviso-online { animation: none !important; }
          .nito-online-ponto { animation: none !important; }
        }
      `}</style>

      {cartoes.map((c) => (
        <div
          key={c.cartao}
          className="nito-aviso-online"
          onClick={() => {
            dispensar(c.cartao);
            irParaOChat();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dispensar(c.cartao);
              irParaOChat();
            }
          }}
          role="button"
          tabIndex={0}
          title="Abrir o chat ao vivo"
          style={{
            pointerEvents: "auto",
            cursor: "pointer",
            width: 296,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "11px 12px",
            borderRadius: 14,
            background: "rgba(14,14,24,.96)",
            border: "1px solid var(--line)",
            boxShadow: "0 14px 40px rgba(0,0,0,.55)",
            animation: `${c.saindo ? "nitoSaiAviso" : "nitoEntraAviso"} .24s ease both`,
          }}
        >
          <div style={{ position: "relative", flex: "none" }}>
            <Avatar
              className="av"
              nome={c.nome}
              url={c.avatar_url}
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: "var(--grad)",
                display: "grid",
                placeItems: "center",
                font: "900 .88rem/1 var(--disp)",
              }}
            />
            <i
              className="nito-online-ponto"
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #0e0e18",
                animation: "nitoPulsaOnline 2s ease-in-out infinite",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <b
              style={{
                display: "block",
                fontSize: ".86rem",
                color: "var(--txt)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.nome ?? "Um membro"}
            </b>
            <span style={{ display: "block", fontSize: ".73rem", color: "var(--mut2)" }}>
              acabou de entrar na comunidade
            </span>
          </div>

          <button
            type="button"
            title={mudo ? "Ligar o som de quem entra" : "Silenciar o som de quem entra"}
            aria-label={mudo ? "Ligar o som de quem entra" : "Silenciar o som de quem entra"}
            onClick={(e) => {
              // Sem isto, silenciar tambem abriria o chat.
              e.stopPropagation();
              setMudo((m) => !m);
            }}
            style={{
              flex: "none",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontSize: ".95rem",
              lineHeight: 1,
              padding: 4,
              opacity: mudo ? 0.55 : 0.9,
            }}
          >
            {mudo ? "🔇" : "🔔"}
          </button>
        </div>
      ))}
    </div>
  );
}
