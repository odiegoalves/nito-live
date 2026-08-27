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
import { Chamados, Chamado, ChamadoMensagem, Perfil, Fmt, comoErro, nomesDe } from "@/lib/nito-motor";

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
  const [nomeDono, setNomeDono] = useState<string | null>(null);

  const [gravando, setGravando] = useState(false);
  const [segundosGravando, setSegundosGravando] = useState(0);

  const [outroOnline, setOutroOnline] = useState(false);
  const [outroDigitando, setOutroDigitando] = useState(false);
  const [outroGravando, setOutroGravando] = useState(false);
  const canalRef = useRef<{ digitando: () => void; gravando: (ativo: boolean) => void; sair: () => Promise<void> } | null>(null);
  const digitandoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meuDigitandoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gravadorRef = useRef<MediaRecorder | null>(null);
  const pedacosRef = useRef<Blob[]>([]);
  const trilhaRef = useRef<MediaStream | null>(null);
  const cronometroRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    setOutroOnline(false);
    setOutroDigitando(false);
    setOutroGravando(false);

    const canal = Chamados.assinar(
      aberto.id,
      {
        onMensagem: (m) =>
          setMensagens((antes) => (antes.some((x) => x.id === m.id) ? antes : [...antes, m])),
        onPresenca: (online) => setOutroOnline(online),
        onDigitando: () => {
          setOutroDigitando(true);
          if (digitandoTimeoutRef.current) clearTimeout(digitandoTimeoutRef.current);
          // "digitando" é um evento avulso, não um liga/desliga — some
          // sozinho se não chegar outro aviso em alguns segundos (a pessoa
          // parou de digitar ou trocou de tela).
          digitandoTimeoutRef.current = setTimeout(() => setOutroDigitando(false), 3000);
        },
        onGravando: (ativo) => setOutroGravando(ativo),
      },
      perfil
    );
    canalRef.current = canal;

    return () => {
      if (digitandoTimeoutRef.current) clearTimeout(digitandoTimeoutRef.current);
      canal.sair();
      canalRef.current = null;
    };
  }, [aberto, perfil]);

  // Quem é dono do chamado — só interessa pra tela do suporte, que ve
  // varios chamados de gente diferente e precisa mostrar o nome de cada um
  // em vez do genérico "Membro".
  useEffect(() => {
    if (!aberto || !admin) {
      setNomeDono(null);
      return;
    }
    let vivo = true;
    nomesDe([aberto.user_id]).then((mapa) => {
      if (vivo) setNomeDono(mapa.get(aberto.user_id) ?? null);
    });
    return () => {
      vivo = false;
    };
  }, [aberto, admin]);

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

  function aoDigitar(valor: string) {
    setResposta(valor);
    if (!aberto || meuDigitandoTimeoutRef.current) return;
    // Manda no máximo 1 aviso a cada 2s — não precisa de um broadcast por
    // tecla digitada, só o suficiente pra manter o "digitando…" vivo do
    // outro lado (que já tem sua própria expiração de 3s).
    canalRef.current?.digitando();
    meuDigitandoTimeoutRef.current = setTimeout(() => {
      meuDigitandoTimeoutRef.current = null;
    }, 2000);
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

  // Grava um áudio direto do microfone e deixa pronto pra enviar, do mesmo
  // jeito que um arquivo anexado — sem precisar sair da tela pra gravar em
  // outro app e depois anexar.
  async function iniciarGravacao() {
    if (gravando) return;
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      trilhaRef.current = stream;
      pedacosRef.current = [];

      const tipo = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const gravador = tipo ? new MediaRecorder(stream, { mimeType: tipo }) : new MediaRecorder(stream);
      gravadorRef.current = gravador;

      gravador.ondataavailable = (e) => {
        if (e.data.size > 0) pedacosRef.current.push(e.data);
      };
      gravador.onstop = () => {
        const blob = new Blob(pedacosRef.current, { type: gravador.mimeType || "audio/webm" });
        const ext = (gravador.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        const arquivo = new File([blob], `audio-${Date.now()}.${ext}`, { type: blob.type });
        setAnexo(arquivo);
        trilhaRef.current?.getTracks().forEach((t) => t.stop());
        trilhaRef.current = null;
      };

      gravador.start();
      setGravando(true);
      setSegundosGravando(0);
      cronometroRef.current = setInterval(() => setSegundosGravando((s) => s + 1), 1000);
      canalRef.current?.gravando(true);
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
    canalRef.current?.gravando(false);
  }

  useEffect(() => {
    return () => {
      if (cronometroRef.current) clearInterval(cronometroRef.current);
      trilhaRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
                <div className="spread" style={{ marginTop: 7, alignItems: "center" }}>
                  <div className="eyebrow">{aberto.assunto.toUpperCase()}</div>
                  <span className="muted tiny" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: outroOnline ? "var(--green)" : "var(--mut2)",
                        flexShrink: 0,
                      }}
                    />
                    {outroOnline ? "Online agora" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="chat-full">
                {mensagens.map((m) => {
                  const meu = m.autor_id === perfil.id;
                  return (
                    <div className={`msg${meu ? " eu" : ""}`} key={m.id}>
                      <div className="av" style={{ background: m.do_suporte ? "linear-gradient(100deg,#22e6ff,#2b8bff)" : "var(--grad)" }}>
                        {m.do_suporte ? "S" : ((meu ? perfil.nome : nomeDono) ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div className="bal">
                        <b style={{ color: "var(--txt)" }}>
                          {m.do_suporte ? "Suporte NITO" : meu ? "Você" : nomeDono ?? "Membro"}
                        </b>
                        {m.conteudo && <p>{m.conteudo}</p>}
                        {m.anexo_url && <Anexo url={m.anexo_url} />}
                        <time>{hora(m.criado_em)}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={fimRef} />
              </div>

              {(outroDigitando || outroGravando) && (
                <div className="pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
                  <span className="muted tiny" style={{ fontStyle: "italic" }}>
                    {outroGravando ? "🎙️ gravando áudio…" : "digitando…"}
                  </span>
                </div>
              )}

              {aberto.situacao !== "resolvido" ? (
                <>
                  {gravando && (
                    <div className="pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: "1px solid var(--line)",
                                                  display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff2d55", flexShrink: 0 }} />
                      <span className="muted tiny" style={{ flex: 1 }}>
                        Gravando áudio… {String(Math.floor(segundosGravando / 60)).padStart(2, "0")}:
                        {String(segundosGravando % 60).padStart(2, "0")}
                      </span>
                      <button type="button" className="btn wa" style={{ padding: "4px 10px", fontSize: ".65rem" }} onClick={pararGravacao}>
                        Parar
                      </button>
                    </div>
                  )}

                  {!gravando && anexo && (
                    <div className="pad" style={{ paddingTop: 10, paddingBottom: 10, borderTop: "1px solid var(--line)",
                                                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className="muted tiny" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📎 {anexo.name}
                      </span>
                      {anexo.type.startsWith("audio/") && (
                        <audio controls src={URL.createObjectURL(anexo)} style={{ height: 32, maxWidth: 220 }} />
                      )}
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
                      disabled={ocupado || gravando}
                      type="button"
                      aria-label="Anexar imagem, vídeo ou áudio"
                      title="Anexar imagem, vídeo ou áudio"
                    >
                      <Icone nome="clip" tam={16} />
                    </button>
                    <button
                      className="env"
                      onClick={gravando ? pararGravacao : iniciarGravacao}
                      disabled={ocupado}
                      type="button"
                      aria-label={gravando ? "Parar gravação" : "Gravar áudio"}
                      title={gravando ? "Parar gravação" : "Gravar áudio"}
                      style={gravando ? { background: "#ff2d55", color: "#fff" } : undefined}
                    >
                      <Icone nome={gravando ? "stop" : "mic"} tam={16} />
                    </button>
                    <input
                      placeholder={admin ? "Responder ao membro…" : "Responder ao suporte…"}
                      value={resposta}
                      onChange={(e) => aoDigitar(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && responder()}
                    />
                    <button className="env" onClick={responder} disabled={ocupado || gravando} type="button" aria-label="Enviar">
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
