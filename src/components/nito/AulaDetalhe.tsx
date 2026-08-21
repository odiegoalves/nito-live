"use client";

// =============================================================================
// NITO LIVE - a aula aberta.
// Video, descricao, materiais, curtir e comentar. O video vem por link
// (YouTube, Vimeo ou arquivo direto), entao nao pesa no Storage.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { Aulas, AulasAdmin, Aula, AulaMaterial, AulaComentario, Fmt } from "@/lib/nito-motor";
import { iniciais } from "@/lib/nito-gamificacao";
import { Icone } from "./NitoIcones";

// Descobre como tocar o endereco que o administrador colou.
// Aceita YouTube, Vimeo, os players de curso (Panda, Bunny, Cakto), qualquer
// pagina de incorporacao, e arquivo de video direto.
export function paraEmbed(url?: string | null): { tipo: "iframe" | "video" | null; src: string } {
  const limpo = (url ?? "").trim();
  if (!limpo) return { tipo: null, src: "" };

  // Se colaram o <iframe ...> inteiro, aproveita o endereco de dentro.
  const dentroDoIframe = limpo.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const alvo = dentroDoIframe ? dentroDoIframe[1] : limpo;

  const yt = alvo.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { tipo: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?rel=0&playsinline=1` };

  const vm = alvo.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { tipo: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };

  // Arquivo de video direto (Bunny, Cakto, Supabase, servidor proprio...).
  if (/\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i.test(alvo)) return { tipo: "video", src: alvo };

  // Qualquer outro player de incorporacao: Panda, Bunny iframe, Cakto etc.
  if (/^https?:\/\//i.test(alvo)) return { tipo: "iframe", src: alvo };

  return { tipo: null, src: "" };
}

function tamanho(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  aula: Aula;
  admin: boolean;
  materiais: AulaMaterial[];
  curtiu: boolean;
  curtidas: number;
  onCurtir: (aulaId: string, curtiu: boolean) => void;
  onFechar: () => void;
  onMaterialNovo: (m: AulaMaterial) => void;
}

export function AulaDetalhe({
  aula,
  admin,
  materiais,
  curtiu,
  curtidas,
  onCurtir,
  onFechar,
  onMaterialNovo,
}: Props) {
  const [comentarios, setComentarios] = useState<AulaComentario[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // formulario de material (so admin)
  const [mTitulo, setMTitulo] = useState("");
  const [mTipo, setMTipo] = useState<"arquivo" | "link">("arquivo");
  const [mUrl, setMUrl] = useState("");
  const [mArquivo, setMArquivo] = useState<File | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const video = paraEmbed(aula.video_url);

  useEffect(() => {
    Aulas.comentarios(aula.id)
      .then(setComentarios)
      .catch(() => setComentarios([]));
  }, [aula.id]);

  async function curtir() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await Aulas.alternarCurtida(aula.id, curtiu);
      onCurtir(aula.id, !curtiu);
    } finally {
      setOcupado(false);
    }
  }

  async function comentar() {
    if (!texto.trim() || ocupado) return;
    setOcupado(true);
    try {
      const novo = await Aulas.comentar(aula.id, texto);
      setComentarios((a) => [...a, novo]);
      setTexto("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui comentar.");
    } finally {
      setOcupado(false);
    }
  }

  async function anexar() {
    if (!mTitulo.trim() || ocupado) return;
    setOcupado(true);
    setErro(null);
    try {
      const m = await AulasAdmin.anexarMaterial(aula.id, {
        titulo: mTitulo.trim(),
        tipo: mTipo,
        url: mUrl.trim(),
        arquivo: mArquivo,
        ordem: materiais.length + 1,
      });
      onMaterialNovo(m);
      setMTitulo("");
      setMUrl("");
      setMArquivo(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui anexar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="panel pad" style={{ marginBottom: 18 }}>
      <div className="spread" style={{ marginBottom: 16 }}>
        <div className="eyebrow">{aula.modulo?.toUpperCase()} · AULA {aula.ordem}</div>
        <button className="btn g" onClick={onFechar} type="button">
          Fechar aula
        </button>
      </div>

      <div className="grid2">
        <div>
          {video.tipo === "iframe" && (
            <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 13, overflow: "hidden", border: "1px solid var(--line)" }}>
              <iframe
                src={video.src}
                title={aula.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </div>
          )}
          {video.tipo === "video" && (
            <video
              src={video.src}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              playsInline
              style={{ width: "100%", borderRadius: 13, border: "1px solid var(--line)", display: "block", background: "#000" }}
            />
          )}
          {!video.tipo && (
            <div className="foto-post" style={{ aspectRatio: "16/9" }}>
              <div className="fp-ic">▶</div>
              <span>vídeo ainda não publicado</span>
            </div>
          )}

          <h3 style={{ font: "900 1.1rem/1.2 var(--disp)", textTransform: "uppercase", margin: "15px 0 8px" }}>
            {aula.titulo}
          </h3>
          {aula.descricao && <p style={{ fontSize: ".9rem", color: "#dfe2ea" }}>{aula.descricao}</p>}

          <div className="acoes" style={{ marginTop: 15 }}>
            <button className={curtiu ? "liked" : ""} onClick={curtir} disabled={ocupado} type="button">
              <Icone nome="heart" tam={16} />
              {curtidas}
            </button>
            <button type="button">
              <Icone nome="msg" tam={16} />
              {comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            {comentarios.map((c) => (
              <div className="msg" key={c.id} style={{ marginBottom: 10 }}>
                <div className="av" style={{ background: "var(--surf3)" }}>{iniciais(c.autor?.nome)}</div>
                <div className="bal">
                  <b style={{ color: "var(--txt)" }}>{c.autor?.nome ?? "Membro"}</b>
                  <p>{c.conteudo}</p>
                  <span className="eyebrow" style={{ display: "block", marginTop: 5 }}>
                    {Fmt.quando(c.criado_em).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}

            <div className="chat-input" style={{ marginTop: 12 }}>
              <input
                placeholder="Escreva um comentário…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && comentar()}
              />
              <button onClick={comentar} disabled={ocupado} type="button" aria-label="Comentar">
                <Icone nome="send" tam={16} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 11 }}>MATERIAL DESTA AULA</div>

          {materiais.length === 0 && <div className="muted tiny">Nenhum material anexado.</div>}

          {materiais.map((m) => (
            <a
              className="material"
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="mi">{m.tipo === "link" ? "🔗" : "📄"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{m.titulo}</b>
                <span>{m.tipo === "link" ? "link externo" : tamanho(m.tamanho_bytes)}</span>
              </div>
              <span className="go">{m.tipo === "link" ? "ABRIR" : "BAIXAR"}</span>
            </a>
          ))}

          {admin && (
            <div className="admin-bar" style={{ marginTop: 15, display: "block", padding: "14px 16px" }}>
              <div className="row" style={{ marginBottom: 11 }}>
                <span className="tag">ADMIN</span>
                <b style={{ fontSize: ".82rem" }}>Anexar material</b>
              </div>

              <div className="campo" style={{ marginBottom: 10 }}>
                <label>Título</label>
                <input value={mTitulo} onChange={(e) => setMTitulo(e.target.value)} placeholder="Roteiro de live — modelo" />
              </div>

              <div className="periodo" style={{ marginBottom: 10 }}>
                <button className={mTipo === "arquivo" ? "on" : ""} onClick={() => setMTipo("arquivo")} type="button">Arquivo</button>
                <button className={mTipo === "link" ? "on" : ""} onClick={() => setMTipo("link")} type="button">Link</button>
              </div>

              {mTipo === "link" ? (
                <div className="campo" style={{ marginBottom: 10 }}>
                  <label>Endereço</label>
                  <input value={mUrl} onChange={(e) => setMUrl(e.target.value)} placeholder="https://…" />
                </div>
              ) : (
                <>
                  <input ref={arquivoRef} type="file" hidden onChange={(e) => setMArquivo(e.target.files?.[0] ?? null)} />
                  <button className="btn g" style={{ marginBottom: 10 }} onClick={() => arquivoRef.current?.click()} type="button">
                    {mArquivo ? `${mArquivo.name} (${tamanho(mArquivo.size)})` : "Escolher arquivo"}
                  </button>
                </>
              )}

              {erro && <div className="regra" style={{ display: "block", marginBottom: 9 }}>{erro}</div>}

              <button className="btn gold" onClick={anexar} disabled={ocupado || !mTitulo.trim()} type="button">
                {ocupado ? "Anexando…" : "Anexar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
