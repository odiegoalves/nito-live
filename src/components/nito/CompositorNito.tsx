"use client";

// =============================================================================
// NITO LIVE - caixa de publicar.
// Em "Seu Resultado" a foto e obrigatoria: o botao so acende quando ha imagem
// E texto. O banco recusa o contrario de qualquer jeito, isso aqui e so para
// a pessoa perceber a regra antes de tentar.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { Feed, Enquetes, TipoPost, Post, comoErro } from "@/lib/nito-motor";
import { Avatar } from "./Avatar";
import { Icone } from "./NitoIcones";

interface Props {
  tipo: TipoPost;
  nomeAutor: string;
  /** foto de quem esta escrevendo; sem ela mostra as iniciais */
  avatarAutor?: string | null;
  exigeFoto?: boolean;
  permiteEnquete?: boolean;
  permiteFixar?: boolean;
  /** grava e anexa um áudio ao comunicado — hoje só liberado pra quem pode publicar em Importante */
  permiteAudio?: boolean;
  placeholder: string;
  rotuloBotao: string;
  onPublicado: (post: Post) => void;
}

export function CompositorNito({
  tipo,
  nomeAutor,
  avatarAutor,
  exigeFoto = false,
  permiteEnquete = false,
  permiteFixar = false,
  permiteAudio = false,
  placeholder,
  rotuloBotao,
  onPublicado,
}: Props) {
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [gravando, setGravando] = useState(false);
  const [segundosGravando, setSegundosGravando] = useState(0);
  const gravadorRef = useRef<MediaRecorder | null>(null);
  const pedacosRef = useRef<Blob[]>([]);
  const trilhaRef = useRef<MediaStream | null>(null);
  const cronometroRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [comEnquete, setComEnquete] = useState(true);
  // Opcoes da enquete. Vazio = enquete Sim/Nao, como sempre foi. Com duas ou
  // mais preenchidas, vira votacao em caixas.
  const [opcoes, setOpcoes] = useState<string[]>(["", ""]);
  const [fixar, setFixar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textoRef = useRef<HTMLTextAreaElement>(null);

  async function iniciarGravacao() {
    if (gravando) return;
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      trilhaRef.current = stream;
      pedacosRef.current = [];

      const mtipo = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const gravador = mtipo ? new MediaRecorder(stream, { mimeType: mtipo }) : new MediaRecorder(stream);
      gravadorRef.current = gravador;

      gravador.ondataavailable = (e) => {
        if (e.data.size > 0) pedacosRef.current.push(e.data);
      };
      gravador.onstop = () => {
        const blob = new Blob(pedacosRef.current, { type: gravador.mimeType || "audio/webm" });
        const ext = (gravador.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        setAudio(new File([blob], `audio-${Date.now()}.${ext}`, { type: blob.type }));
        trilhaRef.current?.getTracks().forEach((t) => t.stop());
        trilhaRef.current = null;
      };

      gravador.start();
      setGravando(true);
      setSegundosGravando(0);
      cronometroRef.current = setInterval(() => setSegundosGravando((s) => s + 1), 1000);
    } catch {
      setErro("Não consegui acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  function pararGravacao() {
    gravadorRef.current?.stop();
    setGravando(false);
    if (cronometroRef.current) {
      clearInterval(cronometroRef.current);
      cronometroRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (cronometroRef.current) clearInterval(cronometroRef.current);
      trilhaRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // A caixa cresce conforme a pessoa escreve, ate um teto. Sem isto ela fica
  // com duas linhas fixas e quem escreve um comunicado longo enxerga o texto
  // por uma fresta.
  //
  // O jeito de medir e sempre o mesmo: zera a altura, le quanto o conteudo
  // realmente ocupa, e aplica. Sem zerar antes, a caixa so cresce e nunca
  // encolhe quando a pessoa apaga.
  const MIN_ALTURA = 52;
  const MAX_ALTURA = 340;
  useEffect(() => {
    const el = textoRef.current;
    if (!el) return;
    el.style.height = "auto";
    const desejada = Math.min(Math.max(el.scrollHeight, MIN_ALTURA), MAX_ALTURA);
    el.style.height = desejada + "px";
    el.style.overflowY = el.scrollHeight > MAX_ALTURA ? "auto" : "hidden";
  }, [texto]);

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
      const post = await Feed.criar({
        conteudo: texto.trim(),
        imagemFile: arquivo,
        audioFile: audio,
        tipo,
        fixado: permiteFixar && fixar,
      });
      if (permiteEnquete && comEnquete) {
        try {
          await Enquetes.abrir(post.id, undefined, opcoes);
        } catch {
          /* a sugestao vale mesmo sem a enquete */
        }
      }
      setTexto("");
      setArquivo(null);
      setPrevia(null);
      setAudio(null);
      setFixar(false);
      setOpcoes(["", ""]);
      onPublicado(post);
    } catch (e) {
      setErro(comoErro(e, "Não consegui publicar. Tente de novo.").message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="panel pad compositor">
      <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
        <Avatar
          className="av"
          nome={nomeAutor}
          url={avatarAutor}
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
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {(exigeFoto || previa) &&
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

          {!exigeFoto && !previa && (
            <button
              className="btn g"
              style={{ marginTop: 11, padding: "9px 14px", fontSize: ".68rem" }}
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              📷 Adicionar foto
            </button>
          )}

          {permiteAudio && !gravando && !audio && (
            <button
              className="btn g"
              style={{ marginTop: 11, marginLeft: 8, padding: "9px 14px", fontSize: ".68rem" }}
              onClick={iniciarGravacao}
              type="button"
            >
              <Icone nome="mic" tam={13} /> Gravar áudio
            </button>
          )}

          {permiteAudio && gravando && (
            <div
              className="row"
              style={{ marginTop: 11, alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 10, background: "rgba(255,45,85,.12)", border: "1px solid rgba(255,45,85,.3)" }}
            >
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff2d55", flexShrink: 0 }} />
              <span className="muted tiny" style={{ flex: 1 }}>
                Gravando… {String(Math.floor(segundosGravando / 60)).padStart(2, "0")}:
                {String(segundosGravando % 60).padStart(2, "0")}
              </span>
              <button type="button" className="btn g" style={{ padding: "6px 12px", fontSize: ".64rem" }} onClick={pararGravacao}>
                <Icone nome="stop" tam={12} /> Parar
              </button>
            </div>
          )}

          {permiteAudio && !gravando && audio && (
            <div className="row" style={{ marginTop: 11, alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <audio controls src={URL.createObjectURL(audio)} style={{ height: 32, maxWidth: 260 }} />
              <button
                type="button"
                className="btn g"
                style={{ padding: "6px 12px", fontSize: ".64rem" }}
                onClick={() => setAudio(null)}
              >
                Remover
              </button>
            </div>
          )}

          <textarea
            ref={textoRef}
            rows={2}
            placeholder={placeholder}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ minHeight: MIN_ALTURA, resize: "none", overflowY: "hidden" }}
          />

          {erro && (
            <div className="aviso erro" style={{ marginTop: 11, marginBottom: 0 }}>
              <span className="avisoIcone">!</span>
              <div>{erro}</div>
            </div>
          )}

          {/* ---- opções da enquete ---------------------------------------- */}
          {permiteEnquete && comEnquete && (
            <div
              style={{
                marginTop: 12,
                padding: "13px 14px",
                borderRadius: 12,
                background: "rgba(0,0,0,.3)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="spread" style={{ marginBottom: 9, gap: 10, flexWrap: "wrap" }}>
                <span className="eyebrow">Opções da enquete</span>
                <span className="muted tiny">
                  {opcoes.filter((o) => o.trim()).length >= 2
                    ? "vira votação em caixas"
                    : "deixe vazio para virar Sim / Não"}
                </span>
              </div>

              <div className="stack" style={{ gap: 7 }}>
                {opcoes.map((o, i) => (
                  <div key={i} className="row" style={{ gap: 7 }}>
                    <input
                      value={o}
                      placeholder={i === 0 ? "Segunda-feira" : i === 1 ? "Quarta-feira" : "mais uma opção"}
                      onChange={(e) => {
                        const novas = opcoes.slice();
                        novas[i] = e.target.value;
                        setOpcoes(novas);
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "rgba(0,0,0,.42)",
                        border: "1px solid var(--line)",
                        color: "var(--txt)",
                        font: "inherit",
                        fontSize: ".85rem",
                      }}
                    />
                    {opcoes.length > 2 && (
                      <button
                        type="button"
                        title="Remover esta opção"
                        onClick={() => setOpcoes(opcoes.filter((_, j) => j !== i))}
                        style={{
                          flex: "none",
                          background: "transparent",
                          border: "1px solid var(--line)",
                          borderRadius: 10,
                          color: "var(--mut2)",
                          cursor: "pointer",
                          padding: "0 11px",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {opcoes.length < 10 && (
                <button
                  className="btn g"
                  type="button"
                  onClick={() => setOpcoes(opcoes.concat(""))}
                  style={{ marginTop: 9, padding: "7px 13px", fontSize: ".66rem" }}
                >
                  + Adicionar opção
                </button>
              )}

              {opcoes.filter((o) => o.trim()).length === 1 && (
                <p className="muted tiny" style={{ marginTop: 9, color: "var(--gold)" }}>
                  Com uma opção só não há o que votar. Preencha pelo menos duas, ou apague
                  todas para virar Sim / Não.
                </p>
              )}
            </div>
          )}

          <div className="spread" style={{ marginTop: 11, flexWrap: "wrap", gap: 10 }}>
            <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
              {exigeFoto && (
                <span className="regra">⚠️ Aqui a foto é obrigatória. Publicação só com texto não entra.</span>
              )}

              {permiteEnquete && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={comEnquete}
                    onChange={(e) => setComEnquete(e.target.checked)}
                  />
                  Abrir enquete
                </label>
              )}

              {permiteFixar && (
                <label className="check">
                  <input type="checkbox" checked={fixar} onChange={(e) => setFixar(e.target.checked)} />
                  📌 Fixar no topo
                </label>
              )}

              {!exigeFoto && !permiteEnquete && !permiteFixar && (
                <span className="regra muted">Foto é opcional aqui.</span>
              )}
            </div>

            <button className="btn p" onClick={publicar} disabled={!podePublicar || enviando} type="button">
              {enviando ? "Publicando…" : rotuloBotao}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
