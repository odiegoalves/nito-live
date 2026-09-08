"use client";

// =============================================================================
// NITO LIVE - Shopee.
// Igual a aba da Extensao (TikTok), so que fala com o produto "shopee" no
// servidor de licencas. Mesma engrenagem, chave separada, mesma conta.
// O instalador (.exe) e publicado direto por aqui pelo admin - mesmo
// mecanismo ja usado na aba /extensao (Storage.enviar no bucket "extensao" +
// tabela extensao_versoes), so que filtrado por produto="shopee". Sem
// campo de Helper: o instalador do Shopee ja e um .exe unico self-contained.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { Chaves, RespostaChaves, Perfil, Extensao, VersaoExtensao, comoErro } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

function mb(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const admin = ehAdmin(perfil);
  const [chaves, setChaves] = useState<RespostaChaves | null>(null);
  const [carregandoChaves, setCarregandoChaves] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erroChaves, setErroChaves] = useState<string | null>(null);
  const [copiada, setCopiada] = useState<string | null>(null);

  // instalador publicado (todo mundo le)
  const [versao, setVersao] = useState<VersaoExtensao | null>(null);
  const [carregandoVersao, setCarregandoVersao] = useState(true);

  // publicacao de versao nova (admin)
  const [numero, setNumero] = useState("");
  const [notas, setNotas] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroPublicar, setErroPublicar] = useState<string | null>(null);
  const [okPublicar, setOkPublicar] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Chaves.chamar("listar", "shopee")
      .then(setChaves)
      .catch((e) => setErroChaves(e instanceof Error ? e.message : "Falha ao buscar suas chaves."))
      .finally(() => setCarregandoChaves(false));
  }, []);

  useEffect(() => {
    Extensao.versaoAtual("shopee")
      .then(setVersao)
      .catch(() => setVersao(null))
      .finally(() => setCarregandoVersao(false));
  }, []);

  async function publicar() {
    if (!numero.trim() || !arquivo || enviando) return;
    setEnviando(true);
    setErroPublicar(null);
    setOkPublicar(null);
    try {
      await Extensao.publicarVersao(numero.trim(), arquivo, notas.trim() || undefined, null, "shopee");
      const atualizada = await Extensao.versaoAtual("shopee");
      setVersao(atualizada);
      setNumero("");
      setNotas("");
      setArquivo(null);
      setOkPublicar("Instalador publicado. Todo mundo já baixa essa versão a partir de agora.");
    } catch (e) {
      setErroPublicar(comoErro(e, "Não consegui publicar o instalador.").message);
    } finally {
      setEnviando(false);
    }
  }

  const chavesAtivas = (chaves?.chaves ?? []).filter((c) => c.ativa);
  const venceEm = chavesAtivas
    .map((c) => c.expira_em)
    .filter((d): d is string => !!d)
    .sort()
    .pop() ?? null;

  const ativa = chavesAtivas.length > 0 && (!venceEm || new Date(venceEm).getTime() > Date.now());
  const dias = diasRestantes(venceEm);

  async function gerarChave() {
    if (gerando) return;
    setGerando(true);
    setErroChaves(null);
    try {
      setChaves(await Chaves.chamar("gerar", "shopee"));
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
    <AppShell perfil={perfil} ativa="shopee">
      <div className="view on">
        <div>
          <h1 className="title-xl">
            NITO LIVE <em>Shopee</em>.
          </h1>
          <p className="sub">Baixe o programa de PC e ative com sua chave. Mesma conta, chave separada da extensão.</p>
        </div>

        {admin && (
          <div className="admin-bar" style={{ marginTop: 22, display: "block" }}>
            <div className="row" style={{ marginBottom: 13 }}>
              <span className="tag">ADMIN</span>
              <b>
                {versao
                  ? `Publicado agora: versão ${versao.versao} · ${mb(versao.tamanho_bytes)}`
                  : "Nenhum instalador publicado ainda."}
              </b>
            </div>

            <div className="grid3">
              <div className="campo">
                <label>Número da versão</label>
                <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="1.1.0" />
              </div>
              <div className="campo">
                <label>Instalador (.exe)</label>
                <input ref={arquivoRef} type="file" accept=".exe" hidden onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
                <button className="btn g" style={{ width: "100%" }} onClick={() => arquivoRef.current?.click()} type="button">
                  {arquivo ? `${arquivo.name} (${mb(arquivo.size)})` : "Escolher arquivo"}
                </button>
              </div>
              <div className="campo">
                <label>O que mudou</label>
                <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Tela de login sem revalidação" />
              </div>
            </div>

            {erroPublicar && <div className="regra" style={{ display: "block", marginBottom: 9 }}>{erroPublicar}</div>}
            {okPublicar && <div className="regra" style={{ display: "block", marginBottom: 9, color: "var(--green)" }}>{okPublicar}</div>}

            <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
              {(!numero.trim() || !arquivo) && (
                <span className="regra">
                  Falta {!numero.trim() && !arquivo
                    ? "digitar a versão e escolher o arquivo"
                    : !numero.trim()
                    ? "digitar o número da versão (o 1.1.0 cinza é só exemplo)"
                    : "escolher o instalador .exe"}.
                </span>
              )}
              <button className="btn gold" onClick={publicar} disabled={enviando || !numero.trim() || !arquivo} type="button">
                {enviando ? "Enviando…" : "Publicar este instalador"}
              </button>
            </div>
          </div>
        )}

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="stack">
            <div className="panel pad">
              <div className="passo">
                <div className="n">1</div>
                <div className="c">
                  <b>Baixar o programa</b>
                  {carregandoVersao && <p className="muted tiny">Buscando a versão publicada…</p>}

                  {!carregandoVersao && versao && (
                    <>
                      <p className="muted tiny">
                        Versão {versao.versao} — sempre a mais recente publicada pela administração.
                        {versao.notas ? ` ${versao.notas}` : ""}
                      </p>
                      <a
                        className="material"
                        href={versao.arquivo_url}
                                                download={`NitoLiveSetup_${versao.versao}.exe`}
                        style={{ marginTop: 12, textDecoration: "none", color: "inherit" }}
                      >
                        <div className="mi">💻</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b>NitoLiveSetup_{versao.versao}.exe</b>
                          <span>
                            {mb(versao.tamanho_bytes)} · publicado em{" "}
                            {new Date(versao.publicado_em).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <span className="go">BAIXAR</span>
                      </a>
                    </>
                  )}

                  {!carregandoVersao && !versao && (
                    <p className="muted tiny">
                      O instalador ainda está sendo preparado. Assim que a administração publicar, o
                      link de download aparece aqui — sua chave abaixo já funciona independente disso.
                    </p>
                  )}
                </div>
              </div>

              <div className="passo">
                <div className="n">2</div>
                <div className="c">
                  <b>Instalar o programa</b>
                  <p className="muted tiny">
                    Abra o <strong>NitoLiveSetup.exe</strong> baixado e siga as telas até o fim. Se o
                    Windows perguntar se você confia no programa (SmartScreen), clique em{" "}
                    <strong>Mais informações → Executar assim mesmo</strong>.
                  </p>
                  <p className="muted tiny" style={{ marginTop: 6 }}>
                    O instalador já copia sozinho o programa e a extensão do Chrome pra pasta{" "}
                    <span className="num" style={{ color: "var(--cyan)" }}>C:\Program Files\NITO LIVE</span>.
                    Você não precisa extrair nem copiar nada na mão.
                  </p>
                </div>
              </div>

              {/* A extensao do Shopee ja vem descompactada dentro da propria
                  instalacao do .exe (payload\Extension no instalador), num
                  caminho fixo - por isso aqui nao existe passo de "extrair
                  .zip" como na aba /extensao do TikTok. So falta carregar
                  ela no Chrome, porque ela nao esta publicada na Web Store. */}
              <div className="passo">
                <div className="n">3</div>
                <div className="c">
                  <b>Carregar a extensão no Chrome</b>
                  <p className="muted tiny">
                    Abra <span className="num" style={{ color: "var(--cyan)" }}>chrome://extensions</span> e
                    ligue o <strong>Modo do desenvolvedor</strong> no canto superior direito.
                  </p>
                  <p className="muted tiny" style={{ marginTop: 6 }}>
                    Clique em <strong>Carregar sem compactação</strong> e escolha a pasta{" "}
                    <span className="num" style={{ color: "var(--cyan)" }}>
                      C:\Program Files\NITO LIVE\Extension
                    </span>
                    . A extensão aparece na lista — não precisa mexer em mais nada aqui.
                  </p>
                </div>
              </div>

              <div className="passo">
                <div className="n">4</div>
                <div className="c">
                  <b>Ativar com sua chave</b>
                  <p className="muted tiny">
                    Abra o NITO LIVE Shopee, cole a chave que está ao lado e pronto — ele reconhece sua
                    assinatura e libera sozinho.
                  </p>
                </div>
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
                <h2 className="h-sec">Suas chaves Shopee</h2>
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
                  Você ainda não tem chave Shopee gerada. Use o botão abaixo para criar a primeira.
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

export default function ShopeePage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
