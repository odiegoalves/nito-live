"use client";

// =============================================================================
// NITO LIVE - Extensao.
// O membro baixa o arquivo publicado e ve a situacao da licenca dele.
// A administracao troca o arquivo por aqui, sem mexer em servidor.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { Extensao, VersaoExtensao, Chaves, RespostaChaves, Perfil } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

function mb(bytes?: number | null) {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const admin = ehAdmin(perfil);
  const [versao, setVersao] = useState<VersaoExtensao | null>(null);
  const [carregando, setCarregando] = useState(true);

  // chaves vindas do servidor de licencas
  const [chaves, setChaves] = useState<RespostaChaves | null>(null);
  const [carregandoChaves, setCarregandoChaves] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erroChaves, setErroChaves] = useState<string | null>(null);
  const [copiada, setCopiada] = useState<string | null>(null);

  // publicacao de versao nova (admin)
  const [numero, setNumero] = useState("");
  const [notas, setNotas] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Chaves.chamar("listar")
      .then(setChaves)
      .catch((e) => setErroChaves(e instanceof Error ? e.message : "Falha ao buscar suas chaves."))
      .finally(() => setCarregandoChaves(false));
  }, []);

  useEffect(() => {
    Extensao.versaoAtual()
      .then(setVersao)
      .catch(() => setVersao(null))
      .finally(() => setCarregando(false));
  }, []);

  // A licenca de verdade vive no servidor de licencas, nao no perfil do site.
  // Usar o perfil aqui fazia a tela dizer "inativa" com a chave ativa logo
  // abaixo - o cliente le isso e abre chamado. Entao mandamos as chaves.
  const chavesAtivas = (chaves?.chaves ?? []).filter((c) => c.ativa);
  const venceEm = chavesAtivas
    .map((c) => c.expira_em)
    .filter((d): d is string => !!d)
    .sort()
    .pop() ?? null;

  const ativa = chavesAtivas.length > 0 && (!venceEm || new Date(venceEm).getTime() > Date.now());
  const dias = diasRestantes(venceEm);

  // Quem pode BAIXAR nao e a mesma pergunta de quem tem chave ativa.
  // Quem acabou de comprar ainda nao gerou chave nenhuma, e precisa da
  // extensao justamente para usar a chave que vai gerar. Se eu exigisse
  // chave ativa para liberar o download, o cliente novo ficava preso:
  // sem extensao para usar a chave, sem chave para baixar a extensao.
  const situacao = String(chaves?.status ?? "").trim().toLowerCase();
  const bloqueado = ["cancelled", "canceled", "refunded", "expired", "revoked", "inactive"].includes(situacao);
  const podeBaixar = Boolean(chaves?.encontrado) && !bloqueado;

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

  async function gerarChave() {
    if (gerando) return;
    setGerando(true);
    setErroChaves(null);
    try {
      setChaves(await Chaves.chamar("gerar"));
    } catch (e) {
      setErroChaves(e instanceof Error ? e.message : "Não consegui gerar a chave.");
    } finally {
      setGerando(false);
    }
  }

  async function copiar(chave: string) {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiada(chave);
      setTimeout(() => setCopiada(null), 2000);
    } catch {
      setErroChaves("Seu navegador bloqueou a cópia. Selecione a chave e copie na mão.");
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

            <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
              {(!numero.trim() || !arquivo) && (
                <span className="regra">
                  Falta {!numero.trim() && !arquivo
                    ? "digitar a versão e escolher o arquivo"
                    : !numero.trim()
                    ? "digitar o número da versão (o 1.1.0 cinza é só exemplo)"
                    : "escolher o arquivo .zip"}.
                </span>
              )}
              <button className="btn gold" onClick={publicar} disabled={enviando || !numero.trim() || !arquivo} type="button">
                {enviando ? "Enviando…" : "Publicar esta versão"}
              </button>
            </div>
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
                    {podeBaixar ? (
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
                          <strong>{carregandoChaves ? "Verificando sua assinatura" : "Assinatura inativa"}</strong>
                          {carregandoChaves
                            ? "Um instante…"
                            : chaves?.encontrado
                            ? "Renove para voltar a baixar e usar a extensão."
                            : "Não encontrei compra com este e-mail. Entre com o mesmo e-mail que usou na Cakto."}
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
                {carregandoChaves ? (
                  <span className="pill wait">Verificando</span>
                ) : (
                  <span className={`pill ${ativa ? "ok" : "no"}`}>{ativa ? "Ativa" : "Inativa"}</span>
                )}
              </div>
              <div className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="muted tiny">Plano</span>
                <span className="num" style={{ fontWeight: 700, textTransform: "uppercase" }}>
                  {chaves?.plano ?? "—"}
                </span>
              </div>
              <div className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="muted tiny">Renova em</span>
                <span className="num" style={{ fontWeight: 700 }}>
                  {venceEm ? new Date(venceEm).toLocaleDateString("pt-BR") : "—"}
                </span>
              </div>
              <div className="spread" style={{ padding: "10px 0" }}>
                <span className="muted tiny">Dias restantes</span>
                <span className="num" style={{ fontWeight: 700, color: dias !== null && dias <= 5 ? "var(--red)" : undefined }}>
                  {dias === null ? "—" : dias}
                </span>
              </div>
            </div>

            <div className="panel pad">
              <div className="spread" style={{ marginBottom: 14 }}>
                <h2 className="h-sec">Suas chaves</h2>
                {chaves?.encontrado && (
                  <span className="eyebrow">
                    {chaves.ativas ?? 0} DE {chaves.limite === -1 ? "ILIMITADAS" : chaves.limite}
                  </span>
                )}
              </div>

              {carregandoChaves && <div className="muted tiny">Buscando suas chaves…</div>}

              {!carregandoChaves && chaves && !chaves.encontrado && (
                <div className="aviso">
                  <span className="avisoIcone">✦</span>
                  <div>
                    <strong>Nenhuma compra com este e-mail</strong>
                    {chaves.recado}
                  </div>
                </div>
              )}

              {!carregandoChaves && chaves?.encontrado && chaves.chaves.length === 0 && (
                <div className="muted tiny">
                  Você ainda não tem chave gerada. Use o botão abaixo para criar a primeira.
                </div>
              )}

              {chaves?.chaves.map((c) => (
                <div className="material" key={c.id} style={{ alignItems: "flex-start" }}>
                  <div className="mi">🔑</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b className="num" style={{ fontSize: ".76rem", wordBreak: "break-all" }}>{c.chave}</b>
                    <span>
                      {c.ativa ? "ativa" : "inativa"}
                      {c.expira_em ? ` · vence ${new Date(c.expira_em).toLocaleDateString("pt-BR")}` : ""}
                      {c.vinculada ? " · aparelho vinculado" : " · nunca usada"}
                    </span>
                  </div>
                  <button
                    className="btn g"
                    style={{ padding: "6px 10px", fontSize: ".6rem" }}
                    onClick={() => copiar(c.chave)}
                    type="button"
                  >
                    {copiada === c.chave ? "COPIADA" : "COPIAR"}
                  </button>
                </div>
              ))}

              {erroChaves && (
                <div className="aviso erro" style={{ marginTop: 12, marginBottom: 0 }}>
                  <span className="avisoIcone">!</span>
                  <div>{erroChaves}</div>
                </div>
              )}

              {chaves?.encontrado && (
                <>
                  <button
                    className="btn p"
                    style={{ width: "100%", marginTop: 14 }}
                    onClick={gerarChave}
                    disabled={gerando || !chaves.podeGerar}
                    type="button"
                  >
                    {gerando ? "Gerando…" : "Gerar nova chave"}
                  </button>
                  <p className="muted tiny" style={{ marginTop: 9 }}>
                    {chaves.limite === -1
                      ? "Seu plano permite chaves ilimitadas."
                      : chaves.podeGerar
                      ? `Seu plano permite ${chaves.limite} ${chaves.limite === 1 ? "chave" : "chaves"}.`
                      : `Você já usou as ${chaves.limite} ${chaves.limite === 1 ? "chave" : "chaves"} do seu plano. Para ter mais, faça o upgrade.`}
                  </p>
                </>
              )}
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
