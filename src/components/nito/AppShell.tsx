"use client";

// =============================================================================
// NITO LIVE - casca do ecossistema.
// Menu lateral, topo e o cartao de patente. Toda aba de membro passa por aqui,
// entao qualquer mudanca de navegacao acontece num lugar so.
// =============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Auth, Chamados, Perfil } from "@/lib/nito-motor";
import { SpriteIcones, Icone } from "./NitoIcones";
import { SinoNotificacoes } from "./SinoNotificacoes";
import { AvisosOnline } from "./AvisosOnline";
import {
  patenteDoNivel,
  progressoNoNivel,
  proximaPatente,
  diasRestantes,
  saudacao,
} from "@/lib/nito-gamificacao";

export type AbaAtiva =
  | "inicio"
  | "comunidade"
  | "aulas"
  | "vendas"
  | "ranking"
  | "separar"
  | "extensao"
  | "alertas"
  | "suporte"
  | "perfil";

const ABAS: { chave: AbaAtiva; rotulo: string; icone: string; href: string }[] = [
  { chave: "inicio", rotulo: "Início", icone: "home", href: "/inicio" },
  { chave: "comunidade", rotulo: "Comunidade", icone: "users", href: "/comunidade" },
  { chave: "aulas", rotulo: "Aulas", icone: "book", href: "/aulas" },
  { chave: "vendas", rotulo: "Minhas Vendas", icone: "chart", href: "/vendas" },
  { chave: "ranking", rotulo: "Ranking", icone: "trofeu", href: "/ranking" },
  { chave: "separar", rotulo: "Separar Áudio", icone: "onda", href: "/separar-audio" },
  { chave: "extensao", rotulo: "Extensão", icone: "plug", href: "/extensao" },
  { chave: "alertas", rotulo: "Alertas no Celular", icone: "bell", href: "/alertas-celular" },
  { chave: "suporte", rotulo: "Suporte", icone: "help", href: "/suporte" },
  { chave: "perfil", rotulo: "Meu Perfil", icone: "user", href: "/perfil" },
];

export function ehAdmin(perfil: Perfil): boolean {
  return perfil.papel === "fundador" || perfil.papel === "moderador";
}

interface Props {
  perfil: Perfil;
  ativa: AbaAtiva;
  children: React.ReactNode;
  /** aviso opcional ao lado do titulo no topo */
  recado?: string;
}

export function AppShell({ perfil, ativa, children, recado }: Props) {
  const patente = patenteDoNivel(perfil.nivel ?? 1);
  const prox = proximaPatente(perfil.nivel ?? 1);
  const prog = progressoNoNivel(perfil.nivel ?? 1, perfil.xp ?? 0);
  const dias = diasRestantes(perfil.assinatura_expira_em);
  const admin = ehAdmin(perfil);
  const [menuAberto, setMenuAberto] = useState(false);
  const [recolhida, setRecolhida] = useState(false);
  const [chamadosPendentes, setChamadosPendentes] = useState(0);

  useEffect(() => {
    const salva = window.localStorage.getItem("nito_rail_recolhida");
    if (salva === "1") setRecolhida(true);
  }, []);

  // So o admin ve o numerinho de chamados aguardando no menu, e atualiza
  // sozinho quando alguem abre um chamado novo, sem precisar recarregar.
  useEffect(() => {
    if (!admin) return;
    let vivo = true;
    const atualizar = () => {
      Chamados.contarAguardando()
        .then((n) => { if (vivo) setChamadosPendentes(n); })
        .catch(() => {});
    };
    atualizar();
    const parar = Chamados.assinarContagem(atualizar);
    return () => { vivo = false; parar(); };
  }, [admin]);

  function alternarRecolhida() {
    setRecolhida((v) => {
      const novo = !v;
      window.localStorage.setItem("nito_rail_recolhida", novo ? "1" : "0");
      return novo;
    });
  }

  return (
    <div className="nito">
      <SpriteIcones />
      <div className={`app ${menuAberto ? "menu-aberto" : ""} ${recolhida ? "rail-mini" : ""}`}>
        {menuAberto && (
          <div className="rail-fundo" onClick={() => setMenuAberto(false)} />
        )}
        <aside className={`rail ${menuAberto ? "aberto" : ""} ${recolhida ? "mini" : ""}`}>
          <div className="logo">
            <b>
              NITO <i>LIVE</i>
            </b>
            {admin && <span className="tagchip">ADMIN</span>}
            <button
              type="button"
              className="rail-fechar"
              aria-label="Fechar menu"
              onClick={() => setMenuAberto(false)}
            >
              <Icone nome="x" tam={16} />
            </button>
          </div>

          <button
            type="button"
            className="rail-colapsar"
            aria-label={recolhida ? "Expandir menu" : "Encolher menu"}
            title={recolhida ? "Expandir menu" : "Encolher menu"}
            onClick={alternarRecolhida}
          >
            <Icone nome="seta-dupla" tam={14} />
          </button>

          <nav className="nav">
            {ABAS.map((a) => (
              <Link
                key={a.chave}
                href={a.href}
                className={ativa === a.chave ? "on" : ""}
                aria-current={ativa === a.chave ? "page" : undefined}
                onClick={() => setMenuAberto(false)}
                title={recolhida ? a.rotulo : undefined}
              >
                <Icone nome={a.icone} />
                <span className="lbl">{a.rotulo}</span>
                {a.chave === "suporte" && admin && chamadosPendentes > 0 && (
                  <span className="badge">{chamadosPendentes}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="player">
            <div className="pat">
              <div className="medal">{patente.romano}</div>
              <div className="lbl">
                <div className="pnome">{patente.nome}</div>
                <div className="pnv">NÍVEL {perfil.nivel ?? 1}</div>
              </div>
            </div>
            <div className="bar lbl">
              <i style={{ width: `${prog.percentual}%` }} />
            </div>
            <div className="xp lbl">
              <span>{prox ? "PRÓX. PATENTE" : "PATENTE MÁXIMA"}</span>
              <span>
                <b>{prog.atual.toLocaleString("pt-BR")}</b> / {prog.meta.toLocaleString("pt-BR")} XP
              </span>
            </div>
          </div>

          <button className="sair" type="button" onClick={() => Auth.sair()} title={recolhida ? "Sair" : undefined}>
            <Icone nome="out" tam={15} />
            <span className="lbl">Sair</span>
          </button>
        </aside>

        <div className="main">
          <header className="topbar">
            <button
              type="button"
              className="rail-abrir"
              aria-label="Abrir menu"
              onClick={() => setMenuAberto(true)}
            >
              <Icone nome="menu" tam={19} />
            </button>
            <div className="hello">
              {saudacao()}, {(perfil.nome ?? "membro").split(" ")[0]}
              <span>{recado ?? "Seu NITO está pronto para a próxima live."}</span>
            </div>
            <div className="push" />
            {dias !== null && (
              <div className={dias <= 5 ? "stat-min fire" : "stat-min cyan-chip"}>
                ASSINATURA · {dias} {dias === 1 ? "DIA" : "DIAS"}
              </div>
            )}
            <SinoNotificacoes />
          </header>

          {children}
        </div>
      </div>
      <AvisosOnline perfil={perfil} />
    </div>
  );
}
