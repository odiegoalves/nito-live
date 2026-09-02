"use client";

// =============================================================================
// NITO LIVE - Minhas Vendas (NITO LIVE / Cakto).
// Comissoes de indicacao do PROPRIO NITO LIVE, pagas pela Cakto. Nao tem
// nenhuma relacao com "Minhas Vendas" (essa outra tela e so o que a extensao
// registra nas lives do TikTok Shop) - separado de proposito, para nao
// misturar os dois tipos de venda na mesma lista.
// =============================================================================

import React, { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Indicacoes, VendaAfiliado, Perfil, Fmt } from "@/lib/nito-motor";

const SITUACAO: Record<string, { pill: string; texto: string }> = {
  venda: { pill: "ok", texto: "Comissão" },
  reembolso: { pill: "no", texto: "Reembolso" },
  chargeback: { pill: "no", texto: "Chargeback" },
};

function quando(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${d.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [lista, setLista] = useState<VendaAfiliado[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await Indicacoes.minhas(200);
      setLista(dados);
    } catch {
      setLista([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resumo = Indicacoes.resumir(lista);

  return (
    <AppShell perfil={perfil} ativa="vendas-nito-live">
      <div className="view on">
        <div className="spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 className="title-xl">
              Vendas <em>NITO LIVE</em>.
            </h1>
            <p className="sub">
              Suas comissões como afiliado do próprio NITO LIVE, pagas pela Cakto. Isso é diferente
              das vendas do TikTok Shop — essas ficam em &quot;Minhas Vendas&quot;.
            </p>
          </div>
        </div>

        <div className="cards">
          <div className="panel kpi money">
            <div className="lab">💰 Comissão acumulada</div>
            <div className="val">{carregando ? "—" : Fmt.brl(resumo.comissao)}</div>
            <div className="dt">total em vendas aprovadas</div>
          </div>
          <div className="panel kpi">
            <div className="lab">🤝 Vendas por indicação</div>
            <div className="val">{carregando ? "—" : resumo.vendas.toLocaleString("pt-BR")}</div>
            <div className="dt">aprovadas pela Cakto</div>
          </div>
          <div className="panel kpi gold">
            <div className="lab">⭐ XP ganho</div>
            <div className="val">{carregando ? "—" : resumo.xp.toLocaleString("pt-BR")}</div>
            <div className="dt">por indicações confirmadas</div>
          </div>
        </div>

        <div className="panel">
          <div className="pad spread" style={{ borderBottom: "1px solid var(--line)" }}>
            <h2 className="h-sec">Histórico de comissões</h2>
            <span className="eyebrow">
              {lista.length} {lista.length === 1 ? "REGISTRO" : "REGISTROS"}
            </span>
          </div>

          {carregando && (
            <div className="pad muted" style={{ textAlign: "center" }}>Carregando…</div>
          )}

          {!carregando && lista.length === 0 && (
            <div className="pad muted" style={{ textAlign: "center" }}>
              Nenhuma comissão ainda. Quando alguém assinar o NITO LIVE (ou outro produto da Valora)
              pelo seu link de afiliado, a comissão aparece aqui.
            </div>
          )}

          {!carregando && lista.length > 0 && (
            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Produto</th>
                    <th>Quando</th>
                    <th>Comissão</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.slice(0, 100).map((v) => {
                    const st = SITUACAO[v.tipo] ?? { pill: v.sinal < 0 ? "no" : "ok", texto: v.tipo };
                    return (
                      <tr key={v.id}>
                        <td className="num">{v.order_id ?? "—"}</td>
                        <td>{v.produto ?? "—"}</td>
                        <td className="muted num">{quando(v.criado_em)}</td>
                        <td className="v">{Fmt.brl((v.comissao_centavos || 0) * (v.sinal || 1))}</td>
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
      </div>
    </AppShell>
  );
}

export default function VendasNitoLivePage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
