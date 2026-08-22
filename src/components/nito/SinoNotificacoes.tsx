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
import { Icone } from "./NitoIcones";

const INTERVALO_MS = 60000;

export function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [naoVistas, setNaoVistas] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  const buscar = useCallback(async () => {
    try {
      const nova = await Notificacoes.listar();
      setLista(nova);
      setNaoVistas(nova.length);
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
      const nova = await Notificacoes.listar();
      setLista(nova);
      // A lista continua na tela; o que zera e o numerinho.
      await Notificacoes.marcarVistas();
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
          width: 42,
          height: 42,
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
        <Icone nome="bell" tam={20} />
        {naoVistas > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 20,
              height: 20,
              padding: "0 5px",
              borderRadius: 999,
              background: "#ff0f3d",
              color: "#fff",
              // Medidas em pixel e sem brilho de proposito: a barra do topo tem
              // desfoque atras, e sombra vermelha somada a borda escura fazia o
              // numero sair borrado, parecendo baixa resolucao.
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: 0,
              fontVariantNumeric: "tabular-nums",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Anel do tamanho exato, desenhado por sombra: fica nitido, e nao
              // empurra o tamanho da bolinha como uma borda faria.
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
              Nada novo por aqui. Quando alguém publicar, comentar ou curtir, aparece nesta lista.
            </div>
          )}

          {lista.map((n) => (
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
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
