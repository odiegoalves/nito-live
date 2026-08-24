"use client";

// =============================================================================
// NITO LIVE - Extensao.
// O membro baixa o arquivo publicado e ve a situacao da licenca dele.
// A administracao troca o arquivo por aqui, sem mexer em servidor.
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell, ehAdmin } from "@/components/nito/AppShell";
import { Extensao, VersaoExtensao, Chaves, RespostaChaves, Perfil, comoErro } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

function mb(bytes?: number | null) {
  if (!bytes) return "";
  // O Helper tem 33 KB. Em MB isso vira "0.0 MB", que o cliente le como
  // arquivo vazio ou defeito. Abaixo de um mega, mostra em KB.
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
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
  // O Helper e opcional: se nao vier, a versao herda o ultimo publicado.
  const [helper, setHelper] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const helperRef = useRef<HTMLInputElement>(null);

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
      const nova = await Extensao.publicarVersao(numero.trim(), arquivo, notas.trim() || undefined, helper);
      setVersao(nova);
      setNumero("");
      setNotas("");
      setArquivo(null);
      setHelper(null);
      setOk(
        helper
          ? "Versão e Helper publicados. Todo membro já baixa os dois a partir de agora."
          : "Versão publicada. O Helper continua sendo o último que você enviou."
      );
    } catch (e) {
      setErro(comoErro(e, "Não consegui publicar a versão.").message);
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

            {/* O Helper e um download separado, nao um pedaco da extensao.
                Quem instala a extensao pode viver sem ele; quem quer o ajuste
                automatico de qualidade precisa dele. Por isso campo proprio, e
                opcional: deixando vazio, a versao nova herda o Helper que ja
                estava publicado, em vez de sumir com o download. */}
            <div className="campo" style={{ marginTop: 12 }}>
              <label>NITO Helper (.zip) — opcional</label>
              <input
                ref={helperRef}
                type="file"
                accept=".zip"
                hidden
                onChange={(e) => setHelper(e.target.files?.[0] ?? null)}
              />
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <button className="btn g" onClick={() => helperRef.current?.click()} type="button">
                  {helper ? `${helper.name} (${mb(helper.size)})` : "Escolher o Helper"}
                </button>
                {helper && (
                  <button className="btn g" onClick={() => setHelper(null)} type="button">
                    Tirar
                  </button>
                )}
                <span className="muted tiny">
                  {helper
                    ? "vai substituir o Helper publicado hoje"
                    : versao?.helper_url
                    ? "deixando vazio, mantém o Helper que já está no ar"
                    : "nenhum Helper publicado ainda"}
                </span>
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
          <div className="stack">
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

            {/* O passo de extrair existe separado de proposito. A instrucao
                antiga mandava arrastar o .zip para a pagina do Chrome, e o
                Chrome ignora .zip calado - ele so aceita PASTA pelo botao
                "Carregar sem compactacao". Quem seguia ao pe da letra travava
                aqui sem entender por que, e sem mensagem de erro nenhuma. */}
            <div className="passo">
              <div className="n">2</div>
              <div className="c">
                <b>Extrair o arquivo</b>
                <p className="muted tiny">
                  Clique com o botão direito no arquivo baixado e escolha{" "}
                  <strong>Extrair tudo</strong>. Vai virar uma <strong>pasta</strong> com o mesmo nome.
                </p>
                <p className="muted tiny" style={{ marginTop: 6 }}>
                  Esse passo é obrigatório: o Chrome instala a pasta, não o arquivo compactado.
                </p>
              </div>
            </div>

            <div className="passo">
              <div className="n">3</div>
              <div className="c">
                <b>Instalar no Chrome</b>
                <p className="muted tiny">
                  Abra <span className="num" style={{ color: "var(--cyan)" }}>chrome://extensions</span> e ligue o{" "}
                  <strong>Modo do desenvolvedor</strong> no canto superior direito.
                </p>
                <p className="muted tiny" style={{ marginTop: 6 }}>
                  Clique em <strong>Carregar sem compactação</strong> e escolha a <strong>pasta</strong> que você extraiu
                  no passo anterior.
                </p>
              </div>
            </div>

            <div className="passo">
              <div className="n">4</div>
              <div className="c">
                <b>Ativar com sua chave</b>
                <p className="muted tiny">
                  Abra a extensão e entre com o mesmo e-mail que você usa aqui. Ela reconhece sua
                  assinatura e libera sozinha.
                </p>
              </div>
            </div>
          </div>

          {/* ── NITO Helper ──────────────────────────────────────────────────
              Fica num painel proprio, DEPOIS da extensao, e nao como um passo
              dela. E deliberado: a extensao funciona sem o Helper, e misturar os
              dois faria o cliente achar que a instalacao falhou quando so o
              Helper faltasse. Aqui ele aparece como o que e - um acessorio que
              melhora, nao um pedaco que falta. */}
          <div className="panel pad" style={{ marginTop: 18 }}>
            <div className="spread" style={{ alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="row" style={{ gap: 9, marginBottom: 6 }}>
                  <h2 className="h-sec" style={{ margin: 0 }}>NITO Helper</h2>
                  <span className="pill wait">opcional</span>
                </div>
                <p className="muted tiny" style={{ maxWidth: "60ch" }}>
                  Um programinha que mede a força do seu computador — processador, memória e placa
                  de vídeo — e conta para o NITO. Com essa informação, o <strong>NITO Flow</strong> escolhe
                  sozinho a qualidade certa da sua transmissão: forte o bastante para ficar bonita,
                  leve o bastante para não travar no meio da live.
                </p>
                <p className="muted tiny" style={{ maxWidth: "60ch", marginTop: 8 }}>
                  <strong>Sem ele o NITO funciona igual</strong>, só que usando um ajuste médio, que às vezes
                  é conservador demais para um PC bom e pesado demais para um PC simples.
                </p>
              </div>
            </div>

            {versao?.helper_url ? (
              <a
                className="material"
                href={versao.helper_url}
                download
                style={{ marginTop: 14, textDecoration: "none", color: "inherit" }}
              >
                <div className="mi">🖥️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>NITO-Native-Helper.zip</b>
                  <span>{versao.helper_bytes ? mb(versao.helper_bytes) : "instalador do Helper"}</span>
                </div>
                <span className="go">BAIXAR</span>
              </a>
            ) : (
              <p className="muted tiny" style={{ marginTop: 14 }}>
                {admin
                  ? "Nenhum Helper publicado ainda — use o campo do painel acima para enviar."
                  : "O Helper ainda não foi publicado. Volte em breve."}
              </p>
            )}

            {versao?.helper_url && (
              <div style={{ marginTop: 6 }}>
                  <div className="passo">
                    <div className="n">1</div>
                    <div className="c">
                      <b>Extrair o arquivo</b>
                      <p className="muted tiny">
                        Botão direito no arquivo baixado → <strong>Extrair tudo</strong>. Precisa extrair:
                        rodar de dentro do compactado não funciona.
                      </p>
                    </div>
                  </div>

                  <div className="passo">
                    <div className="n">2</div>
                    <div className="c">
                      <b>Dois cliques em INSTALAR.bat</b>
                      <p className="muted tiny">
                        Se o Windows avisar que protegeu o computador, clique em{" "}
                        <strong>Mais informações</strong> e depois em <strong>Executar assim mesmo</strong>. A tela mostra
                        o que foi feito e espera você apertar uma tecla.
                      </p>
                    </div>
                  </div>
                  <div className="passo">
                    <div className="n">3</div>
                    <div className="c">
                      <b>Fechar e abrir o Chrome</b>
                      <p className="muted tiny">
                        Todas as janelas, não só a aba. O Chrome só enxerga o Helper quando inicia
                        do zero — pular este passo é o motivo nº 1 de &quot;instalei e não funcionou&quot;.
                      </p>
                    </div>
                  </div>

                  <div className="passo">
                    <div className="n">4</div>
                    <div className="c">
                      <b>Conferir no NITO Flow</b>
                      <p className="muted tiny">
                        Abra o NITO Flow, aba <strong>Qualidade</strong>, e clique em{" "}
                        <strong>Detectar meu PC de novo</strong>. Deve aparecer o seu processador, memória e
                        placa de vídeo. Se aparecer, está pronto.
                      </p>
                    </div>
                  </div>
              </div>
            )}
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
