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
 * Sino de traco, no estilo do YouTube.
 *
 * Medidas escolhidas para nao borrar: o desenho tem 24 unidades e e mostrado
 * em 24 pixels, entao cada unidade vale exatamente um pixel. O traco tem 2 de
 * espessura — numero par, que cai no meio de dois pixels inteiros em vez de
 * ficar na fronteira. Foi traco quebrado (1,9 unidade em 21 pixels) que deixou
 * o sino esfumacado da primeira vez.
 */
function SinoTraco({ tam = 24 }: { tam?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 9a6 6 0 1 0-12 0c0 4-1.5 5-2 6h16c-.5-1-2-2-2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
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
        // Sem caixa em volta, como no YouTube: so o desenho e a bolinha. O
        // alvo de clique continua com 40 pixels para o dedo acertar no celular.
        style={{
          position: "relative",
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: aberto ? "rgba(255,255,255,.08)" : "transparent",
          border: 0,
          color: "var(--txt)",
          cursor: "pointer",
          flex: "none",
          transition: "background .15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = aberto ? "rgba(255,255,255,.08)" : "transparent"; }}
      >
        <SinoTraco tam={24} />
        {naoVistas > 0 && (
          <span
            style={{
              position: "absolute",
              // Encosta no sino em vez de flutuar no canto, como no YouTube.
              top: 2,
              right: 1,
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
              boxShadow: "0 0 0 2px var(--bg, #07070d)",
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
            top: 46,
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
