"use client";

// =============================================================================
// NITO LIVE - Inicio.
// Resumo do negocio do membro. Tres numeros e nada mais: o detalhe de cada
// area mora na aba dela. Os valores vem de Vendas.resumo e atualizam sozinhos
// quando a extensao registra uma venda nova.
// =============================================================================

import React, { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Vendas, Perfil, Fmt } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

interface Resumo {
  faturamento_centavos: number;
  pedidos_aprovados: number;
  ticket_medio_centavos: number;
}

const VAZIO: Resumo = { faturamento_centavos: 0, pedidos_aprovados: 0, ticket_medio_centavos: 0 };

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [resumo, setResumo] = useState<Resumo>(VAZIO);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;

    const buscar = () =>
      Vendas.resumo(30)
        .then((r) => {
          if (vivo) {
            setResumo(r);
            setCarregando(false);
          }
        })
        .catch(() => vivo && setCarregando(false));

    buscar();
    const parar = Vendas.assinar(() => buscar());
    return () => {
      vivo = false;
      parar();
    };
  }, []);

  const dias = diasRestantes(perfil.assinatura_expira_em);
  const venceEm = perfil.assinatura_expira_em
    ? new Date(perfil.assinatura_expira_em).toLocaleDateString("pt-BR")
    : null;

  // Barra da assinatura: 30 dias e o ciclo completo.
  const pctAssinatura = dias === null ? 0 : Math.max(0, Math.min(100, Math.round((dias / 30) * 100)));

  return (
    <AppShell perfil={perfil} ativa="inicio">
      <div className="view on">
        <div className="spread" style={{ alignItems: "flex-start" }}>
          <div>
            <h1 className="title-xl">
              Sua central de <em>operação</em>.
            </h1>
            <p className="sub">
              O resumo do seu negócio nas lives. O detalhe de cada área fica na aba correspondente,
              aqui do lado.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="robo-hero" src="/nito-robo.webp" alt="" />
        </div>

        <div className="cards">
          <div className="panel kpi money">
            <div className="lab">💰 Faturamento · 30 dias</div>
            <div className="val">
              {carregando ? "—" : Fmt.brl(resumo.faturamento_centavos)}
            </div>
            <div className="dt">
              {carregando ? "carregando…" : "registrado pela extensão nas suas lives"}
            </div>
          </div>

          <div className="panel kpi">
            <div className="lab">📦 Pedidos aprovados</div>
            <div className="val">{carregando ? "—" : resumo.pedidos_aprovados.toLocaleString("pt-BR")}</div>
            <div className="dt">
              {carregando
                ? "carregando…"
                : `ticket médio ${Fmt.brl(resumo.ticket_medio_centavos)}`}
            </div>
          </div>

          <div className="panel kpi cyan">
            <div className="lab">⏳ Sua assinatura</div>
            <div className="val">
              {dias === null ? "—" : `${dias} ${dias === 1 ? "dia" : "dias"}`}
            </div>
            <div className="dt">{venceEm ? `renova em ${venceEm}` : "sem data de renovação"}</div>
            <div className="bar" style={{ marginTop: 12 }}>
              <i
                style={{
                  width: `${pctAssinatura}%`,
                  background: "linear-gradient(100deg,#22e6ff,#2b8bff)",
                  boxShadow: "0 0 14px rgba(34,230,255,.5)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function InicioPage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
