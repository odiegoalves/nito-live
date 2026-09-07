"use client";

// =============================================================================
// NITO LIVE - Shopee.
// Igual a aba da Extensao (TikTok), so que fala com o produto "shopee" no
// servidor de licencas. Mesma engrenagem, chave separada, mesma conta.
// Instalador (NitoLiveSetup.exe) hospedado em public/downloads/ e servido
// como asset estatico pelo Next.js/Vercel, mesmo esquema ja usado pelo
// LIVE INFINITY em public/downloads/*.zip.
// =============================================================================

import React, { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Chaves, RespostaChaves, Perfil } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [chaves, setChaves] = useState<RespostaChaves | null>(null);
  const [carregandoChaves, setCarregandoChaves] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erroChaves, setErroChaves] = useState<string | null>(null);
  const [copiada, setCopiada] = useState<string | null>(null);

  useEffect(() => {
    Chaves.chamar("listar", "shopee")
      .then(setChaves)
      .catch((e) => setErroChaves(e instanceof Error ? e.message : "Falha ao buscar suas chaves."))
      .finally(() => setCarregandoChaves(false));
  }, []);

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

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="stack">
            <div className="panel pad">
              <div className="passo">
                <div className="n">1</div>
                <div className="c">
                  <b>Baixar o programa</b>
                  <p className="muted tiny">
                    Baixe o instalador do NITO LIVE Shopee pra Windows (64 bits).
                  </p>
                  <a
                    className="btn p"
                    href="/downloads/NitoLiveSetup.exe"
                    download="NitoLiveSetup.exe"
                    style={{ marginTop: 10, display: "inline-flex" }}
                  >
                    Baixar NITO LIVE Shopee
                  </a>
                </div>
              </div>

              <div className="passo">
                <div className="n">2</div>
                <div className="c">
                  <b>Instalar</b>
                  <p className="muted tiny">
                    Abra o instalador baixado e siga as telas até o fim.
                  </p>
                </div>
              </div>

              <div className="passo">
                <div className="n">3</div>
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
