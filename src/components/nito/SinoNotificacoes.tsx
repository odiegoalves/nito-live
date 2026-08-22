"use client";

// =============================================================================
// NITO LIVE - sininho de notificacoes do topo.
//
// Mostra quantas coisas aconteceram desde a ultima vez que a pessoa abriu:
// comunicado da administracao, publicacao nova de outro membro, comentario no
// post dela e curtida no post dela.
//
// Abrir marca tudo como visto. Isso e proposital: e uma marca de tempo, nao
// uma lista de lidos um a um. Simples de entender e sem tabela extra para dar
// manutencao.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Notificacoes, Notificacao, Fmt } from "@/lib/nito-motor";


const INTERVALO_MS = 60000;

/**
 * Sino preenchido, desenhado aqui e nao no conjunto de icones da casca.
 *
 * O motivo e nitidez: os icones do menu sao feitos de traco fino, e traco
 * fino de 1,9 unidade reduzido para 21 pixels cai no meio do pixel e sai
 * esfumacado - principalmente em tela do Windows ampliada em 125%. Forma
 * preenchida nao tem esse problema em tamanho nenhum.
 */
function SinoCheio({ tam = 22 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.4c.86 0 1.55.7 1.55 1.55v.62a6.35 6.35 0 0 1 4.8 6.15v2.94l1.44 2.2a1 1 0 0 1-.84 1.55H5.05a1 1 0 0 1-.84-1.55l1.44-2.2v-2.94a6.35 6.35 0 0 1 4.8-6.15v-.62c0-.85.69-1.55 1.55-1.55z" />
      <path d="M9.5 19.05h5a2.5 2.5 0 0 1-5 0z" />
    </svg>
  );
}

export function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [marca, setMarca] = useState<string | null>(null);
  const [naoVistas, setNaoVistas] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  const buscar = useCallback(async () => {
    try {
      const { marca: ate, itens } = await Notificacoes.painel();
      setLista(itens);
      setMarca(ate);
      setNaoVistas(itens.filter((n) => !ate || n.criado_em > ate).length);
    } catch {
      /* nao chegou agora: a proxima rodada tenta de novo, sem alarde */
    }
  }, []);

  useEffect(() => {
    buscar();
    const t = window.setInterval(buscar, INTERVALO_MS);
    return () => window.clearInterval(t);
  }, [buscar]);

  // Fecha ao clicar fora e no Esc.
  useEffect(() => {
    if (!aberto) return;
    const foraDaCaixa = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false);
    };
    const noEsc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", foraDaCaixa);
    document.addEventListener("keydown", noEsc);
    return () => {
      document.removeEventListener("mousedown", foraDaCaixa);
      document.removeEventListener("keydown", noEsc);
    };
  }, [aberto]);

  async function alternar() {
    const vaiAbrir = !aberto;
    setAberto(vaiAbrir);
    if (!vaiAbrir) return;
    setBuscando(true);
    try {
      const { itens } = await Notificacoes.painel();
      setLista(itens);
      // A lista continua na tela; o que zera e o numerinho.
      await Notificacoes.marcarVistas();
      setMarca(new Date().toISOString());
      setNaoVistas(0);
    } catch {
      /* mantem o que ja estava na tela */
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div ref={caixaRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={alternar}
        aria-label={naoVistas ? `${naoVistas} notificações novas` : "Notificações"}
        title="Notificações"
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: 13,
          display: "grid",
          placeItems: "center",
          background: "var(--surf2)",
          border: "1px solid var(--line)",
          color: naoVistas ? "var(--red)" : "var(--txt)",
          cursor: "pointer",
          flex: "none",
        }}
      >
        <SinoCheio tam={22} />
        {naoVistas > 0 && (
          <span
            style={{
              position: "absolute",
              top: -7,
              right: -7,
              minWidth: 22,
              height: 22,
              padding: "0 6px",
              borderRadius: 999,
              // Vermelho um tom mais fechado que o da marca. O #ff0f3d e claro
              // demais para segurar texto branco: o numero parecia esfumacado,
              // e nao pequeno.
              background: "#d90032",
              color: "#fff",
              // Mesma fonte da etiqueta "ASSINATURA - 61 DIAS", que fica
              // nitida ao lado: fonte de largura fixa, com ajuste de desenho
              // para a grade de pixels. Fonte de titulo, no tamanho de um
              // numerinho, nao tem esse ajuste e sai mole.
              fontFamily: "var(--mono)",
              fontSize: 11.5,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: 0,
              fontVariantNumeric: "tabular-nums",
              textRendering: "geometricPrecision",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Anel desenhado por sombra: fica nitido e nao aumenta a bolinha.
              boxShadow: "0 0 0 2px #07070d",
            }}
          >
            {naoVistas > 9 ? "9+" : naoVistas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 0,
            width: 340,
            maxWidth: "min(340px, calc(100vw - 32px))",
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--surf)",
            border: "1px solid var(--line2)",
            borderRadius: 14,
            boxShadow: "0 24px 60px rgba(0,0,0,.55)",
            zIndex: 200,
            padding: 6,
          }}
        >
          <div
            style={{
              padding: "10px 12px 8px",
              font: "800 .68rem/1 var(--mono)",
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "var(--mut2)",
            }}
          >
            Notificações
          </div>

          {buscando && lista.length === 0 && (
            <div className="muted tiny" style={{ padding: "12px" }}>
              Buscando…
            </div>
          )}

          {!buscando && lista.length === 0 && (
            <div className="muted tiny" style={{ padding: "12px", lineHeight: 1.5 }}>
              Nada nos últimos 7 dias. Quando alguém publicar, comentar ou curtir, aparece aqui.
            </div>
          )}

          {lista.map((n) => {
            const novo = !marca || n.criado_em > marca;
            return (
            <Link
              key={n.id}
              href={n.href}
              onClick={() => setAberto(false)}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 11,
                textDecoration: "none",
                color: "inherit",
                alignItems: "flex-start",
                background: novo ? "rgba(255,15,61,.07)" : "transparent",
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1.35, flex: "none" }}>{n.icone}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <b style={{ display: "block", fontSize: ".83rem", fontWeight: 700, lineHeight: 1.35 }}>
                  {n.titulo}
                </b>
                {n.detalhe && (
                  <span
                    style={{
                      display: "block",
                      fontSize: ".78rem",
                      color: "var(--mut)",
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {n.detalhe}
                  </span>
                )}
                <span
                  className="num"
                  style={{ display: "block", fontSize: ".62rem", color: "var(--mut2)", marginTop: 3, letterSpacing: ".06em" }}
                >
                  {Fmt.quando(n.criado_em).toUpperCase()}
                  {novo && " · NOVO"}
                </span>
              </span>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
