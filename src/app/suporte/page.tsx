"use client";

// =============================================================================
// NITO LIVE - Suporte.
// O membro abre um chamado; quando alguem do suporte responde, o chamado vira
// conversa. No fim, quem atendeu encerra e ele vai para o historico.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { Icone } from "@/components/nito/NitoIcones";
import { Chamados, Chamado, ChamadoMensagem, Perfil, Fmt, comoErro } from "@/lib/nito-motor";

const ROTULO: Record<Chamado["situacao"], { pill: string; texto: string }> = {
  aguardando: { pill: "wait", texto: "Aguardando" },
  em_atendimento: { pill: "wait", texto: "Em atendimento" },
  resolvido: { pill: "ok", texto: "Resolvido" },
};

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const EXT_IMG = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp"];
const EXT_VIDEO = ["mp4", "mov", "webm", "m4v", "3gp", "avi", "mkv"];
const EXT_AUDIO = ["mp3", "m4a", "wav", "ogg", "opus", "aac", "weba", "amr"];

// Anexo do chamado (imagem, vídeo ou áudio) renderizado direto na conversa,
// sem precisar abrir em outra aba. O tipo é inferido pela extensão do
// arquivo salvo no Storage.
function Anexo({ url }: { url: string }) {
  const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();

  if (EXT_IMG.includes(ext)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 6 }}>
        <img
          src={url}
          alt="Anexo enviado"
          style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 10, display: "block" }}
        />
      </a>
    );
  }

  if (EXT_VIDEO.includes(ext)) {
    return (
      <video controls src={url} style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 10, marginTop: 6, display: "block" }} />
    );
  }

  if (EXT_AUDIO.includes(ext)) {
    return <audio controls src={url} style={{ marginTop: 6, display: "block", maxWidth: "100%" }} />;
  }

  return (
    <a className="go" href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 6 }}>
      ABRIR ANEXO
    </a>
  );
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const admin = ehAdmin(perfil);

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [aberto, setAberto] = useState<Chamado | null>(null);
  const [mensagens, setMensagens] = useState<ChamadoMensagem[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [novoAssunto, setNovoAssunto] = useState("");
  const [novoTexto, setNovoTexto] = useState("");
  const [mostrarNovo, setMostrarNovo] = useState(false);

  const [resposta, setResposta] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const anexoRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setChamados(await Chamados.meus());
    } catch {
      setChamados([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!aberto) return;
    Chamados.mensagens(aberto.id).then(setMensagens).catch(() => setMensagens([]));
    const parar = Chamados.assinar(aberto.id, (m) =>
      setMensagens((antes) => (antes.some((x) => x.id === m.id) ? antes : [...antes, m]))
    );
    return () => parar();
  }, [aberto]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  async function abrirChamado() {
    if (!novoAssunto.trim() || !novoTexto.trim() || ocupado) return;
    setOcupado(true);
    setErro(null);
    try {
      const c = await Chamados.abrir(novoAssunto, novoTexto);
      setNovoAssunto("");
      setNovoTexto("");
      setMostrarNovo(false);
      await carregar();
      setAberto(c);
    } catch (e) {
      setErro(comoErro(e, "Não consegui abrir o chamado.").message);
    } finally {
      setOcupado(false);
    }
  }

  async function responder() {
    if (!aberto || (!resposta.trim() && !anexo) || ocupado) return;
    setOcupado(true);
    if (anexo) setEnviandoAnexo(true);
    try {
      await Chamados.responder(aberto.id, resposta, admin, anexo);
      setResposta("");
      setAnexo(null);
      if (anexoRef.current) anexoRef.current.value = "";
      carregar();
    } catch (e) {
      setErro(comoErro(e, "Não consegui enviar.").message);
    } finally {
      setOcupado(false);
      setEnviandoAnexo(false);
    }
  }

  function escolherAnexo(f: File | null) {
    if (!f) return;
    const ok = f.type.startsWith("image/") || f.type.startsWith("video/") || f.type.startsWith("audio/");
    if (!ok) {
      setErro("Só é possível anexar imagem, vídeo ou áudio.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setErro("Arquivo muito grande. Envie algo até 25MB.");
      return;
    }
    setErro(null);
    setAnexo(f);
  }

  async function encerrar() {
    if (!aberto || ocupado) return;
    setOcupado(true);
    try {
      await Chamados.encerrar(aberto.id);
      setAberto({ ...aberto, situacao: "resolvido" });
      carregar();
    } finally {
      setOcupado(false);
    }
  }

  const emAndamento = chamados.filter((c) => c.situacao !== "resolvido");
  const resolvidos = chamados.filter((c) => c.situacao === "resolvido");

  return (
    <AppShell perfil={perfil} ativa="suporte">
      <div className="view on">
        <div className="spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 className="title-xl">
              Seus <em>chamados</em>.
            </h1>
            <p className="sub">
              Abra um chamado e converse direto com o suporte. Quando resolver, ele fica guardado no
              seu histórico.
            </p>
          </div>
          <button className="btn p" onClick={() => setMostrarNovo((v) => !v)} type="button">
            {mostrarNovo ? "Cancelar" : "+ Abrir chamado"}
          </button>
        </div>

        {mostrarNovo && (
          <div className="panel pad" style={{ marginTop: 20 }}>
            <h2 className="h-sec" style={{ marginBottom: 16 }}>Novo chamado</h2>
            <div className="campo">
              <label>Assunto</label>
              <input
                value={novoAssunto}
                onChange={(e) => setNovoAssunto(e.target.value)}
                placeholder="Chave parou depois que troquei de notebook"
              />
            </div>
            <div className="campo">
              <label>O que está acontecendo</label>
              <textarea
                rows={4}
                value={novoTexto}
                onChange={(e) => setNovoTexto(e.target.value)}
                placeholder="Conte com detalhes: o que você fez, o que apareceu na tela, desde quando."
              />
            </div>
            {erro && (
              <div className="aviso erro">
                <span className="avisoIcone">!</span>
                <div>{erro}</div>
              </div>
            )}
            <button
              className="btn p"
              onClick={abrirChamado}
              disabled={ocupado || !novoAssunto.trim() || !novoTexto.trim()}
              type="button"
            >
              {ocupado ? "Abrindo…" : "Abrir chamado"}
            </button>
          </div>
        )}

        <div className="grid2" style={{ marginTop: 22 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 11 }}>EM ANDAMENTO</div>

            {carregando && <div className="panel pad muted tiny">Carregando…</div>}

            {!carregando && emAndamento.length === 0 && (
              <div className="panel pad muted tiny">
                Nenhum chamado aberto. Se algo travou, use o botão acima.
              </div>
            )}

            {emAndamento.map((c) => (
              <div
                className={`ticket ${c.situacao === "em_atendimento" ? "andamento" : "aberto"}`}
                key={c.id}
                onClick={() => setAberto(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setAberto(c)}
              >
                <span className="tid">#{c.id}</span>
                <div className="tt">
                  <b>{c.assunto}</b>
                  <span>ATUALIZADO HÁ {Fmt.quando(c.atualizado_em).toUpperCase()}</span>
                </div>
                <span className={`pill ${ROTULO[c.situacao].pill}`}>{ROTULO[c.situacao].texto}</span>
              </div>
            ))}

            {resolvidos.length > 0 && (
              <>
                <div className="eyebrow" style={{ margin: "20px 0 11px" }}>RESOLVIDOS</div>
                {resolvidos.map((c) => (
                  <div className="ticket" key={c.id} onClick={() => setAberto(c)} role="button" tabIndex={0}
                       onKeyDown={(e) => e.key === "Enter" && setAberto(c)}>
                    <span className="tid">#{c.id}</span>
                    <div className="tt">
                      <b>{c.assunto}</b>
                      <span>
                        ENCERRADO EM{" "}
                        {c.resolvido_em ? new Date(c.resolvido_em).toLocaleDateString("pt-BR") : "—"}
                      </span>
                    </div>
                    <span className="pill ok">Resolvido</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {aberto ? (
            <div className="panel chat-painel">
              <div className="pad" style={{ borderBottom: "1px solid var(--line)", paddingTop: 14, paddingBottom: 14 }}>
                <div className="spread">
                  <h2 className="h-sec">Chamado #{aberto.id}</h2>
                  <span className={`pill ${ROTULO[aberto.situacao].pill}`}>{ROTULO[aberto.situacao].texto}</span>
                </div>
                <div className="eyebrow" style={{ marginTop: 7 }}>{aberto.assunto.toUpperCase()}</div>
              </div>

              <div className="chat-full">
                {mensagens.map((m) => {
                  const meu = m.autor_id === perfil.id;
                  return (
                    <div className={`msg${meu ? " eu" : ""}`} key={m.id}>
                      <div className="av" style={{ background: m.do_suporte ? "linear-gradient(100deg,#22e6ff,#2b8bff)" : "var(--grad)" }}>
                        {m.do_suporte ? "S" : (perfil.nome ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div className="bal">
                        <b style={{ color: "var(--txt)" }}>{m.do_suporte ? "Suporte NITO" : meu ? "Você" : "Membro"}</b>
                        {m.conteudo && <p>{m.conteudo}</p>}
                        {m.anexo_url && <Anexo url={m.anexo_url} />}
                        <time>{hora(m.criado_em)}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={fimRef} />
              </div>

              {aberto.situacao !== "resolvido" ? (
                <>
                  {anexo && (
                    <div className="pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: "1px solid var(--line)",
                                                  display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="muted tiny" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📎 {anexo.name}
                      </span>
                      <button
                        type="button"
                        className="btn wa"
                        style={{ padding: "4px 10px", fontSize: ".65rem" }}
                        onClick={() => {
                          setAnexo(null);
                          if (anexoRef.current) anexoRef.current.value = "";
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                  <div className="chat-barra">
                    <input
                      ref={anexoRef}
                      type="file"
                      accept="image/*,video/*,audio/*"
                      hidden
                      onChange={(e) => escolherAnexo(e.target.files?.[0] ?? null)}
                    />
                    <button
                      className="env"
                      onClick={() => anexoRef.current?.click()}
                      disabled={ocupado}
                      type="button"
                      aria-label="Anexar imagem, vídeo ou áudio"
                      title="Anexar imagem, vídeo ou áudio"
                    >
                      <Icone nome="clip" tam={16} />
                    </button>
                    <input
                      placeholder={admin ? "Responder ao membro…" : "Responder ao suporte…"}
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && responder()}
                    />
                    <button className="env" onClick={responder} disabled={ocupado} type="button" aria-label="Enviar">
                      {enviandoAnexo ? "…" : <Icone nome="send" tam={16} />}
                    </button>
                  </div>
                  <div className="pad" style={{ paddingTop: 12, paddingBottom: 12, borderTop: "1px solid var(--line)",
                                                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="muted tiny">Resolveu seu problema?</span>
                    <button className="btn wa" style={{ padding: "8px 14px", fontSize: ".68rem" }} onClick={encerrar} disabled={ocupado} type="button">
                      Marcar como resolvido
                    </button>
                  </div>
                </>
              ) : (
                <div className="pad" style={{ borderTop: "1px solid var(--line)" }}>
                  <span className="muted tiny">
                    Chamado encerrado. Precisa de mais alguma coisa? Abra um novo.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="panel pad muted" style={{ textAlign: "center", padding: "48px 24px" }}>
              Escolha um chamado à esquerda para ver a conversa.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function SuportePage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
