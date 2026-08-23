"use client";

// =============================================================================
// NITO LIVE - cartao de publicacao da comunidade.
// Serve as quatro abas de conteudo (Importante, Seu Resultado, Insights e
// Melhorias). O que muda entre elas e o cabecalho e a enquete.
// =============================================================================

import React, { useState } from "react";
import { Feed, Enquetes, Post, Enquete, Comentario, Fmt, comoErro } from "@/lib/nito-motor";
import { patenteDoNivel, iniciais, ehVerificado } from "@/lib/nito-gamificacao";
import { Icone, SeloVerificado } from "./NitoIcones";

const CORES_AVATAR = [
  "linear-gradient(100deg,#a855f7,#6d28d9)",
  "linear-gradient(100deg,#22e6ff,#2b8bff)",
  "linear-gradient(100deg,#ffc23a,#ff8a00)",
  "linear-gradient(100deg,#25e08a,#12b6a0)",
  "linear-gradient(100deg,#ff0f3d,#ff4b2b)",
];

// Sempre a mesma cor para a mesma pessoa.
//
// Aceita vazio de proposito. Antes esta funcao percorria o texto direto e, se
// o identificador chegasse vazio, o percurso estourava e levava a aba inteira
// junto - uma cor de avatar nunca pode derrubar a tela.
function corDe(id?: string | null) {
  const chave = String(id ?? "");
  if (!chave) return CORES_AVATAR[0];
  let n = 0;
  for (const c of chave) n = (n + c.charCodeAt(0)) % CORES_AVATAR.length;
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
  const [ampliada, setAmpliada] = useState(false);

  // ---- comentarios --------------------------------------------------------
  // Ficam dentro do proprio cartao. Sao buscados na primeira vez que a pessoa
  // abre, e nao no carregamento da aba: numa lista de vinte publicacoes isso
  // seriam vinte consultas que quase ninguem ia ler.
  const [abertos, setAbertos] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroCom, setErroCom] = useState<string | null>(null);
  // Contagem propria: a do banco so volta a bater no proximo carregamento, e
  // ate la a pessoa precisa ver o comentario dela contado.
  const [total, setTotal] = useState(post.comentarios_count ?? 0);
  const autor = post.autor ?? {};
  const oficial = post.tipo === "importante";
  const patente = patenteDoNivel(autor.nivel ?? 1);

  const totalVotos = (enquete?.votos_sim ?? 0) + (enquete?.votos_nao ?? 0);
  const pctSim = totalVotos ? Math.round(((enquete?.votos_sim ?? 0) / totalVotos) * 100) : 0;
  const pctNao = totalVotos ? 100 - pctSim : 0;

  async function alternarComentarios() {
    onAbrirComentarios?.(post.id);
    const vaiAbrir = !abertos;
    setAbertos(vaiAbrir);
    if (!vaiAbrir || comentarios !== null || buscando) return;
    setBuscando(true);
    setErroCom(null);
    try {
      setComentarios(await Feed.comentarios(post.id));
    } catch (e) {
      setComentarios([]);
      setErroCom(comoErro(e, "Nao consegui carregar os comentarios.").message);
    } finally {
      setBuscando(false);
    }
  }

  async function enviarComentario() {
    const limpo = texto.trim();
    if (!limpo || enviando) return;
    setEnviando(true);
    setErroCom(null);
    try {
      const novo = await Feed.comentar(post.id, limpo);
      setComentarios((antes) => [...(antes ?? []), novo]);
      setTotal((n) => n + 1);
      setTexto("");
    } catch (e) {
      // Falha de comentario nao pode sumir calada: a pessoa escreveu e precisa
      // saber que nao entrou, e por que.
      setErroCom(comoErro(e, "Nao consegui publicar seu comentario.").message);
    } finally {
      setEnviando(false);
    }
  }

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
      style={{
        maxWidth: 520,
        marginLeft: "auto",
        marginRight: "auto",
        ...(post.fixado
          ? { borderColor: "rgba(255,194,58,.35)", boxShadow: "0 0 30px rgba(255,194,58,.06)" }
          : null),
      }}
    >
      <div className="head">
        <div
          className="av"
          style={{ background: oficial ? "var(--grad)" : corDe(post.autor_id ?? autor.id) }}
        >
          {oficial ? "N" : iniciais(autor.nome)}
        </div>
        <div className="who">
          <b>
            {oficial ? "NITO LIVE" : autor.nome ?? "Membro"}
            {(oficial || ehVerificado(autor.papel)) && <SeloVerificado />}
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
        <div style={{ position: "relative", marginBottom: 13 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imagem_url}
            alt=""
            onClick={() => setAmpliada(true)}
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              borderRadius: 13,
              border: "1px solid var(--line)",
              display: "block",
              cursor: "zoom-in",
            }}
          />
          <button
            type="button"
            onClick={() => setAmpliada(true)}
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              padding: "6px 12px",
              fontSize: ".68rem",
              fontWeight: 700,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.25)",
              background: "rgba(0,0,0,.55)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Ver imagem
          </button>
        </div>
      )}

      {post.imagem_url && ampliada && (
        <div
          onClick={() => setAmpliada(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(4,5,10,.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imagem_url}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 13,
              objectFit: "contain",
            }}
          />
        </div>
      )}

      {post.titulo && (
        <div className="corpo" style={{ fontWeight: 800, marginBottom: 6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {post.titulo}
        </div>
      )}
      {/* "pre-wrap" preserva as quebras de linha que a pessoa digitou. Sem ele o
          navegador junta tudo num paragrafo so, e o texto perde o formato que
          o autor deu. Nao interpreta marcacao nenhuma: o que foi escrito e o
          que aparece, sem risco de alguem injetar HTML pelo campo de texto. */}
      <div className="corpo" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {post.conteudo}
      </div>

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
        <button
          onClick={alternarComentarios}
          type="button"
          style={abertos ? { color: "var(--txt)", background: "rgba(255,255,255,.05)" } : undefined}
        >
          <Icone nome="msg" tam={16} />
          {total} {total === 1 ? "comentário" : "comentários"}
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

      {abertos && (
        <div style={{ marginTop: 12, paddingTop: 13, borderTop: "1px solid var(--line)" }}>
          {buscando && (
            <div className="muted tiny" style={{ padding: "6px 0" }}>
              Carregando comentários…
            </div>
          )}

          {!buscando && comentarios && comentarios.length === 0 && (
            <div className="muted tiny" style={{ padding: "6px 0" }}>
              Nenhum comentário ainda. Seja o primeiro a responder.
            </div>
          )}

          {!buscando &&
            comentarios?.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 10, padding: "9px 0" }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flex: "none",
                    display: "grid",
                    placeItems: "center",
                    font: "800 .72rem/1 var(--disp)",
                    color: "#fff",
                    background: corDe(c.autor_id ?? c.autor?.id),
                  }}
                >
                  {iniciais(c.autor?.nome)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <b style={{ fontSize: ".82rem", fontWeight: 700 }}>{c.autor?.nome ?? "Membro"}</b>
                    {ehVerificado(c.autor?.papel) && <SeloVerificado tam={13} />}
                    <span className="num" style={{ fontSize: ".62rem", color: "var(--mut2)", letterSpacing: ".06em" }}>
                      {Fmt.quando(c.criado_em).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: ".87rem", color: "#dfe2ea", marginTop: 2, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                    {c.conteudo}
                  </div>
                </div>
              </div>
            ))}

          <div style={{ display: "flex", gap: 9, marginTop: 10, alignItems: "flex-end" }}>
            <textarea
              rows={1}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                // Enter envia; Shift+Enter pula linha. E o que a pessoa espera
                // de uma caixa de comentario.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarComentario();
                }
              }}
              placeholder="Escreva um comentário…"
              style={{
                flex: 1,
                minWidth: 0,
                resize: "vertical",
                padding: "10px 13px",
                borderRadius: 11,
                background: "rgba(0,0,0,.42)",
                border: "1px solid var(--line)",
                color: "var(--txt)",
                font: "inherit",
                fontSize: ".87rem",
              }}
            />
            <button
              className="btn p"
              type="button"
              onClick={enviarComentario}
              disabled={!texto.trim() || enviando}
              style={{ padding: "10px 16px", fontSize: ".68rem", flex: "none" }}
            >
              {enviando ? "Enviando…" : "Comentar"}
            </button>
          </div>

          {erroCom && (
            <div style={{ fontSize: ".78rem", color: "var(--red)", marginTop: 8, lineHeight: 1.45 }}>
              {erroCom}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
