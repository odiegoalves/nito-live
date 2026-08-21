"use client";

// =============================================================================
// NITO LIVE - caixa de publicar.
// Em "Seu Resultado" a foto e obrigatoria: o botao so acende quando ha imagem
// E texto. O banco recusa o contrario de qualquer jeito, isso aqui e so para
// a pessoa perceber a regra antes de tentar.
// =============================================================================

import React, { useRef, useState } from "react";
import { Feed, Enquetes, TipoPost, Post } from "@/lib/nito-motor";
import { iniciais } from "@/lib/nito-gamificacao";

interface Props {
  tipo: TipoPost;
  nomeAutor: string;
  exigeFoto?: boolean;
  permiteEnquete?: boolean;
  placeholder: string;
  rotuloBotao: string;
  onPublicado: (post: Post) => void;
}

export function CompositorNito({
  tipo,
  nomeAutor,
  exigeFoto = false,
  permiteEnquete = false,
  placeholder,
  rotuloBotao,
  onPublicado,
}: Props) {
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [comEnquete, setComEnquete] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function escolher(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErro("Só imagem aqui. Escolha um arquivo JPG ou PNG.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErro("Imagem muito grande. O limite é 5 MB.");
      return;
    }
    setErro(null);
    setArquivo(f);
    setPrevia(URL.createObjectURL(f));
  }

  const podePublicar = texto.trim().length > 0 && (!exigeFoto || !!arquivo);

  async function publicar() {
    if (!podePublicar || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const post = await Feed.criar({ conteudo: texto.trim(), imagemFile: arquivo, tipo });
      if (permiteEnquete && comEnquete) {
        try {
          await Enquetes.abrir(post.id);
        } catch {
          /* a sugestao vale mesmo sem a enquete */
        }
      }
      setTexto("");
      setArquivo(null);
      setPrevia(null);
      onPublicado(post);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui publicar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="panel pad compositor">
      <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
        <div
          className="av"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--grad)",
            display: "grid",
            placeItems: "center",
            font: "900 .9rem/1 var(--disp)",
            flex: "none",
          }}
        >
          {iniciais(nomeAutor)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {exigeFoto &&
            (previa ? (
              <div style={{ position: "relative", marginBottom: 11 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previa}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 13,
                    border: "1px solid var(--line)",
                    display: "block",
                  }}
                />
                <button
                  className="btn g"
                  style={{ position: "absolute", top: 10, right: 10, padding: "7px 12px", fontSize: ".64rem" }}
                  onClick={() => {
                    setArquivo(null);
                    setPrevia(null);
                  }}
                  type="button"
                >
                  Trocar foto
                </button>
              </div>
            ) : (
              <div
                className="dropzone"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  escolher(e.dataTransfer.files?.[0] ?? null);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              >
                <div className="dz-ic">📷</div>
                <b>Arraste seu print aqui</b>
                <span>ou toque para escolher do computador ou da galeria do celular</span>
              </div>
            ))}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => escolher(e.target.files?.[0] ?? null)}
          />

          <textarea
            rows={2}
            placeholder={placeholder}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          {erro && (
            <div className="aviso erro" style={{ marginTop: 11, marginBottom: 0 }}>
              <span className="avisoIcone">!</span>
              <div>{erro}</div>
            </div>
          )}

          <div className="spread" style={{ marginTop: 11, flexWrap: "wrap", gap: 10 }}>
            {exigeFoto ? (
              <span className="regra">⚠️ Aqui a foto é obrigatória. Publicação só com texto não entra.</span>
            ) : permiteEnquete ? (
              <label className="check">
                <input
                  type="checkbox"
                  checked={comEnquete}
                  onChange={(e) => setComEnquete(e.target.checked)}
                />
                Abrir enquete Sim / Não
              </label>
            ) : (
              <span className="regra muted">Foto é opcional aqui.</span>
            )}

            <button className="btn p" onClick={publicar} disabled={!podePublicar || enviando} type="button">
              {enviando ? "Publicando…" : rotuloBotao}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
