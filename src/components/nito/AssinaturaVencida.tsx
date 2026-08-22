"use client";

// =============================================================================
// NITO LIVE - tela de assinatura vencida.
//
// E a unica coisa que a pessoa ve quando a assinatura nao esta em dia. Nenhuma
// aba abre por tras dela. O objetivo e ser clara e ter saida: dizer o que
// aconteceu, quando venceu, e levar ao checkout do plano DELA em um clique.
//
// Quando o plano nao e identificado (falha de rede, cadastro sem plano), a tela
// mostra os tres com o preco em cada botao. Ninguem pode ficar preso sem
// conseguir pagar so porque uma consulta falhou.
//
// Tem tambem "ja renovei" porque existe atraso real entre o pagamento na Cakto
// e a liberacao aqui. Sem ele, quem acabou de pagar ficaria olhando uma tela
// que insiste que ele nao pagou.
// =============================================================================

import React, { useState } from "react";
import { Auth, Perfil } from "@/lib/nito-motor";

// -----------------------------------------------------------------------------
// AJUSTE AQUI - enderecos usados pela tela.
// -----------------------------------------------------------------------------
const PLANOS = [
  { chave: "basic",   rotulo: "Básico",  preco: "R$ 67",  link: "https://pay.cakto.com.br/xd4yj7y" },
  { chave: "pro",     rotulo: "Pro",     preco: "R$ 97",  link: "https://pay.cakto.com.br/3477jz3_976117" },
  { chave: "premium", rotulo: "Premium", preco: "R$ 147", link: "https://pay.cakto.com.br/mdz39dg" },
];

// WhatsApp do suporte. A mensagem ja vai escrita para o cliente nao precisar
// explicar do zero - e para voce identificar o assunto de imediato.
const WHATSAPP_SUPORTE = "5537998244669";
const LINK_SUPORTE =
  "https://wa.me/" + WHATSAPP_SUPORTE +
  "?text=" + encodeURIComponent("Ola! Minha assinatura do NITO LIVE aparece como vencida e preciso de ajuda para renovar.");
// -----------------------------------------------------------------------------

// A mesma ideia de plano aparece com nomes diferentes no painel de licencas.
// Normalizar aqui evita mandar o cliente para o checkout errado.
function planoConhecido(bruto?: string | null) {
  const p = String(bruto ?? "").trim().toLowerCase();
  if (!p) return null;
  if (p.startsWith("bas") || p === "67") return PLANOS[0];
  if (p.startsWith("pro") || p === "97") return PLANOS[1];
  if (p.startsWith("prem") || p === "unlimited" || p === "ilimitado" || p === "147") return PLANOS[2];
  return null;
}

interface Props {
  perfil: Perfil;
  plano?: string | null;
  verificando: boolean;
  onVerificarDeNovo: () => void;
  erro?: string | null;
}

function formatarData(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function AssinaturaVencida({ perfil, plano, verificando, onVerificarDeNovo, erro }: Props) {
  const [saindo, setSaindo] = useState(false);
  const venceuEm = formatarData(perfil.assinatura_expira_em);
  const primeiroNome = (perfil.nome || perfil.username || "").trim().split(/\s+/)[0];
  const meuPlano = planoConhecido(plano);

  const sair = async () => {
    setSaindo(true);
    try {
      await Auth.sair();
      window.location.href = "/login";
    } catch {
      setSaindo(false);
    }
  };

  return (
    <div className="nito">
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div className="panel" style={{ maxWidth: 540, width: "100%", padding: "32px 28px" }}>
          <div className="stack" style={{ gap: 18 }}>

            <div className="spread" style={{ alignItems: "flex-start", gap: 16 }}>
              <div className="stack" style={{ gap: 8 }}>
                <span className="pill">Assinatura vencida</span>
                <h1 className="title-xl" style={{ fontSize: "1.55rem", lineHeight: 1.15 }}>
                  {primeiroNome ? `${primeiroNome}, sua ` : "Sua "}
                  <em>assinatura expirou</em>.
                </h1>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="robo-hero" src="/nito-robo.webp" alt="" style={{ width: 96, flexShrink: 0 }} />
            </div>

            <p className="sub" style={{ margin: 0 }}>
              {venceuEm
                ? `Seu acesso valeu até ${venceuEm}. Enquanto a renovação não entra, a comunidade, as aulas, o painel de vendas e a geração de chave ficam pausados.`
                : "Não encontramos uma assinatura em dia para a sua conta. Enquanto isso, a comunidade, as aulas, o painel de vendas e a geração de chave ficam pausados."}
            </p>

            <div
              className="pad"
              style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <p className="tiny" style={{ margin: 0 }}>
                <b>Sua chave da extensão continua sua.</b> Assim que a renovação for confirmada,
                ela volta a funcionar no mesmo computador, sem precisar gerar outra.
              </p>
            </div>

            {erro && (
              <p className="tiny" style={{ margin: 0, color: "#ff8a80" }}>
                {erro}
              </p>
            )}

            {meuPlano ? (
              <div className="stack" style={{ gap: 8 }}>
                <span className="tiny muted">
                  Seu plano: <b>{meuPlano.rotulo}</b> — {meuPlano.preco} por mês
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <a className="btn p" href={meuPlano.link} target="_blank" rel="noopener noreferrer">
                    Renovar {meuPlano.rotulo} — {meuPlano.preco}
                  </a>
                  <button className="btn" type="button" onClick={onVerificarDeNovo} disabled={verificando}>
                    {verificando ? "Verificando..." : "Já renovei — verificar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                <span className="tiny muted">
                  Não consegui identificar seu plano agora. Escolha o que você assina:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PLANOS.map((p) => (
                    <a
                      key={p.chave}
                      className="btn"
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {p.rotulo} — {p.preco}
                    </a>
                  ))}
                </div>
                <button
                  className="btn p"
                  type="button"
                  onClick={onVerificarDeNovo}
                  disabled={verificando}
                  style={{ alignSelf: "flex-start" }}
                >
                  {verificando ? "Verificando..." : "Já renovei — verificar"}
                </button>
              </div>
            )}

            <p className="tiny muted" style={{ margin: 0 }}>
              Pagou agora? A confirmação pode levar alguns minutos. Clique em{" "}
              <b>Já renovei — verificar</b> depois de um instante.
            </p>

            <div
              className="spread"
              style={{
                borderTop: "1px solid rgba(255,255,255,.08)",
                paddingTop: 14,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <a className="tiny" href={LINK_SUPORTE} target="_blank" rel="noopener noreferrer">
                Falar com o suporte
              </a>
              <button
                className="tiny muted"
                type="button"
                onClick={sair}
                disabled={saindo}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {saindo ? "Saindo..." : "Sair da conta"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
