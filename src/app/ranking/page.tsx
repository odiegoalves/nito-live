"use client";

// =============================================================================
// NITO LIVE - Ranking.
//
// Aqui NAO entra venda de produto do TikTok. Estas sao as vendas do proprio
// NITO LIVE feitas por indicacao: alguem usa o link de afiliado da Cakto,
// compra, e a comissao recebida vira XP.
//
// Regra: R$ 1,00 de comissao = 10 XP. Reembolso e chargeback descontam, para
// o ranking nunca mostrar venda que voltou atras.
//
// Fundador e moderador ficam de fora da disputa - a equipe nao concorre com o
// cliente, embora a patente deles suba normalmente.
//
// O recorte do mes existe por causa da premiacao: ranking so acumulado congela,
// quem chegou primeiro fica na frente para sempre e o novo nunca alcanca.
// =============================================================================

import React, { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Indicacoes, VendaAfiliado, RankingAfiliado, Perfil, Fmt } from "@/lib/nito-motor";
import { patenteDoNivel, progressoNoNivel, proximaPatente, iniciais } from "@/lib/nito-gamificacao";

const LINKS = [
  { nome: "NITO LIVE", url: "https://app.cakto.com.br/affiliate/invite/e5505d59-fb55-492b-b877-4d675df3e3a5" },
  { nome: "LiveCam", url: "https://app.cakto.com.br/affiliate/invite/f6467a03-fe9d-4cab-ae7a-01034717dbec" },
  { nome: "Lives Automáticas", url: "https://app.cakto.com.br/affiliate/invite/6bbdc0c1-5f68-4fba-810f-4f768f12f9fc" },
];

// ---------------------------------------------------------------------------
// PREMIACOES DO MES
//
// Enquanto esta lista estiver vazia, a secao inteira nao aparece na tela - de
// proposito. Caixa vazia escrita "em breve" tira credibilidade do ranking.
//
// Para ligar, e so preencher aqui. Exemplo do formato:
//   { posicao: "1º lugar", premio: "R$ 500 em dinheiro", detalhe: "pago junto com a comissao" },
// ---------------------------------------------------------------------------
const PREMIACOES: { posicao: string; premio: string; detalhe?: string }[] = [];

function quando(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function nomeDoMes() {
  return new Date().toLocaleDateString("pt-BR", { month: "long" });
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [vendas, setVendas] = useState<VendaAfiliado[]>([]);
  const [ranking, setRanking] = useState<RankingAfiliado[]>([]);
  const [periodo, setPeriodo] = useState<"mes" | "geral">("mes");
  const [carregando, setCarregando] = useState(true);
  const [buscandoRanking, setBuscandoRanking] = useState(false);

  const buscarRanking = useCallback(async (qual: "mes" | "geral") => {
    setBuscandoRanking(true);
    try {
      const lista = await Indicacoes.ranking(10, qual === "mes" ? Indicacoes.inicioDoMes() : null);
      setRanking(lista);
    } catch {
      /* sem ranking agora: a tela continua util com os numeros da pessoa */
    } finally {
      setBuscandoRanking(false);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    Indicacoes.minhas(100)
      .then((v) => vivo && setVendas(v))
      .catch(() => {
        /* sem historico: os cartoes ficam zerados, e nada quebra */
      })
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    buscarRanking(periodo);
  }, [periodo, buscarRanking]);

  const total = Indicacoes.resumir(vendas);
  const patente = patenteDoNivel(perfil.nivel ?? 1);
  const prox = proximaPatente(perfil.nivel ?? 1);
  const prog = progressoNoNivel(perfil.nivel ?? 1, perfil.xp ?? 0);

  return (
    <AppShell perfil={perfil} ativa="ranking" recado="Cada indicação sua vira patente.">
      <div className="view on">
        <div>
          <h1 className="title-xl">
            Ranking de <em>indicações</em>.
          </h1>
          <p className="sub">
            Quem mais traz gente nova para o NITO LIVE. Cada R$ 1,00 de comissão vale 10 XP, e é o
            XP que sobe a patente. Venda de produto na sua live não conta aqui — ela fica em
            Minhas Vendas.
          </p>
        </div>

        {/* ---- sua patente ------------------------------------------------ */}
        <div className="panel pad" style={{ marginTop: 16 }}>
          <div className="spread" style={{ gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div className="row" style={{ gap: 14, alignItems: "center" }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 15,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--grad)",
                  font: "900 1.15rem/1 var(--disp)",
                  color: "#fff",
                  flex: "none",
                }}
              >
                {patente.romano}
              </div>
              <div>
                <div style={{ font: "900 1.05rem/1.1 var(--disp)", textTransform: "uppercase" }}>
                  {patente.nome}
                </div>
                <div className="muted tiny" style={{ marginTop: 3 }}>
                  Nível {perfil.nivel ?? 1} · {(perfil.xp ?? 0).toLocaleString("pt-BR")} XP
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="bar">
                <i
                  style={{
                    width: `${prog.percentual}%`,
                    background: "var(--grad)",
                    boxShadow: "0 0 14px rgba(255,15,61,.5)",
                  }}
                />
              </div>
              <div className="spread" style={{ marginTop: 7 }}>
                <span className="eyebrow">{prox ? `Próxima: ${prox.nome}` : "Patente máxima"}</span>
                <span className="num muted tiny">
                  {prog.atual.toLocaleString("pt-BR")} / {prog.meta.toLocaleString("pt-BR")} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---- números ---------------------------------------------------- */}
        <div className="cards" style={{ marginTop: 16 }}>
          <div className="panel kpi money">
            <div className="lab">💰 Comissão acumulada</div>
            <div className="val">{carregando ? "—" : Fmt.brl(total.comissao)}</div>
            <div className="dt">já descontando reembolso e chargeback</div>
          </div>
          <div className="panel kpi">
            <div className="lab">🤝 Vendas por indicação</div>
            <div className="val">{carregando ? "—" : total.vendas.toLocaleString("pt-BR")}</div>
            <div className="dt">pagas e confirmadas pela Cakto</div>
          </div>
          <div className="panel kpi cyan">
            <div className="lab">⚡ XP gerado por elas</div>
            <div className="val">{carregando ? "—" : total.xp.toLocaleString("pt-BR")}</div>
            <div className="dt">R$ 1,00 de comissão = 10 XP</div>
          </div>
        </div>

        {/* ---- premiação do mês ------------------------------------------- */}
        {PREMIACOES.length > 0 && (
          <div className="panel pad" style={{ marginTop: 16 }}>
            <div className="spread" style={{ marginBottom: 14 }}>
              <h2 className="h-sec">Premiação de {nomeDoMes()}</h2>
              <span className="eyebrow">FECHA NO ÚLTIMO DIA DO MÊS</span>
            </div>
            <div className="grid3">
              {PREMIACOES.map((p) => (
                <div
                  key={p.posicao}
                  style={{
                    background: "rgba(255,194,58,.07)",
                    border: "1px solid rgba(255,194,58,.28)",
                    borderRadius: 13,
                    padding: "14px 16px",
                  }}
                >
                  <div className="eyebrow" style={{ color: "var(--gold)" }}>{p.posicao}</div>
                  <div style={{ font: "900 1.05rem/1.15 var(--disp)", marginTop: 7 }}>{p.premio}</div>
                  {p.detalhe && (
                    <div className="muted tiny" style={{ marginTop: 5 }}>{p.detalhe}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid2" style={{ marginTop: 16 }}>
          {/* ---- ranking --------------------------------------------------- */}
          <div className="panel pad">
            <div className="spread" style={{ marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
              <h2 className="h-sec">Quem mais indica</h2>
              <div className="row" style={{ gap: 6 }}>
                {(["mes", "geral"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setPeriodo(q)}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 9,
                      cursor: "pointer",
                      font: "800 .64rem/1 var(--mono)",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: periodo === q ? "#fff" : "var(--mut)",
                      background: periodo === q ? "var(--grad)" : "transparent",
                      border: `1px solid ${periodo === q ? "transparent" : "var(--line)"}`,
                    }}
                  >
                    {q === "mes" ? "Este mês" : "Geral"}
                  </button>
                ))}
              </div>
            </div>

            {buscandoRanking && <div className="muted tiny">Carregando…</div>}

            {!buscandoRanking && ranking.length === 0 && (
              <p className="muted tiny" style={{ lineHeight: 1.55 }}>
                {periodo === "mes"
                  ? "Nenhuma indicação neste mês ainda. A primeira já abre a lista."
                  : "Ninguém no ranking ainda. A primeira venda por indicação abre a lista."}
              </p>
            )}

            {!buscandoRanking &&
              ranking.map((r, i) => {
                const p = patenteDoNivel(r.nivel ?? 1);
                const eu = r.user_id === perfil.id;
                return (
                  <div
                    key={r.user_id}
                    className="row"
                    style={{
                      gap: 11,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--line)",
                      alignItems: "center",
                      background: eu ? "rgba(255,15,61,.06)" : undefined,
                    }}
                  >
                    <span
                      className="num"
                      style={{
                        width: 22,
                        textAlign: "center",
                        fontWeight: 800,
                        fontSize: ".8rem",
                        color: i === 0 ? "var(--gold)" : "var(--mut2)",
                        flex: "none",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        background: i === 0 ? "var(--gradgold)" : "var(--surf3)",
                        color: i === 0 ? "#241700" : "#fff",
                        font: "800 .76rem/1 var(--disp)",
                        flex: "none",
                      }}
                    >
                      {iniciais(r.nome)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: ".85rem", fontWeight: 700, display: "block" }}>
                        {r.nome || "Membro"}
                        {eu && " · você"}
                      </b>
                      <span className="muted tiny">
                        {p.nome} · {r.vendas} {r.vendas === 1 ? "venda" : "vendas"} ·{" "}
                        {Fmt.brl(r.comissao_centavos ?? 0)}
                      </span>
                    </div>
                    <span className="num" style={{ fontWeight: 800, fontSize: ".82rem", flex: "none" }}>
                      {(r.xp ?? 0).toLocaleString("pt-BR")}
                    </span>
                  </div>
                );
              })}

            <p className="muted tiny" style={{ marginTop: 12, lineHeight: 1.5 }}>
              A equipe NITO LIVE não entra no ranking.
            </p>
          </div>

          {/* ---- histórico ------------------------------------------------ */}
          <div className="panel pad">
            <h2 className="h-sec" style={{ marginBottom: 14 }}>Suas vendas</h2>

            {carregando && <div className="muted tiny">Carregando…</div>}

            {!carregando && vendas.length === 0 && (
              <div>
                <p className="muted tiny" style={{ marginBottom: 14, lineHeight: 1.55 }}>
                  Você ainda não tem venda por indicação. Pegue seu link na Cakto, divulgue, e a
                  primeira comissão já aparece aqui — junto com o XP dela.
                </p>
                <div className="stack" style={{ gap: 9 }}>
                  {LINKS.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="material"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="mi">🔗</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b>{l.nome}</b>
                        <span>pegar meu link de afiliado</span>
                      </div>
                      <span className="go">ABRIR</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!carregando &&
              vendas.map((v) => {
                const estorno = v.sinal < 0;
                return (
                  <div
                    key={v.id}
                    className="spread"
                    style={{
                      padding: "11px 0",
                      borderBottom: "1px solid var(--line)",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <b style={{ fontSize: ".88rem", fontWeight: 700, display: "block" }}>
                        {v.produto || "NITO LIVE"}
                      </b>
                      <span className="num" style={{ fontSize: ".64rem", color: "var(--mut2)", letterSpacing: ".06em" }}>
                        {quando(v.criado_em).toUpperCase()}
                        {estorno && " · ESTORNO"}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", flex: "none" }}>
                      <div
                        className="num"
                        style={{
                          fontWeight: 800,
                          fontSize: ".92rem",
                          color: estorno ? "var(--red)" : "var(--green)",
                        }}
                      >
                        {estorno ? "−" : "+"}
                        {Fmt.brl(Math.abs(v.comissao_centavos))}
                      </div>
                      <div className="num" style={{ fontSize: ".64rem", color: "var(--mut2)" }}>
                        {v.xp > 0 ? "+" : ""}
                        {v.xp.toLocaleString("pt-BR")} XP
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PaginaRanking() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
