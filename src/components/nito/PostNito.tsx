"use client";

// =============================================================================
// NITO LIVE - cartao de publicacao da comunidade.
// Serve as quatro abas de conteudo (Importante, Seu Resultado, Insights e
// Melhorias). O que muda entre elas e o cabecalho e a enquete.
// =============================================================================

import React, { useEffect, useState } from "react";
import { Feed, Enquetes, Post, Enquete, OpcaoEnquete, Comentario, Fmt, comoErro } from "@/lib/nito-motor";
import { patenteDoNivel, iniciais, ehVerificado } from "@/lib/nito-gamificacao";
import { SeloVerificado } from "./NitoIcones";
import { Avatar } from "./Avatar";

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
/**
 * Coracao e balao preenchidos, desenhados aqui e nao no conjunto de icones.
 *
 * Os icones do menu sao de traco fino. Traco de 1,9 unidade reduzido para 16
 * pixels vira 1,27 pixel de espessura, cai no meio do pixel e sai esfumacado —
 * era por isso que o coracao parecia de qualidade pior que o numero do lado.
 * Forma cheia nao tem esse problema em tamanho nenhum.
 */
function Coracao({ tam = 17, cheio = false }: { tam?: number; cheio?: boolean }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true"
         fill={cheio ? "currentColor" : "none"} stroke="currentColor" strokeWidth={cheio ? 0 : 2}
         strokeLinejoin="round">
      <path d="M12 20.6c-.3 0-.6-.1-.8-.3C7.4 17 4 14 4 10.4A4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 8 3.4c0 3.6-3.4 6.6-7.2 9.9-.2.2-.5.3-.8.3z" />
    </svg>
  );
}

function Balao({ tam = 17 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.6c-5.1 0-9.2 3.4-9.2 7.6 0 2.3 1.3 4.4 3.3 5.8l-.9 3.9c-.1.4.3.7.7.5l4.2-2.3c.6.1 1.3.1 1.9.1 5.1 0 9.2-3.4 9.2-7.6S17.1 3.6 12 3.6z" />
    </svg>
  );
}

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
  onEditar?: (postId: string, dados: { titulo?: string | null; conteudo: string }) => void;
  onApagar?: (postId: string) => void;
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
  onEditar,
  onApagar,
}: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  const [editando, setEditando] = useState(false);
  const [tituloEdit, setTituloEdit] = useState(post.titulo ?? "");
  const [conteudoEdit, setConteudoEdit] = useState(post.conteudo);

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

  // Enquete de caixas. O estado fica aqui porque o clique precisa mudar a barra
  // na hora, sem esperar a tela inteira recarregar.
  const [opcoes, setOpcoes] = useState<OpcaoEnquete[]>(enquete?.opcoes ?? []);
  const [minhaOpcao, setMinhaOpcao] = useState<string | null>(enquete?.minha_opcao ?? null);
  useEffect(() => {
    setOpcoes(enquete?.opcoes ?? []);
    setMinhaOpcao(enquete?.minha_opcao ?? null);
  }, [enquete]);

  const temOpcoes = opcoes.length >= 2;
  const totalOpcoes = opcoes.reduce((soma, o) => soma + (o.votos ?? 0), 0);

  async function votarNaOpcao(opcaoId: string) {
    if (!enquete || ocupado || opcaoId === minhaOpcao) return;
    setOcupado(true);
    const anterior = minhaOpcao;
    // Move a barra antes da resposta do servidor: se falhar, volta atras.
    setMinhaOpcao(opcaoId);
    setOpcoes((atual) =>
      atual.map((o) => {
        if (o.id === opcaoId) return { ...o, votos: (o.votos ?? 0) + 1 };
        if (o.id === anterior) return { ...o, votos: Math.max(0, (o.votos ?? 0) - 1) };
        return o;
      })
    );
    try {
      await Enquetes.votarOpcao(enquete.id, opcaoId);
    } catch {
      setMinhaOpcao(anterior);
      setOpcoes((atual) =>
        atual.map((o) => {
          if (o.id === opcaoId) return { ...o, votos: Math.max(0, (o.votos ?? 0) - 1) };
          if (o.id === anterior) return { ...o, votos: (o.votos ?? 0) + 1 };
          return o;
        })
      );
    } finally {
      setOcupado(false);
    }
  }

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

  function iniciarEdicao() {
    setTituloEdit(post.titulo ?? "");
    setConteudoEdit(post.conteudo);
    setEditando(true);
  }

  function salvarEdicao() {
    const limpo = conteudoEdit.trim();
    if (!limpo) return;
    onEditar?.(post.id, { titulo: tituloEdit.trim() || null, conteudo: limpo });
    setEditando(false);
  }

  function apagar() {
    if (window.confirm("Excluir esta publicação? Essa ação não pode ser desfeita.")) {
      onApagar?.(post.id);
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
        <Avatar
          className="av"
          nome={autor.nome}
          // Comunicado oficial mantem o selo da marca, nao a foto de quem
          // publicou: quem fala ali e a NITO LIVE.
          url={oficial ? null : autor.avatar_url}
          texto={oficial ? "N" : undefined}
          style={{ background: oficial ? "var(--grad)" : corDe(post.autor_id ?? autor.id) }}
        />
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

      {post.imagem_url && post.midia_tipo === "audio" && (
        <audio controls src={post.imagem_url} style={{ width: "100%", marginBottom: 13, display: "block" }} />
      )}

      {post.imagem_url && post.midia_tipo !== "audio" && (
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

      {post.imagem_url && post.midia_tipo !== "audio" && ampliada && (
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

      {editando ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={tituloEdit}
            onChange={(e) => setTituloEdit(e.target.value)}
            placeholder="Título (opcional)"
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              background: "rgba(0,0,0,.42)",
              border: "1px solid var(--line)",
              color: "var(--txt)",
              font: "inherit",
              fontWeight: 800,
              fontSize: ".92rem",
            }}
          />
          <textarea
            rows={4}
            value={conteudoEdit}
            onChange={(e) => setConteudoEdit(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 10,
              background: "rgba(0,0,0,.42)",
              border: "1px solid var(--line)",
              color: "var(--txt)",
              font: "inherit",
              fontSize: ".87rem",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn g"
              type="button"
              onClick={() => setEditando(false)}
              style={{ padding: "8px 14px", fontSize: ".7rem" }}
            >
              Cancelar
            </button>
            <button
              className="btn p"
              type="button"
              onClick={salvarEdicao}
              disabled={!conteudoEdit.trim()}
              style={{ padding: "8px 14px", fontSize: ".7rem" }}
            >
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}

      {enquete && temOpcoes && (
        <div className="enquete">
          <div className="eq-lab">{enquete.pergunta}</div>

          <div className="stack" style={{ gap: 7 }}>
            {opcoes.map((o) => {
              const pct = totalOpcoes ? Math.round(((o.votos ?? 0) / totalOpcoes) * 100) : 0;
              const minha = o.id === minhaOpcao;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => votarNaOpcao(o.id)}
                  disabled={ocupado}
                  style={{
                    position: "relative",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 13px",
                    borderRadius: 11,
                    overflow: "hidden",
                    cursor: ocupado ? "default" : "pointer",
                    background: "rgba(0,0,0,.35)",
                    border: `1px solid ${minha ? "var(--red)" : "var(--line)"}`,
                    color: "var(--txt)",
                    font: "inherit",
                  }}
                >
                  {/* A barra fica atras do texto, nao no lugar dele. */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${pct}%`,
                      background: minha ? "rgba(255,15,61,.28)" : "rgba(255,255,255,.07)",
                      transition: "width .35s ease",
                    }}
                  />
                  <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: ".88rem", fontWeight: minha ? 700 : 500 }}>
                      {minha && "✓ "}
                      {o.texto}
                    </span>
                    <span className="num" style={{ flex: "none", fontSize: ".76rem", fontWeight: 800 }}>
                      {pct}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="eq-foot" style={{ marginTop: 10 }}>
            <span>
              {totalOpcoes} {totalOpcoes === 1 ? "voto" : "votos"}
              {minhaOpcao ? " · toque em outra opção para trocar seu voto" : " · você ainda não votou"}
            </span>
          </div>
        </div>
      )}

      {enquete && !temOpcoes && (
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
          <Coracao tam={17} cheio={curtiu} />
          {/* O numero vai na fonte de largura fixa, a mesma da etiqueta de
              assinatura: ela tem ajuste para a grade de pixels e fica nitida
              em tamanho pequeno, coisa que a fonte de texto nao tem. */}
          <span className="num" style={{ fontSize: ".78rem", fontWeight: 800 }}>
            {post.curtidas_count ?? 0}
          </span>
        </button>
        <button
          onClick={alternarComentarios}
          type="button"
          style={abertos ? { color: "var(--txt)", background: "rgba(255,255,255,.05)" } : undefined}
        >
          <Balao tam={17} />
          <span className="num" style={{ fontSize: ".78rem", fontWeight: 800 }}>{total}</span>
          <span>{total === 1 ? "comentário" : "comentários"}</span>
        </button>
        {admin && !editando && (
          <>
            <button
              style={{ marginLeft: "auto", color: post.fixado ? "var(--gold)" : "var(--mut2)" }}
              onClick={alternarFixado}
              disabled={ocupado}
              type="button"
              title={post.fixado ? "Tirar do topo" : "Fixar no topo"}
            >
              📌 {post.fixado ? "Fixado" : "Fixar"}
            </button>
            <button
              style={{ color: "var(--mut2)" }}
              onClick={iniciarEdicao}
              disabled={ocupado}
              type="button"
              title="Editar publicação"
            >
              ✏️ Editar
            </button>
            <button
              style={{ color: "var(--red)" }}
              onClick={apagar}
              disabled={ocupado}
              type="button"
              title="Excluir publicação"
            >
              🗑️ Excluir
            </button>
          </>
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
                <Avatar
                  nome={c.autor?.nome}
                  url={c.autor?.avatar_url}
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
                />
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
