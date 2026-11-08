"use client";

// =============================================================================
// NITO LIVE - casca do ecossistema.
// Menu lateral, topo e o cartao de patente. Toda aba de membro passa por aqui,
// entao qualquer mudanca de navegacao acontece num lugar so.
// =============================================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Auth,
  Chamados,
  Perfil,
  ProdutoChave,
  produtosLiberadosSalvos,
  EVENTO_PRODUTOS_LIBERADOS,
} from "@/lib/nito-motor";
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
  | "vendas-nito-live"
  | "ranking"
  | "separar"
  | "extensao"
  | "shopee"
  | "alertas"
  | "suporte"
  | "perfil";

type Aba = { chave: AbaAtiva; rotulo: string; icone: string; href: string };

// Menu agrupado por assunto: 12 itens em fila unica cansavam a leitura.
const SECOES: { titulo: string; abas: Aba[] }[] = [
  {
    titulo: "Operação",
    abas: [
      { chave: "inicio", rotulo: "Início", icone: "home", href: "/inicio" },
      { chave: "vendas", rotulo: "Vendas TikTok", icone: "chart", href: "/vendas" },
      { chave: "vendas-nito-live", rotulo: "Vendas NITO LIVE", icone: "trofeu", href: "/vendas-nito-live" },
      { chave: "ranking", rotulo: "Ranking", icone: "trofeu", href: "/ranking" },
    ],
  },
  {
    titulo: "Ferramentas",
    abas: [
      { chave: "extensao", rotulo: "Extensão / Chave", icone: "plug", href: "/extensao" },
      { chave: "shopee", rotulo: "NITO LIVE Shopee", icone: "plug", href: "/shopee" },
      { chave: "separar", rotulo: "Separar Áudio", icone: "onda", href: "/separar-audio" },
      { chave: "alertas", rotulo: "Alertas no Celular", icone: "bell", href: "/alertas-celular" },
    ],
  },
  {
    titulo: "Aprender",
    abas: [
      { chave: "aulas", rotulo: "Aulas", icone: "book", href: "/aulas" },
      { chave: "comunidade", rotulo: "Comunidade", icone: "users", href: "/comunidade" },
    ],
  },
  {
    titulo: "Conta",
    abas: [
      { chave: "perfil", rotulo: "Meu Perfil", icone: "user", href: "/perfil" },
      { chave: "suporte", rotulo: "Suporte", icone: "help", href: "/suporte" },
    ],
  },
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
  const [liberados, setLiberados] = useState<Record<ProdutoChave, boolean> | null>(null);

  useEffect(() => {
    const salva = window.localStorage.getItem("nito_rail_recolhida");
    if (salva === "1") setRecolhida(true);
  }, []);

  // Cadeado no menu para o produto que a pessoa nao comprou. A informacao vem
  // da ultima resposta da funcao "chaves" (o AuthGuard ja chama ela).
  useEffect(() => {
    const ler = () => setLiberados(produtosLiberadosSalvos());
    ler();
    window.addEventListener(EVENTO_PRODUTOS_LIBERADOS, ler);
    return () => window.removeEventListener(EVENTO_PRODUTOS_LIBERADOS, ler);
  }, []);

  const produtoDaAba: Partial<Record<AbaAtiva, ProdutoChave>> = { extensao: "tiktok", shopee: "shopee" };
  const travada = (aba: AbaAtiva) => {
    const p = produtoDaAba[aba];
    return !admin && !!p && liberados !== null && liberados[p] === false;
  };

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
            {SECOES.map((secao) => (
              <React.Fragment key={secao.titulo}>
                <div className="secao" aria-hidden>{secao.titulo}</div>
                {secao.abas.map((a) => (
              <Link
                key={a.chave}
                href={a.href}
                className={ativa === a.chave ? "on" : ""}
                aria-current={ativa === a.chave ? "page" : undefined}
                onClick={() => setMenuAberto(false)}
                title={travada(a.chave) ? `${a.rotulo} — não incluso no seu plano` : recolhida ? a.rotulo : undefined}
                style={travada(a.chave) ? { opacity: 0.6 } : undefined}
              >
                <Icone nome={a.icone} />
                <span className="lbl">{a.rotulo}</span>
                {travada(a.chave) && (
                  <span aria-label="bloqueado" style={{ marginLeft: "auto", fontSize: ".8rem" }}>
                    🔒
                  </span>
                )}
                {a.chave === "suporte" && admin && chamadosPendentes > 0 && (
                  <span className="badge">{chamadosPendentes}</span>
                )}
              </Link>
                ))}
              </React.Fragment>
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
                <span className="so-largo">ASSINATURA · </span>
                {dias} {dias === 1 ? "DIA" : "DIAS"}
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
