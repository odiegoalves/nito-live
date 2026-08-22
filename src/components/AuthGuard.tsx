"use client";

// =============================================================================
// NITO LIVE - AuthGuard.
//
// Carrega o perfil do membro, confere se a assinatura esta em dia e so entao
// entrega a tela. Quem esta vencido ve a tela de renovacao e mais nada.
//
// De onde vem a verdade: a validade da assinatura mora no painel de licencas
// (VPS/MySQL), nao no Supabase. A funcao "chaves" e a ponte: ela consulta o
// painel e grava assinatura_ativa e assinatura_expira_em na ficha do membro.
// Aqui a gente le a ficha e, quando precisa, manda a ponte atualizar.
//
// Regra de decisao, nesta ordem:
//   1. admin (fundador ou moderador) entra sempre
//   2. ficha diz que esta em dia  -> entra, e a ponte roda por tras
//   3. ficha diz que nao esta     -> a ponte roda ANTES, porque a ficha pode
//                                    estar velha (a pessoa acabou de pagar)
//   4. a ponte confirmou que nao  -> tela de renovacao
//
// Por que nao existe mais perfil provisorio: a versao anterior montava um
// perfil falso com assinatura_ativa: true quando a leitura falhava. Isso
// transformava qualquer erro de rede em acesso liberado. Agora falha e falha,
// com tela propria e botao de tentar de novo.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Auth, Chaves, Perfil, comoErro } from "@/lib/nito-motor";
import { AssinaturaVencida } from "@/components/nito/AssinaturaVencida";

interface AuthGuardProps {
  children: (perfil: Perfil) => React.ReactNode;
}

// Cada consulta a ponte custa um login de administrador no painel de licencas.
// Repetir isso a cada troca de aba seria lento e caro.
const INTERVALO_SINCRONIA_MS = 10 * 60 * 1000;
const MARCA_SINCRONIA = "nito_assinatura_sincronizada_em";

function sincronizouRecentemente(): boolean {
  try {
    const bruto = window.sessionStorage.getItem(MARCA_SINCRONIA);
    if (!bruto) return false;
    return Date.now() - Number(bruto) < INTERVALO_SINCRONIA_MS;
  } catch {
    return false;
  }
}

function marcarSincronia() {
  try {
    window.sessionStorage.setItem(MARCA_SINCRONIA, String(Date.now()));
  } catch {
    /* navegador sem sessionStorage: sincroniza mais vezes, e so */
  }
}

function ehAdministracao(p: Perfil): boolean {
  return p.papel === "fundador" || p.papel === "moderador";
}

interface RespostaAssinatura {
  assinatura_ativa?: boolean;
  assinatura_expira_em?: string | null;
  plano?: string | null;
}

/**
 * Pergunta ao painel de licencas e devolve o perfil atualizado mais o plano.
 * O plano nao fica guardado na ficha - ele so serve para a tela de renovacao
 * mandar a pessoa para o checkout certo.
 */
async function sincronizarAssinatura(atual: Perfil): Promise<{ perfil: Perfil; plano: string | null }> {
  const r = (await Chaves.chamar("listar")) as unknown as RespostaAssinatura;
  marcarSincronia();
  return {
    perfil: {
      ...atual,
      assinatura_ativa: r.assinatura_ativa ?? false,
      assinatura_expira_em: r.assinatura_expira_em ?? undefined,
    },
    plano: r.plano ?? null,
  };
}

type Fase = "carregando" | "liberado" | "bloqueado" | "falhou";

export function AuthGuard({ children }: AuthGuardProps) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [plano, setPlano] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const vivo = useRef(true);

  const carregar = useCallback(async () => {
    setFase("carregando");
    setErro(null);

    let base: Perfil | null = null;
    try {
      base = await Auth.meuPerfil();
    } catch (bruto) {
      if (!vivo.current) return;
      setErro(comoErro(bruto, "Não consegui carregar seu perfil.").message);
      setFase("falhou");
      return;
    }

    if (!vivo.current) return;

    if (!base) {
      setErro("Sua conta existe, mas o perfil ainda não foi criado. Tente de novo em instantes.");
      setFase("falhou");
      return;
    }

    // 1. administracao entra sempre.
    if (ehAdministracao(base)) {
      setPerfil(base);
      setFase("liberado");
      return;
    }

    // 2. ficha em dia: libera agora e atualiza por tras, sem segurar a tela.
    if (base.assinatura_ativa) {
      setPerfil(base);
      setFase("liberado");
      if (!sincronizouRecentemente()) {
        sincronizarAssinatura(base)
          .then((r) => {
            if (!vivo.current) return;
            setPerfil(r.perfil);
            setPlano(r.plano);
            if (!r.perfil.assinatura_ativa) setFase("bloqueado");
          })
          .catch(() => {
            /* sem conversa com o painel, vale o que a ficha ja dizia */
          });
      }
      return;
    }

    // 3. ficha diz que nao esta em dia: pode estar velha. Pergunta antes de barrar.
    try {
      const r = await sincronizarAssinatura(base);
      if (!vivo.current) return;
      setPerfil(r.perfil);
      setPlano(r.plano);
      setFase(r.perfil.assinatura_ativa ? "liberado" : "bloqueado");
    } catch {
      if (!vivo.current) return;
      // Nao deu para confirmar. A ficha veio de uma consulta que deu certo antes,
      // entao ela vale - e a tela de renovacao tem o botao de tentar de novo.
      setPerfil(base);
      setFase("bloqueado");
    }
  }, []);

  useEffect(() => {
    vivo.current = true;
    carregar();
    return () => {
      vivo.current = false;
    };
  }, [carregar]);

  const verificarDeNovo = useCallback(async () => {
    if (!perfil || verificando) return;
    setVerificando(true);
    setErro(null);
    try {
      const r = await sincronizarAssinatura(perfil);
      if (!vivo.current) return;
      setPerfil(r.perfil);
      setPlano(r.plano);
      if (r.perfil.assinatura_ativa) setFase("liberado");
      else setErro("Ainda não consta renovação para a sua conta.");
    } catch (bruto) {
      if (!vivo.current) return;
      setErro(comoErro(bruto, "Não consegui falar com o servidor agora.").message);
    } finally {
      if (vivo.current) setVerificando(false);
    }
  }, [perfil, verificando]);

  const aviso = (titulo: string, texto: string, comBotao: boolean) => (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#94a3b8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        padding: "24px",
        textAlign: "center",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.95rem",
      }}
    >
      <strong style={{ color: "#e2e8f0", fontSize: "1.05rem" }}>{titulo}</strong>
      <span style={{ maxWidth: 420, lineHeight: 1.5 }}>{texto}</span>
      {comBotao && (
        <button
          type="button"
          onClick={carregar}
          style={{
            marginTop: 6,
            padding: "9px 18px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "#111827",
            color: "#e2e8f0",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Tentar de novo
        </button>
      )}
    </div>
  );

  if (fase === "carregando") return aviso("Carregando painel...", "Conferindo sua assinatura.", false);

  if (fase === "falhou") {
    return aviso("Não consegui carregar seu painel", erro ?? "Tente novamente em instantes.", true);
  }

  if (fase === "bloqueado" && perfil) {
    return (
      <AssinaturaVencida
        perfil={perfil}
        plano={plano}
        verificando={verificando}
        onVerificarDeNovo={verificarDeNovo}
        erro={erro}
      />
    );
  }

  if (!perfil) return aviso("Carregando painel...", "Conferindo sua assinatura.", false);

  return <>{children(perfil)}</>;
}
