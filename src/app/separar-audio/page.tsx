"use client";

// =============================================================================
// NITO LIVE - Separar Áudio.
//
// Sobe um vídeo e sai com duas coisas: o vídeo sem a trilha de som e o som sem
// a imagem. Nenhum dos dois é recodificado - os dados comprimidos são copiados
// byte a byte, então é impossível degradar. Nada de congelamento, pico de áudio
// ou tela preta, porque nada foi refeito.
//
// O arquivo NUNCA sai do computador da pessoa. Tudo acontece no navegador dela;
// nenhum byte sobe para servidor nenhum.
// =============================================================================

import React, { useCallback, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Perfil } from "@/lib/nito-motor";
import { lerPlanta, montarSaida, agruparCopias, Planta, Trilha } from "@/lib/nito-mp4";

// Sem gravação direta no disco, o arquivo inteiro precisa caber na memória do
// navegador. Acima disto a aba trava, então a tela recusa antes em vez de
// morrer no meio.
const LIMITE_SEM_DISCO = 700 * 1024 * 1024;

function tamanhoLegivel(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

function duracaoLegivel(seg: number) {
  const s = Math.round(seg);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m) return `${m}min ${String(r).padStart(2, "0")}s`;
  return `${r}s`;
}

function semExtensao(nome: string) {
  const i = nome.lastIndexOf(".");
  return i > 0 ? nome.slice(0, i) : nome;
}

// Declaracao minima do gravador de arquivo do navegador. Escrita a mao porque
// nem todo navegador tem, e porque assim ela aceita exatamente o que este
// arquivo entrega: blocos de bytes.
// Uint8Array puro, sem parametro de tipo: escrito assim para compilar tanto no
// TypeScript novo quanto no antigo, que nao conhece o parametro.
type BlocoDeBytes = Uint8Array;

interface GravadorDeArquivo {
  write: (dados: BlocoDeBytes) => Promise<void>;
  close: () => Promise<void>;
}

interface JanelaComDisco {
  showSaveFilePicker?: (opcoes: unknown) => Promise<{
    createWritable: () => Promise<GravadorDeArquivo>;
  }>;
}

function podeGravarNoDisco() {
  if (typeof window === "undefined") return false;
  return typeof (window as unknown as JanelaComDisco).showSaveFilePicker === "function";
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [planta, setPlanta] = useState<Planta | null>(null);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, setTrabalhando] = useState<"video" | "audio" | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [pronto, setPronto] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const entradaRef = useRef<HTMLInputElement>(null);

  const disco = podeGravarNoDisco();

  const escolher = useCallback(async (f: File | null) => {
    setErro(null);
    setPronto(null);
    setPlanta(null);
    setArquivo(null);
    if (!f) return;

    const nome = f.name.toLowerCase();
    if (!nome.endsWith(".mp4") && !nome.endsWith(".mov") && !nome.endsWith(".m4v")) {
      setErro("Por enquanto só MP4, MOV e M4V. MKV, AVI e FLV não são lidos aqui.");
      return;
    }
    if (!disco && f.size > LIMITE_SEM_DISCO) {
      setErro(
        `Este navegador precisa segurar o arquivo inteiro na memória, e ${tamanhoLegivel(f.size)} não cabe. ` +
          "Abra esta página no Chrome ou no Edge, que gravam direto no disco e aceitam qualquer tamanho."
      );
      return;
    }

    setLendo(true);
    try {
      const ler = async (de: number, ate: number) =>
        new Uint8Array(await f.slice(de, ate).arrayBuffer());
      const p = await lerPlanta(ler, f.size);
      if (!p.trilhas.length) throw new Error("Não encontrei trilha de vídeo nem de áudio neste arquivo.");
      setPlanta(p);
      setArquivo(f);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui ler este arquivo.");
    } finally {
      setLendo(false);
    }
  }, [disco]);

  const trilhaDe = (tipo: "video" | "audio") =>
    planta?.trilhas.find((t) => t.tipo === tipo) ?? null;

  async function separar(qual: "video" | "audio") {
    const t = trilhaDe(qual);
    if (!arquivo || !planta || !t || trabalhando) return;

    setTrabalhando(qual);
    setErro(null);
    setPronto(null);
    setProgresso(0);

    const base = semExtensao(arquivo.name);
    const nomeSaida = qual === "video" ? `${base} - sem audio.mp4` : `${base} - audio.m4a`;
    const mime = qual === "video" ? "video/mp4" : "audio/mp4";

    try {
      const plano = montarSaida(t, planta.ftyp);
      const blocos = agruparCopias(plano.copias);

      let escritor: GravadorDeArquivo | null = null;
      const partes: BlocoDeBytes[] = [];

      if (disco) {
        const abrir = (window as unknown as JanelaComDisco).showSaveFilePicker!;
        const alvo = await abrir({
          suggestedName: nomeSaida,
          types: [{
            description: qual === "video" ? "Vídeo MP4" : "Áudio M4A",
            accept: { [mime]: [qual === "video" ? ".mp4" : ".m4a"] },
          }],
        });
        escritor = await alvo.createWritable();
        await escritor.write(plano.cabecalho);
      } else {
        partes.push(plano.cabecalho);
      }

      let feito = 0;
      for (const b of blocos) {
        const pedaco = new Uint8Array(await arquivo.slice(b.de, b.ate).arrayBuffer());
        if (escritor) await escritor.write(pedaco);
        else partes.push(pedaco);
        feito += pedaco.length;
        setProgresso(feito / Math.max(1, plano.bytesDados));
      }

      if (escritor) {
        await escritor.close();
        setPronto(`${nomeSaida} salvo onde você escolheu.`);
      } else {
        const url = URL.createObjectURL(new Blob(partes as unknown as BlobPart[], { type: mime }));
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeSaida;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setPronto(`${nomeSaida} foi para a pasta de downloads.`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Fechar a janela de salvar não é defeito: é a pessoa desistindo.
      if (!/abort/i.test(msg)) setErro("Não consegui gerar o arquivo. " + msg);
    } finally {
      setTrabalhando(null);
      setProgresso(0);
    }
  }

  const video = trilhaDe("video");
  const audio = trilhaDe("audio");

  return (
    <AppShell perfil={perfil} ativa="separar" recado="Separe o som do vídeo sem perder nada.">
      <div className="view on">
        <div>
          <h1 className="title-xl">
            Separar <em>áudio</em>.
          </h1>
          <p className="sub">
            Escolha um vídeo e leve duas coisas: o vídeo sem a trilha de som e o som sem a imagem.
            Nada é recodificado — os dois saem <b>exatamente iguais ao original</b>, sem travar,
            sem chiado e sem tela preta. E o arquivo <b>não sai do seu computador</b>: tudo acontece
            aqui no navegador.
          </p>
        </div>

        {/* ---- escolha do arquivo ----------------------------------------- */}
        <div className="panel pad" style={{ marginTop: 16 }}>
          <input
            ref={entradaRef}
            type="file"
            accept="video/mp4,video/quicktime,.mp4,.mov,.m4v"
            hidden
            onChange={(e) => escolher(e.target.files?.[0] ?? null)}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => entradaRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && entradaRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              escolher(e.dataTransfer.files?.[0] ?? null);
            }}
            style={{
              border: `1.5px dashed ${arrastando ? "var(--red)" : "var(--line-2, var(--line))"}`,
              background: arrastando ? "rgba(255,15,61,.06)" : "rgba(0,0,0,.25)",
              borderRadius: 14,
              padding: "34px 20px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>🎬</div>
            <b style={{ display: "block", fontSize: ".95rem" }}>
              {lendo ? "Lendo o arquivo…" : "Arraste o vídeo aqui ou clique para escolher"}
            </b>
            <span className="muted tiny" style={{ display: "block", marginTop: 5 }}>
              MP4, MOV ou M4V{disco ? " · qualquer tamanho" : ` · até ${tamanhoLegivel(LIMITE_SEM_DISCO)} neste navegador`}
            </span>
          </div>

          {!disco && (
            <p className="muted tiny" style={{ marginTop: 11, lineHeight: 1.55 }}>
              Seu navegador não deixa gravar direto no disco, então o arquivo precisa caber na
              memória. No <b>Chrome</b> ou no <b>Edge</b> essa limitação não existe e dá para
              separar uma live inteira.
            </p>
          )}
        </div>

        {erro && (
          <div className="panel pad" style={{ marginTop: 16, borderColor: "rgba(255,15,61,.35)" }}>
            <div style={{ color: "var(--red)", fontSize: ".88rem", lineHeight: 1.5 }}>{erro}</div>
          </div>
        )}

        {pronto && (
          <div className="panel pad" style={{ marginTop: 16, borderColor: "rgba(37,224,138,.35)" }}>
            <div style={{ color: "var(--green)", fontSize: ".88rem" }}>✓ {pronto}</div>
          </div>
        )}

        {/* ---- o que foi encontrado --------------------------------------- */}
        {arquivo && planta && (
          <>
            <div className="panel pad" style={{ marginTop: 16 }}>
              <div className="spread" style={{ marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
                <h2 className="h-sec">Dentro do arquivo</h2>
                <span className="eyebrow">{tamanhoLegivel(arquivo.size)}</span>
              </div>
              <div className="muted tiny" style={{ marginBottom: 12, wordBreak: "break-all" }}>
                {arquivo.name}
              </div>

              <div className="grid2">
                <div style={{ background: "rgba(0,0,0,.28)", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px" }}>
                  <div className="eyebrow">Vídeo</div>
                  {video ? (
                    <>
                      <div style={{ font: "900 1rem/1.1 var(--disp)", marginTop: 6 }}>
                        {Math.round(video.largura)} × {Math.round(video.altura)}
                      </div>
                      <div className="muted tiny" style={{ marginTop: 4 }}>
                        {video.codec} · {duracaoLegivel(video.segundos)} · {tamanhoLegivel(video.bytes)}
                      </div>
                    </>
                  ) : (
                    <div className="muted tiny" style={{ marginTop: 6 }}>não tem trilha de vídeo</div>
                  )}
                </div>

                <div style={{ background: "rgba(0,0,0,.28)", border: "1px solid var(--line)", borderRadius: 12, padding: "13px 15px" }}>
                  <div className="eyebrow">Áudio</div>
                  {audio ? (
                    <>
                      <div style={{ font: "900 1rem/1.1 var(--disp)", marginTop: 6 }}>
                        {audio.codec === "mp4a" ? "AAC" : audio.codec}
                      </div>
                      <div className="muted tiny" style={{ marginTop: 4 }}>
                        {duracaoLegivel(audio.segundos)} · {tamanhoLegivel(audio.bytes)}
                      </div>
                    </>
                  ) : (
                    <div className="muted tiny" style={{ marginTop: 6 }}>não tem trilha de áudio</div>
                  )}
                </div>
              </div>
            </div>

            {/* ---- ações ---------------------------------------------------- */}
            <div className="panel pad" style={{ marginTop: 16 }}>
              <h2 className="h-sec" style={{ marginBottom: 14 }}>O que você quer levar</h2>

              {trabalhando && (
                <div style={{ marginBottom: 14 }}>
                  <div className="bar">
                    <i style={{ width: `${Math.round(progresso * 100)}%`, background: "var(--grad)", transition: "width .2s linear" }} />
                  </div>
                  <div className="spread" style={{ marginTop: 7 }}>
                    <span className="eyebrow">
                      {trabalhando === "video" ? "Separando o vídeo" : "Separando o áudio"}
                    </span>
                    <span className="num muted tiny">{Math.round(progresso * 100)}%</span>
                  </div>
                </div>
              )}

              <div className="row" style={{ gap: 11, flexWrap: "wrap" }}>
                <button
                  className="btn p"
                  type="button"
                  onClick={() => separar("video")}
                  disabled={!video || !!trabalhando}
                >
                  🎥 Vídeo sem áudio (.mp4)
                </button>
                <button
                  className="btn gold"
                  type="button"
                  onClick={() => separar("audio")}
                  disabled={!audio || !!trabalhando}
                >
                  🎵 Só o áudio (.m4a)
                </button>
              </div>

              <p className="muted tiny" style={{ marginTop: 13, lineHeight: 1.55 }}>
                O áudio sai em <b>.m4a</b>, que é o formato em que ele já estava gravado dentro do
                vídeo. Salvar assim é o que garante que ele é idêntico — converter para .mp3
                obrigaria a refazer o som, e aí deixaria de ser cópia. O .m4a abre no celular, no
                CapCut, no Premiere e no próprio TikTok.
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function PaginaSepararAudio() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
