"use client";

// =============================================================================
// NITO LIVE - Minhas Vendas.
// Tudo que a extensao registrou nas lives do TikTok Shop. O filtro de periodo
// vale para os tres numeros do topo, para o historico e para o ranking de
// produtos ao mesmo tempo - senao a pessoa compara mes com semana sem perceber.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Vendas, Venda, Perfil, Fmt } from "@/lib/nito-motor";

const PERIODOS = [
  { chave: "dia", rotulo: "Dia", dias: 1 },
  { chave: "semana", rotulo: "Semana", dias: 7 },
  { chave: "mes", rotulo: "Mês", dias: 30 },
  { chave: "ano", rotulo: "Ano", dias: 365 },
] as const;

type Chave = (typeof PERIODOS)[number]["chave"];

const SITUACAO: Record<Venda["status"], { pill: string; texto: string }> = {
  aprovado: { pill: "ok", texto: "Aprovado" },
  pendente: { pill: "wait", texto: "Processando" },
  cancelado: { pill: "no", texto: "Cancelado" },
  reembolsado: { pill: "no", texto: "Reembolsado" },
};

function faixaDeDatas(dias: number) {
  const fim = new Date();
  const ini = new Date(Date.now() - dias * 864e5);
  const f = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  if (dias === 1) return fim.toLocaleDateString("pt-BR");
  return `${f(ini)} A ${fim.toLocaleDateString("pt-BR")}`;
}

function quando(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${d.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [periodo, setPeriodo] = useState<Chave>("mes");
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ultimaSync, setUltimaSync] = useState<string | null>(null);

  const dias = PERIODOS.find((p) => p.chave === periodo)!.dias;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await Vendas.listar({ dias, limite: 1000 });
      setVendas(lista);
      setUltimaSync(lista[0]?.criado_em ?? null);
    } catch {
      setVendas([]);
    } finally {
      setCarregando(false);
    }
  }, [dias]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Venda nova chega da extensao sem a pessoa recarregar a pagina.
  useEffect(() => {
    const parar = Vendas.assinar(() => carregar());
    return () => parar();
  }, [carregar]);

  const resumo = useMemo(() => {
    const aprovadas = vendas.filter((v) => v.status === "aprovado");
    const faturamento = aprovadas.reduce((t, v) => t + (v.valor_centavos ?? 0), 0);
    const pendentes = vendas.filter((v) => v.status === "pendente").length;
    return {
      faturamento,
      pedidos: aprovadas.length,
      ticket: aprovadas.length ? Math.round(faturamento / aprovadas.length) : 0,
      pendentes,
    };
  }, [vendas]);

  const ranking = useMemo(() => Vendas.agruparPorProduto(vendas).slice(0, 6), [vendas]);
  const topo = ranking[0]?.centavos ?? 1;

  return (
    <AppShell perfil={perfil} ativa="vendas">
      <div className="view on">
        <div className="spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 className="title-xl">
              Vendas <em>TikTok</em>.
            </h1>
            <p className="sub">
              Tudo que a extensão NITO registrou nas suas lives do TikTok Shop, em tempo real. As
              comissões de afiliado do NITO LIVE (Cakto) ficam separadas em &quot;Vendas NITO LIVE&quot;.
            </p>
          </div>
        </div>

        <div className="spread" style={{ margin: "20px 0 4px", flexWrap: "wrap", gap: 10 }}>
          <div className="periodo">
            {PERIODOS.map((p) => (
              <button
                key={p.chave}
                className={periodo === p.chave ? "on" : ""}
                onClick={() => setPeriodo(p.chave)}
                type="button"
              >
                {p.rotulo}
              </button>
            ))}
          </div>
          <span className="eyebrow">{faixaDeDatas(dias)}</span>
        </div>

        <div className="cards">
          <div className="panel kpi money">
            <div className="lab">💰 Faturamento</div>
            <div className="val">{carregando ? "—" : Fmt.brl(resumo.faturamento)}</div>
            <div className="dt">{PERIODOS.find((p) => p.chave === periodo)!.rotulo.toLowerCase()} atual</div>
          </div>
          <div className="panel kpi">
            <div className="lab">📦 Pedidos aprovados</div>
            <div className="val">{carregando ? "—" : resumo.pedidos.toLocaleString("pt-BR")}</div>
            <div className="dt">
              {resumo.pendentes > 0
                ? `${resumo.pendentes} aguardando confirmação`
                : "nenhum pendente"}
            </div>
          </div>
          <div className="panel kpi gold">
            <div className="lab">🎯 Ticket médio</div>
            <div className="val">{carregando ? "—" : Fmt.brl(resumo.ticket)}</div>
            <div className="dt">por pedido aprovado</div>
          </div>
          <div className="panel kpi cyan">
            <div className="lab">📡 Sincronização</div>
            <div className="val" style={{ fontSize: "1.15rem" }}>
              {ultimaSync ? Fmt.quando(ultimaSync) : "sem dados"}
            </div>
            <div className="dt">última venda registrada pela extensão</div>
          </div>
        </div>

        <div className="grid2">
          <div className="panel">
            <div className="pad spread" style={{ borderBottom: "1px solid var(--line)" }}>
              <h2 className="h-sec">Histórico de vendas</h2>
              <span className="eyebrow">
                {vendas.length} {vendas.length === 1 ? "PEDIDO" : "PEDIDOS"}
              </span>
            </div>

            {carregando && (
              <div className="pad muted" style={{ textAlign: "center" }}>Carregando vendas…</div>
            )}

            {!carregando && vendas.length === 0 && (
              <div className="pad muted" style={{ textAlign: "center" }}>
                Nenhuma venda neste período. Quando a extensão registrar uma venda na sua live, ela
                aparece aqui sozinha.
              </div>
            )}

            {!carregando && vendas.length > 0 && (
              <div className="tabela-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Produto</th>
                      <th>Live</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.slice(0, 100).map((v) => {
                      const st = SITUACAO[v.status] ?? SITUACAO.pendente;
                      return (
                        <tr key={v.id}>
                          <td className="num">{v.id_pedido}</td>
                          <td>{v.produto ?? "—"}</td>
                          <td className="muted num">{quando(v.ocorrido_em)}</td>
                          <td className="v">{Fmt.brl(v.valor_centavos)}</td>
                          <td>
                            <span className={`pill ${st.pill}`}>{st.texto}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="stack">
            <div className="panel pad">
              <div className="spread" style={{ marginBottom: 14 }}>
                <h2 className="h-sec">Mais vendidos</h2>
                <span className="eyebrow">no período</span>
              </div>

              {ranking.length === 0 && (
                <div className="muted tiny">Sem vendas aprovadas para ranquear ainda.</div>
              )}

              {ranking.map((p, i) => (
                <div className="prod" key={p.produto}>
                  <span className="pos">{i + 1}</span>
                  <div className="nm">
                    <b>{p.produto}</b>
                    <span className="qtd">
                      {p.unidades} {p.unidades === 1 ? "unidade" : "unidades"}
                    </span>
                    <div className="barp">
                      <i style={{ width: `${Math.max(6, Math.round((p.centavos / topo) * 100))}%` }} />
                    </div>
                  </div>
                  <span className="vl">{Fmt.brl(p.centavos)}</span>
                </div>
              ))}
            </div>

            <div
              className="panel pad"
              style={{
                borderColor: "rgba(34,230,255,.24)",
                background: "linear-gradient(160deg,rgba(34,230,255,.06),var(--surf))",
              }}
            >
              <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontSize: "1.3rem" }}>📡</div>
                <div>
                  <b style={{ fontSize: ".88rem" }}>
                    {ultimaSync ? "Conectado à extensão" : "Aguardando a extensão"}
                  </b>
                  <p className="muted tiny" style={{ marginTop: 5 }}>
                    {ultimaSync
                      ? "Toda venda fechada na sua live aparece aqui sozinha, sem você lançar nada."
                      : "Nenhuma venda chegou ainda. A ponte entre a extensão e o site é o próximo passo do projeto."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function VendasPage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
