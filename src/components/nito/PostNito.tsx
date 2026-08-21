"use client";

// =============================================================================
// NITO LIVE - cartao de publicacao da comunidade.
// Serve as quatro abas de conteudo (Importante, Seu Resultado, Insights e
// Melhorias). O que muda entre elas e o cabecalho e a enquete.
// =============================================================================

import React, { useState } from "react";
import { Feed, Enquetes, Post, Enquete, Fmt } from "@/lib/nito-motor";
import { patenteDoNivel, iniciais } from "@/lib/nito-gamificacao";
import { Icone } from "./NitoIcones";

const CORES_AVATAR = [
  "linear-gradient(100deg,#a855f7,#6d28d9)",
  "linear-gradient(100deg,#22e6ff,#2b8bff)",
  "linear-gradient(100deg,#ffc23a,#ff8a00)",
  "linear-gradient(100deg,#25e08a,#12b6a0)",
  "linear-gradient(100deg,#ff0f3d,#ff4b2b)",
];

// Sempre a mesma cor para a mesma pessoa.
function corDe(id: string) {
  let n = 0;
  for (const c of id) n = (n + c.charCodeAt(0)) % CORES_AVATAR.length;
  return CORES_AVATAR[n];
}

interface Props {
  post: Post;
  curtiu: boolean;
  admin?: boolean;
  enquete?: Enquete | null;
  onCurtir: (postId: string, curtiu: boolean) => void;
  onVotar?: (enqueteId: string, voto: boolean) => void;
  onAbrirComentarios?: (postId: string) => void;
  onFixar?: (postId: string, fixado: boolean) => void;
}

export function PostNito({
  post,
  curtiu,
  admin = false,
  enquete,
  onCurtir,
  onVotar,
  onAbrirComentarios,
  onFixar,
}: Props) {
  const [ocupado, setOcupado] = useState(false);
  const autor = post.autor ?? {};
  const oficial = post.tipo === "importante";
  const patente = patenteDoNivel(autor.nivel ?? 1);

  const totalVotos = (enquete?.votos_sim ?? 0) + (enquete?.votos_nao ?? 0);
  const pctSim = totalVotos ? Math.round(((enquete?.votos_sim ?? 0) / totalVotos) * 100) : 0;
  const pctNao = totalVotos ? 100 - pctSim : 0;

  async function curtir() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await Feed.alternarCurtida(post.id, curtiu);
      onCurtir(post.id, !curtiu);
    } finally {
      setOcupado(false);
    }
  }

  async function alternarFixado() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await Feed.fixar(post.id, !post.fixado);
      onFixar?.(post.id, !post.fixado);
    } finally {
      setOcupado(false);
    }
  }

  async function votar(voto: boolean) {
    if (!enquete || ocupado) return;
    setOcupado(true);
    try {
      await Enquetes.votar(enquete.id, voto);
      onVotar?.(enquete.id, voto);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article
      className="panel post"
      style={post.fixado ? { borderColor: "rgba(255,194,58,.35)", boxShadow: "0 0 30px rgba(255,194,58,.06)" } : undefined}
    >
      <div className="head">
        <div
          className="av"
          style={{ background: oficial ? "var(--grad)" : corDe(post.autor_id) }}
        >
          {oficial ? "N" : iniciais(autor.nome)}
        </div>
        <div className="who">
          <b>
            {oficial ? "NITO LIVE" : autor.nome ?? "Membro"}
            {oficial ? (
              <span className="pat-chip r">Oficial</span>
            ) : (
              <span className={`pat-chip ${patente.cor}`}>{patente.nome}</span>
            )}
          </b>
          <span>
            {Fmt.quando(post.criado_em).toUpperCase()}
            {post.fixado && " · 📌 FIXADO NO TOPO"}
          </span>
        </div>
      </div>

      {post.imagem_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imagem_url}
          alt=""
          style={{
            width: "100%",
            maxHeight: 260,
            objectFit: "cover",
            borderRadius: 13,
            border: "1px solid var(--line)",
            marginBottom: 13,
            display: "block",
          }}
        />
      )}

      {post.titulo && (
        <div className="corpo" style={{ fontWeight: 800, marginBottom: 6 }}>
          {post.titulo}
        </div>
      )}
      <div className="corpo">{post.conteudo}</div>

      {enquete && (
        <div className="enquete">
          <div className="eq-lab">{enquete.pergunta}</div>
          <div className="eq-op sim">
            <i style={{ width: `${pctSim}%` }} />
            <span>Sim</span>
            <b>{pctSim}%</b>
          </div>
          <div className="eq-op nao">
            <i style={{ width: `${pctNao}%` }} />
            <span>Não</span>
            <b>{pctNao}%</b>
          </div>
          <div className="eq-foot">
            <span>
              {totalVotos} {totalVotos === 1 ? "voto" : "votos"}
              {enquete.meu_voto !== null && enquete.meu_voto !== undefined ? (
                <>
                  {" · você votou "}
                  <b style={{ color: enquete.meu_voto ? "var(--green)" : "var(--red)" }}>
                    {enquete.meu_voto ? "Sim" : "Não"}
                  </b>
                </>
              ) : (
                " · você ainda não votou"
              )}
            </span>
            <div className="row" style={{ gap: 7 }}>
              <button
                className="btn p"
                style={{ padding: "7px 14px", fontSize: ".68rem" }}
                onClick={() => votar(true)}
                disabled={ocupado}
                type="button"
              >
                Sim
              </button>
              <button
                className="btn g"
                style={{ padding: "7px 14px", fontSize: ".68rem" }}
                onClick={() => votar(false)}
                disabled={ocupado}
                type="button"
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="acoes">
        <button className={curtiu ? "liked" : ""} onClick={curtir} disabled={ocupado} type="button">
          <Icone nome="heart" tam={16} />
          {post.curtidas_count ?? 0}
        </button>
        <button onClick={() => onAbrirComentarios?.(post.id)} type="button">
          <Icone nome="msg" tam={16} />
          {post.comentarios_count ?? 0}{" "}
          {(post.comentarios_count ?? 0) === 1 ? "comentário" : "comentários"}
        </button>
        {admin && (
          <button
            style={{ marginLeft: "auto", color: post.fixado ? "var(--gold)" : "var(--mut2)" }}
            onClick={alternarFixado}
            disabled={ocupado}
            type="button"
            title={post.fixado ? "Tirar do topo" : "Fixar no topo"}
          >
            📌 {post.fixado ? "Fixado" : "Fixar"}
          </button>
        )}

        {post.situacao === "em_analise" && (
          <button style={{ marginLeft: "auto", color: "var(--gold)" }} type="button">
            ★ Em análise
          </button>
        )}
      </div>
    </article>
  );
}
