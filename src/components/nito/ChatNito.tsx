"use client";

// =============================================================================
// NITO LIVE - chat ao vivo da comunidade.
// Texto, foto, video e mencao. As mensagens chegam pelo Realtime do Supabase,
// entao ninguem precisa recarregar a pagina.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { Chat, MensagemChat, Perfil } from "@/lib/nito-motor";
import { iniciais } from "@/lib/nito-gamificacao";
import { Icone } from "./NitoIcones";

const CORES = [
  "linear-gradient(100deg,#a855f7,#6d28d9)",
  "linear-gradient(100deg,#22e6ff,#2b8bff)",
  "linear-gradient(100deg,#ffc23a,#ff8a00)",
  "linear-gradient(100deg,#25e08a,#12b6a0)",
];
function corDe(id?: string) {
  if (!id) return CORES[0];
  let n = 0;
  for (const c of id) n = (n + c.charCodeAt(0)) % CORES.length;
  return CORES[n];
}

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Transforma "@Fulano" em destaque azul, sem deixar HTML de terceiro entrar.
function comMencoes(texto: string) {
  return texto.split(/(@[\wÀ-ÿ.]+)/g).map((p, i) =>
    p.startsWith("@") ? (
      <span className="mention" key={i}>
        {p}
      </span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

export function ChatNito({ perfil, altura = 560 }: { perfil: Perfil; altura?: number }) {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [online, setOnline] = useState(0);
  const fimRef = useRef<HTMLDivElement>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    Chat.historico("geral", 60)
      .then((m) => vivo && setMensagens(m))
      .catch(() => {});

    const parar = Chat.assinar(
      "geral",
      {
        onMensagem: (nova: MensagemChat) => {
          setMensagens((antes) =>
            antes.some((m) => m.id === nova.id) ? antes : [...antes, nova]
          );
        },
        onOnline: (qtd: number) => setOnline(qtd),
      },
      perfil
    );

    return () => {
      vivo = false;
      parar?.();
    };
  }, [perfil]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  function escolher(f: File | null) {
    if (!f) return;
    const ehMidia = f.type.startsWith("image/") || f.type.startsWith("video/");
    if (!ehMidia) {
      setErro("Aqui vai foto ou vídeo.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setErro("Arquivo muito grande. O limite é 25 MB.");
      return;
    }
    setErro(null);
    setArquivo(f);
  }

  async function enviar() {
    if (enviando || (!texto.trim() && !arquivo)) return;
    setEnviando(true);
    setErro(null);
    try {
      await Chat.enviar(texto, "geral", { midiaFile: arquivo });
      setTexto("");
      setArquivo(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", height: altura }}>
      <div
        className="pad spread"
        style={{ borderBottom: "1px solid var(--line)", paddingTop: 15, paddingBottom: 15 }}
      >
        <h2 className="h-sec">Chat ao vivo</h2>
        <span className="eyebrow" style={{ color: "var(--green)" }}>
          ● {online > 0 ? `${online} ONLINE` : "AO VIVO"}
        </span>
      </div>

      <div className="chat-full">
        {mensagens.length === 0 && (
          <div className="muted tiny" style={{ textAlign: "center", padding: "24px 0" }}>
            Ninguém falou nada ainda. Manda o primeiro.
          </div>
        )}

        {mensagens.map((m) => {
          const meu = m.autor_id === perfil.id;
          const nome = meu ? "Você" : m.autor?.nome ?? "Membro";
          return (
            <div className={`msg${meu ? " eu" : ""}`} key={m.id}>
              <div className="av" style={{ background: meu ? "var(--grad)" : corDe(m.autor_id) }}>
                {iniciais(nome === "Você" ? perfil.nome : nome)}
              </div>
              <div className="bal">
                <b>{nome}</b>
                {m.midia_url && m.midia_tipo === "imagem" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.midia_url}
                    alt=""
                    style={{ width: "100%", borderRadius: 9, margin: "7px 0", display: "block" }}
                  />
                )}
                {m.midia_url && m.midia_tipo === "video" && (
                  <video
                    src={m.midia_url}
                    controls
                    style={{ width: "100%", borderRadius: 9, margin: "7px 0", display: "block" }}
                  />
                )}
                {m.conteudo && <p>{comMencoes(m.conteudo)}</p>}
                <time>{hora(m.criado_em)}</time>
              </div>
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>

      {(arquivo || erro) && (
        <div className="pad" style={{ paddingTop: 10, paddingBottom: 0 }}>
          {arquivo && (
            <div className="anexo" style={{ margin: 0 }}>
              <div className="ph">{arquivo.type.startsWith("video") ? "▶" : "🖼"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{arquivo.name}</b>
                <span>{Math.round(arquivo.size / 1024)} KB</span>
              </div>
              <button
                className="btn g"
                style={{ padding: "6px 10px", fontSize: ".62rem" }}
                onClick={() => setArquivo(null)}
                type="button"
              >
                Remover
              </button>
            </div>
          )}
          {erro && (
            <div className="regra" style={{ display: "block", marginTop: 8 }}>{erro}</div>
          )}
        </div>
      )}

      <div className="chat-barra">
        <input
          ref={inputArquivo}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={(e) => escolher(e.target.files?.[0] ?? null)}
        />
        <button
          className="anx"
          title="Enviar foto ou vídeo"
          onClick={() => inputArquivo.current?.click()}
          type="button"
        >
          📎
        </button>
        <input
          placeholder="Mensagem…  use @ para mencionar alguém"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
        />
        <button className="env" onClick={enviar} disabled={enviando} type="button" aria-label="Enviar">
          <Icone nome="send" tam={16} />
        </button>
      </div>
    </div>
  );
}
