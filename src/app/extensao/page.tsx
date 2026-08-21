"use client";

// =============================================================================
// NITO LIVE - Extensao.
// O membro baixa o arquivo publicado e ve a situacao da licenca dele.
// A administracao troca o arquivo por aqui, sem mexer em servidor.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { Extensao, VersaoExtensao, Perfil } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

function mb(bytes?: number | null) {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const admin = ehAdmin(perfil);
  const [versao, setVersao] = useState<VersaoExtensao | null>(null);
  const [carregando, setCarregando] = useState(true);

  // publicacao de versao nova (admin)
  const [numero, setNumero] = useState("");
  const [notas, setNotas] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Extensao.versaoAtual()
      .then(setVersao)
      .catch(() => setVersao(null))
      .finally(() => setCarregando(false));
  }, []);

  const dias = diasRestantes(perfil.assinatura_expira_em);
  const ativa = perfil.assinatura_ativa;

  async function publicar() {
    if (!numero.trim() || !arquivo || enviando) return;
    setEnviando(true);
    setErro(null);
    setOk(null);
    try {
      const nova = await Extensao.publicarVersao(numero.trim(), arquivo, notas.trim() || undefined);
      setVersao(nova);
      setNumero("");
      setNotas("");
      setArquivo(null);
      setOk("Versão publicada. Todo membro já baixa a nova a partir de agora.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui publicar a versão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppShell perfil={perfil} ativa="extensao">
      <div className="view on">
        <div>
          <h1 className="title-xl">
            Sua <em>extensão</em>.
          </h1>
          <p className="sub">Baixe, instale no Chrome e cole sua chave. Leva menos de três minutos.</p>
        </div>

        {admin && (
          <div className="admin-bar" style={{ marginTop: 22, display: "block" }}>
            <div className="row" style={{ marginBottom: 13 }}>
              <span className="tag">ADMIN</span>
              <b>
                {versao
                  ? `Publicado agora: versão ${versao.versao} · ${mb(versao.tamanho_bytes)}`
                  : "Nenhuma versão publicada ainda."}
              </b>
            </div>

            <div className="grid3">
              <div className="campo">
                <label>Número da versão</label>
                <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="1.1.0" />
              </div>
              <div className="campo">
                <label>Arquivo .zip</label>
                <input ref={arquivoRef} type="file" accept=".zip" hidden onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
                <button className="btn g" style={{ width: "100%" }} onClick={() => arquivoRef.current?.click()} type="button">
                  {arquivo ? `${arquivo.name} (${mb(arquivo.size)})` : "Escolher arquivo"}
                </button>
              </div>
              <div className="campo">
                <label>O que mudou</label>
                <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Corrige o congelamento do preview" />
              </div>
            </div>

            {erro && <div className="regra" style={{ display: "block", marginBottom: 9 }}>{erro}</div>}
            {ok && <div className="regra" style={{ display: "block", marginBottom: 9, color: "var(--green)" }}>{ok}</div>}

            <button className="btn gold" onClick={publicar} disabled={enviando || !numero.trim() || !arquivo} type="button">
              {enviando ? "Enviando…" : "Publicar esta versão"}
            </button>
          </div>
        )}

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="panel pad">
            <div className="passo">
              <div className="n">1</div>
              <div className="c">
                <b>Baixar a extensão</b>
                {carregando && <p className="muted tiny">Buscando a versão publicada…</p>}

                {!carregando && versao && (
                  <>
                    <p className="muted tiny">
                      Versão {versao.versao} — sempre a mais recente publicada pela administração.
                      {versao.notas ? ` ${versao.notas}` : ""}
                    </p>
                    {ativa ? (
                      <a
                        className="material"
                        href={versao.arquivo_url}
                        download
                        style={{ marginTop: 12, textDecoration: "none", color: "inherit" }}
                      >
                        <div className="mi">📦</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>NITO_LIVE_{versao.versao}.zip</b>
                          <span>
                            {mb(versao.tamanho_bytes)} · publicado em{" "}
                            {new Date(versao.publicado_em).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <span className="go">BAIXAR</span>
                      </a>
                    ) : (
                      <div className="aviso erro" style={{ marginTop: 12 }}>
                        <span className="avisoIcone">!</span>
                        <div>
                          <strong>Assinatura inativa</strong>
                          Renove para voltar a baixar e usar a extensão.
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!carregando && !versao && (
                  <p className="muted tiny">
                    Nenhum arquivo publicado ainda. {admin ? "Use o painel acima para enviar o primeiro." : "Volte em breve."}
                  </p>
                )}
              </div>
            </div>

            <div className="passo">
              <div className="n">2</div>
              <div className="c">
                <b>Instalar no Chrome</b>
                <p className="muted tiny">
                  Abra <span className="num" style={{ color: "var(--cyan)" }}>chrome://extensions</span>, ligue o{" "}
                  <b>Modo do desenvolvedor</b> no canto superior direito e arraste o arquivo .zip para a página.
                </p>
              </div>
            </div>

            <div className="passo">
              <div className="n">3</div>
              <div className="c">
                <b>Ativar com sua chave</b>
                <p className="muted tiny">
                  Abra a extensão e entre com o mesmo e-mail que você usa aqui. Ela reconhece sua
                  assinatura e libera sozinha.
                </p>
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="panel pad">
              <h2 className="h-sec" style={{ marginBottom: 14 }}>Situação da sua licença</h2>

              <div className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="muted tiny">Status</span>
                <span className={`pill ${ativa ? "ok" : "no"}`}>{ativa ? "Ativa" : "Inativa"}</span>
              </div>
              <div className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="muted tiny">Renova em</span>
                <span className="num" style={{ fontWeight: 700 }}>
                  {perfil.assinatura_expira_em
                    ? new Date(perfil.assinatura_expira_em).toLocaleDateString("pt-BR")
                    : "—"}
                </span>
              </div>
              <div className="spread" style={{ padding: "10px 0" }}>
                <span className="muted tiny">Dias restantes</span>
                <span className="num" style={{ fontWeight: 700, color: dias !== null && dias <= 5 ? "var(--red)" : undefined }}>
                  {dias === null ? "—" : dias}
                </span>
              </div>
            </div>

            <div
              className="panel pad"
              style={{ borderColor: "rgba(255,194,58,.25)", background: "linear-gradient(160deg,rgba(255,194,58,.07),var(--surf))" }}
            >
              <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontSize: "1.3rem" }}>🔑</div>
                <div>
                  <b style={{ fontSize: ".9rem" }}>Trocou de computador?</b>
                  <p className="muted tiny" style={{ marginTop: 5 }}>
                    Abra um chamado no Suporte pedindo a liberação do aparelho. A gente desvincula o
                    antigo e você ativa no novo sem perder nada.
                  </p>
                  <a className="btn g" href="/suporte" style={{ marginTop: 11, display: "inline-flex" }}>
                    Abrir chamado
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ExtensaoPage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
