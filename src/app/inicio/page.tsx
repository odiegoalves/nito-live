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
import { Vendas, Perfil, Fmt, Chaves, Aulas, RespostaChaves } from "@/lib/nito-motor";
import { diasRestantes } from "@/lib/nito-gamificacao";

// Primeiros passos de quem acabou de entrar. Cada item se marca sozinho com
// o que ja aconteceu de verdade (chave gerada, aparelho ativado, aula vista,
// venda registrada). Quando tudo estiver feito, o bloco some.
interface Passos {
  chave: boolean;
  ativou: boolean;
  aula: boolean;
  venda: boolean;
  paginaProduto: "/extensao" | "/shopee";
}

async function carregarPassos(): Promise<Passos> {
  let chaves: RespostaChaves | null = await Chaves.chamar("listar").catch(() => null);
  // Quem comprou so o Shopee tem a chave na outra aba.
  if (chaves?.liberado && !chaves.liberado.tiktok && chaves.liberado.shopee) {
    chaves = await Chaves.chamar("listar", "shopee").catch(() => chaves);
  }
  const [progresso, vendas] = await Promise.all([
    Aulas.meuProgresso().catch(() => ({})),
    Vendas.listar({ limite: 1 }).catch(() => []),
  ]);
  const lista = chaves?.chaves ?? [];
  return {
    chave: lista.length > 0,
    ativou: lista.some((c) => c.vinculada),
    aula: Object.values(progresso).some((p) => p.concluida || (p.segundos ?? 0) > 0),
    venda: vendas.length > 0,
    paginaProduto: chaves?.produto === "shopee" ? "/shopee" : "/extensao",
  };
}

const ATALHOS = [
  { href: "/extensao", ic: "🔑", titulo: "Extensão e chave", texto: "Baixe, instale e ative" },
  { href: "/aulas", ic: "🎬", titulo: "Aulas", texto: "Do zero à primeira venda" },
  { href: "/comunidade", ic: "💬", titulo: "Comunidade", texto: "Novidades e dicas" },
  { href: "/suporte", ic: "🛟", titulo: "Suporte", texto: "Fale com a equipe" },
];

interface Resumo {
  faturamento_centavos: number;
  pedidos_aprovados: number;
  ticket_medio_centavos: number;
}

const VAZIO: Resumo = { faturamento_centavos: 0, pedidos_aprovados: 0, ticket_medio_centavos: 0 };

// Mesmo filtro de período usado em /vendas, para a pessoa não precisar
// aprender dois jeitos diferentes de olhar o mesmo número.
const PERIODOS = [
  { chave: "dia", rotulo: "Dia", dias: 1 },
  { chave: "semana", rotulo: "Semana", dias: 7 },
  { chave: "mes", rotulo: "Mês", dias: 30 },
  { chave: "ano", rotulo: "Ano", dias: 365 },
] as const;

type Chave = (typeof PERIODOS)[number]["chave"];

function Conteudo({ perfil }: { perfil: Perfil }) {
  const [periodo, setPeriodo] = useState<Chave>("mes");
  const [resumo, setResumo] = useState<Resumo>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [passos, setPassos] = useState<Passos | null>(null);

  useEffect(() => {
    let vivo = true;
    carregarPassos()
      .then((p) => vivo && setPassos(p))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const diasPeriodo = PERIODOS.find((p) => p.chave === periodo)!.dias;

  useEffect(() => {
    let vivo = true;
    setCarregando(true);

    const buscar = () =>
      Vendas.resumo(diasPeriodo)
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
  }, [diasPeriodo]);

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

        <div className="periodo" style={{ margin: "18px 0 4px" }}>
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

        <div className="cards">
          <div className="panel kpi money">
            <div className="lab">
              💰 Faturamento · {PERIODOS.find((p) => p.chave === periodo)!.rotulo.toLowerCase()}
            </div>
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

        {passos && !(passos.chave && passos.ativou && passos.aula && passos.venda) && (
          <div className="panel pad" style={{ marginTop: 16 }}>
            <div className="spread">
              <h2 className="h-sec">Primeiros passos</h2>
              <span className="eyebrow">
                {[passos.chave, passos.ativou, passos.aula, passos.venda].filter(Boolean).length} DE 4
              </span>
            </div>
            <div className="passos-inicio">
              {[
                { ok: passos.chave, titulo: "Pegue sua chave", texto: "Ela já fica pronta na aba do seu produto.", href: passos.paginaProduto, ir: "VER CHAVE" },
                { ok: passos.ativou, titulo: "Instale e ative", texto: "Baixe, instale e cole a chave. Leva uns 3 minutos.", href: passos.paginaProduto, ir: "INSTALAR" },
                { ok: passos.aula, titulo: "Assista à primeira aula", texto: "O passo a passo para a sua primeira live.", href: "/aulas", ir: "ASSISTIR" },
                { ok: passos.venda, titulo: "Faça sua primeira venda", texto: "Ela aparece aqui sozinha quando a extensão registrar.", href: "/aulas", ir: "VER DICAS" },
              ].map((p, i) => (
                <a key={p.titulo} href={p.href} className={`passo-item${p.ok ? " ok" : ""}`}>
                  <span className="ck">{p.ok ? "✓" : i + 1}</span>
                  <div>
                    <b>{p.titulo}</b>
                    <span>{p.texto}</span>
                  </div>
                  {!p.ok && <span className="ir">{p.ir} →</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="atalhos">
          {ATALHOS.map((a) => (
            <a key={a.href} href={a.href} className="atalho">
              <span className="ic">{a.ic}</span>
              <b>{a.titulo}</b>
              <span>{a.texto}</span>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function InicioPage() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
