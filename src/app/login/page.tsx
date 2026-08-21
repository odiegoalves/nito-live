"use client";

/* =============================================================================
   NITO LIVE - tela unica de acesso.
   Cinco etapas no mesmo lugar:
     login      -> entrar
     cadastro   -> criar conta (dispara o codigo de 6 digitos por e-mail)
     confirmar  -> digitar o codigo e validar a conta
     recuperar  -> pedir o codigo de recuperacao
     redefinir  -> digitar o codigo e escolher a senha nova
   A logica de autenticacao continua toda no nito-motor. Aqui so tem tela.
   ============================================================================= */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Auth } from "@/lib/nito-motor";
import estilo from "./auth-nito.module.css";

type Etapa = "login" | "cadastro" | "confirmar" | "recuperar" | "redefinir";
type Recado = { tipo: "erro" | "sucesso"; texto: string } | null;

const ABA: Record<Etapa, "login" | "cadastro" | "recuperar"> = {
  login: "login",
  cadastro: "cadastro",
  confirmar: "cadastro",
  recuperar: "recuperar",
  redefinir: "recuperar",
};

const NOTIFICACOES = [
  { classe: "n1", cor: "", icone: "$", titulo: "Nova venda", detalhe: "R$ 149,90 · agora" },
  { classe: "n2", cor: "cyan", icone: "◆", titulo: "Produto fixado", detalhe: "rotação automática" },
  { classe: "n3", cor: "", icone: "$", titulo: "Venda confirmada", detalhe: "R$ 89,90 · 1 min" },
  { classe: "n4", cor: "cyan", icone: "◆", titulo: "Chat respondido", detalhe: "3 clientes · 2s" },
  { classe: "n5", cor: "", icone: "$", titulo: "Nova venda", detalhe: "R$ 227,00 · 2 min" },
  { classe: "n6", cor: "gold", icone: "★", titulo: "Meta do dia batida", detalhe: "R$ 3.480 em vendas" },
];

function traduzirErro(bruto: unknown): string {
  const m = (bruto instanceof Error ? bruto.message : String(bruto ?? "")).toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Sua conta ainda não foi confirmada. Use o código que enviamos por e-mail.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Esse e-mail já tem conta. Tente entrar ou recuperar a senha.";
  // O Supabase responde "Token has expired or is invalid" nos dois casos:
  // codigo errado E codigo vencido. Nao da para separar, entao a mensagem cobre os dois.
  if (m.includes("expired") && m.includes("invalid"))
    return "Código incorreto ou já vencido. Confira os dígitos ou peça um novo.";
  if (m.includes("expired")) return "Esse código expirou. Peça um novo.";
  if (m.includes("invalid") && m.includes("token"))
    return "Código incorreto. Confira os dígitos do e-mail.";
  if (m.includes("otp") && m.includes("invalid"))
    return "Código incorreto. Confira os dígitos do e-mail.";
  if (m.includes("should be at least") || m.includes("password"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Sem conexão com o servidor. Verifique sua internet.";
  return "Não foi possível concluir. Tente de novo em instantes.";
}

export default function AcessoPage() {
  const [etapa, setEtapa] = useState<Etapa>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [codigo, setCodigo] = useState<string[]>(["", "", "", "", "", ""]);
  const [carregando, setCarregando] = useState(false);
  const [recado, setRecado] = useState<Recado>(null);

  const caixas = useRef<Array<HTMLInputElement | null>>([]);

  // /login?modo=cadastro  ou  ?modo=recuperar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const modo = new URLSearchParams(window.location.search).get("modo");
    if (modo === "cadastro" || modo === "criar-conta") setEtapa("cadastro");
    if (modo === "recuperar" || modo === "esqueci") setEtapa("recuperar");
  }, []);

  const irPara = useCallback((destino: Etapa) => {
    setEtapa(destino);
    setRecado(null);
    setCodigo(["", "", "", "", "", ""]);
  }, []);

  function digitarCodigo(indice: number, valor: string) {
    const limpo = valor.replace(/\D/g, "");
    if (limpo.length > 1) {
      // colou o codigo inteiro
      const novo = [...codigo];
      limpo.split("").slice(0, 6).forEach((d, i) => { novo[i] = d; });
      setCodigo(novo);
      caixas.current[Math.min(limpo.length, 5)]?.focus();
      return;
    }
    const novo = [...codigo];
    novo[indice] = limpo;
    setCodigo(novo);
    if (limpo && indice < 5) caixas.current[indice + 1]?.focus();
  }

  function teclaCodigo(indice: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !codigo[indice] && indice > 0) caixas.current[indice - 1]?.focus();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setCarregando(true);
    setRecado(null);

    const token = codigo.join("");

    try {
      if (etapa === "login") {
        await Auth.entrar(email.trim(), senha);
        window.location.href = "/comunidade";
        return;
      }

      if (etapa === "cadastro") {
        await Auth.cadastrar(email.trim(), senha, nome.trim());
        setRecado({ tipo: "sucesso", texto: "Código enviado. Confira seu e-mail." });
        setEtapa("confirmar");
        return;
      }

      if (etapa === "confirmar") {
        if (token.length !== 6) throw new Error("invalid token");
        await Auth.confirmarCadastro(email.trim(), token);
        window.location.href = "/comunidade";
        return;
      }

      if (etapa === "recuperar") {
        await Auth.esqueciSenha(email.trim());
        setRecado({ tipo: "sucesso", texto: "Código enviado. Confira seu e-mail." });
        setEtapa("redefinir");
        return;
      }

      if (etapa === "redefinir") {
        if (token.length !== 6) throw new Error("invalid token");
        if (senha.length < 6) throw new Error("should be at least");
        if (senha !== senha2) {
          setRecado({ tipo: "erro", texto: "As duas senhas não são iguais." });
          setCarregando(false);
          return;
        }
        await Auth.confirmarRecuperacao(email.trim(), token, senha);
        window.location.href = "/comunidade";
        return;
      }
    } catch (erro) {
      setRecado({ tipo: "erro", texto: traduzirErro(erro) });
    } finally {
      setCarregando(false);
    }
  }

  async function reenviar() {
    if (carregando) return;
    setCarregando(true);
    setRecado(null);
    try {
      if (etapa === "confirmar") await Auth.reenviarCodigo(email.trim());
      else await Auth.esqueciSenha(email.trim());
      setRecado({ tipo: "sucesso", texto: "Enviamos um código novo." });
    } catch (erro) {
      setRecado({ tipo: "erro", texto: traduzirErro(erro) });
    } finally {
      setCarregando(false);
    }
  }

  const textos: Record<Etapa, { chapeu: string; titulo: React.ReactNode; sub: string; botao: string }> = {
    login: {
      chapeu: "Área do cliente",
      titulo: <>Entre e <span className={estilo.destaque}>assuma o controle</span> da sua live.</>,
      sub: "Acesse a comunidade, suas aulas e a chave da extensão.",
      botao: "Entrar no painel →",
    },
    cadastro: {
      chapeu: "Criar conta",
      titulo: <>Crie sua conta e <span className={estilo.destaque}>ative sua chave</span>.</>,
      sub: "Use o mesmo e-mail da compra na Cakto — é ele que libera seu acesso.",
      botao: "Enviar código →",
    },
    confirmar: {
      chapeu: "Confirmar e-mail",
      titulo: <>Digite o <span className={estilo.destaque}>código</span> que enviamos.</>,
      sub: "Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 1 hora.",
      botao: "Confirmar minha conta →",
    },
    recuperar: {
      chapeu: "Recuperar senha",
      titulo: <>Esqueceu? <span className={estilo.destaque}>A gente resolve.</span></>,
      sub: "Digite o e-mail da sua compra na Cakto e enviamos um código para criar uma senha nova.",
      botao: "Enviar recuperação →",
    },
    redefinir: {
      chapeu: "Nova senha",
      titulo: <>Digite o código e <span className={estilo.destaque}>crie sua senha</span>.</>,
      sub: "O código chegou no seu e-mail. Escolha uma senha de pelo menos 6 caracteres.",
      botao: "Salvar nova senha →",
    },
  };

  const t = textos[etapa];
  const mostraNome = etapa === "cadastro";
  const mostraEmail = etapa === "login" || etapa === "cadastro" || etapa === "recuperar";
  const mostraSenha = etapa === "login" || etapa === "cadastro" || etapa === "redefinir";
  const mostraCodigo = etapa === "confirmar" || etapa === "redefinir";
  const mostraSenha2 = etapa === "redefinir";

  return (
    <div className={estilo.page}>
      <div className={estilo.wrap}>
        <header className={estilo.topbar}>
          <div className={estilo.brand}>
            <span className={estilo.dot} />
            NITO&nbsp;<span className={estilo.live}>LIVE</span>
          </div>
          <div className={estilo.slogan}>automação de lives · tiktok shop</div>
        </header>

        <div className={estilo.grid}>
          <section className={estilo.card}>
            <div className={estilo.eyebrow}>
              <span className={estilo.eyebrowDot} />
              {t.chapeu}
            </div>
            <h1 className={estilo.titulo}>{t.titulo}</h1>
            <p className={estilo.lead}>{t.sub}</p>

            <div className={estilo.tabs}>
              <button type="button" className={ABA[etapa] === "login" ? estilo.tabAtiva : ""} onClick={() => irPara("login")}>Entrar</button>
              <button type="button" className={ABA[etapa] === "cadastro" ? estilo.tabAtiva : ""} onClick={() => irPara("cadastro")}>Criar conta</button>
              <button type="button" className={ABA[etapa] === "recuperar" ? estilo.tabAtiva : ""} onClick={() => irPara("recuperar")}>Recuperar</button>
            </div>

            {recado && (
              <div className={`${estilo.aviso} ${recado.tipo === "sucesso" ? estilo.sucesso : estilo.erro}`}>
                <span className={estilo.avisoIcone}>{recado.tipo === "sucesso" ? "✓" : "!"}</span>
                <div>{recado.texto}</div>
              </div>
            )}

            {etapa === "cadastro" && !recado && (
              <div className={estilo.aviso}>
                <span className={estilo.avisoIcone}>✦</span>
                <div>
                  <strong>Use o e-mail da compra na Cakto</strong>
                  Com outro e-mail o sistema não encontra sua compra e o acesso não é liberado.
                </div>
              </div>
            )}

            {mostraCodigo && !recado && (
              <div className={estilo.aviso}>
                <span className={estilo.avisoIcone}>✦</span>
                <div>
                  <strong>Não chegou?</strong>
                  Confira a caixa de spam e a lixeira. O remetente é o e-mail oficial do NITO LIVE.
                </div>
              </div>
            )}

            <form onSubmit={enviar}>
              {mostraNome && (
                <div className={estilo.field}>
                  <label htmlFor="nome">◆ Nome completo</label>
                  <input id="nome" autoComplete="name" required value={nome}
                    onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                </div>
              )}

              {mostraEmail && (
                <div className={estilo.field}>
                  <label htmlFor="email">◆ E-mail</label>
                  <input id="email" type="email" autoComplete="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
              )}

              {mostraCodigo && (
                <div className={estilo.field}>
                  <label>◆ Código recebido no e-mail</label>
                  <div className={estilo.codebox}>
                    {codigo.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { caixas.current[i] = el; }}
                        value={d}
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={6}
                        placeholder="0"
                        onChange={(e) => digitarCodigo(i, e.target.value)}
                        onKeyDown={(e) => teclaCodigo(i, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {mostraSenha && (
                <div className={estilo.field}>
                  <label htmlFor="senha">◆ {etapa === "redefinir" ? "Nova senha" : "Senha"}</label>
                  <input id="senha" type="password" required value={senha}
                    autoComplete={etapa === "login" ? "current-password" : "new-password"}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder={etapa === "login" ? "Sua senha secreta" : "Mínimo 6 caracteres"} />
                </div>
              )}

              {mostraSenha2 && (
                <div className={estilo.field}>
                  <label htmlFor="senha2">◆ Repita a nova senha</label>
                  <input id="senha2" type="password" required value={senha2} autoComplete="new-password"
                    onChange={(e) => setSenha2(e.target.value)} placeholder="Confirme a senha" />
                </div>
              )}

              {etapa === "login" && (
                <button type="button" className={estilo.forgot} onClick={() => irPara("recuperar")}>
                  Esqueci minha senha
                </button>
              )}

              <button type="submit" className={estilo.submit} disabled={carregando}>
                {carregando ? "Processando..." : t.botao}
              </button>
            </form>

            <p className={estilo.foot}>
              {etapa === "login" && (
                <>
                  Ainda não tem acesso?{" "}
                  <a href="https://nitolive.com.br/" target="_blank" rel="noopener noreferrer">Compre o NITO LIVE</a>{" "}
                  e sua conta é liberada na hora.
                </>
              )}
              {etapa === "cadastro" && (
                <>Já tem conta? <button type="button" onClick={() => irPara("login")}>Entrar</button></>
              )}
              {etapa === "recuperar" && (
                <>Lembrou da senha? <button type="button" onClick={() => irPara("login")}>Voltar ao login</button></>
              )}
              {mostraCodigo && (
                <>Não recebeu? <button type="button" onClick={reenviar}>Enviar de novo</button></>
              )}
            </p>

            <div className={estilo.trust}>
              <span>Acesso imediato</span>
              <span>Chave para a extensão</span>
              <span>Suporte no WhatsApp</span>
            </div>
          </section>

          <aside className={estilo.stage} aria-hidden="true">
            <div className={estilo.rings} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={estilo.robo} src="/nito-robo.webp" alt="" />
            {NOTIFICACOES.map((n) => (
              <div key={n.classe} className={`${estilo.note} ${estilo[n.classe]} ${n.cor ? estilo[n.cor] : ""}`}>
                <div className={estilo.av}>{n.icone}</div>
                <div>
                  <strong>{n.titulo}</strong>
                  <br />
                  <em>{n.detalhe}</em>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
