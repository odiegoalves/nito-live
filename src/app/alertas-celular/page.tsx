"use client";

// =============================================================================
// NITO LIVE - Alertas no Celular.
//
// Pagina de instrucao, nao de funcionalidade: o aplicativo em si mora em
// /alertas. Aqui o membro descobre que ele existe e aprende a instalar no
// iPhone e no Android.
//
// Regra de escrita desta tela: nada de "e so instalar". Cada passo diz onde
// tocar, com o nome exato do botao que aparece no aparelho. O que o aparelho
// NAO faz tambem esta escrito - cliente que descobre limite sozinho abre
// chamado; cliente que leu antes, nao.
// =============================================================================

import React from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/nito/AppShell";
import { Perfil } from "@/lib/nito-motor";

const ENDERECO = "app.nitolive.com.br/alertas";

function Nota({
  cor,
  icone,
  titulo,
  children,
}: {
  cor: string;
  icone: string;
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 11,
        marginTop: 14,
        padding: "13px 15px",
        borderRadius: 12,
        border: `1px solid ${cor}`,
        background: "rgba(255,255,255,.03)",
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: cor, fontWeight: 900, lineHeight: 1.3 }}>{icone}</span>
      <div>
        <b style={{ display: "block", fontSize: 13.5, color: cor, marginBottom: 3 }}>{titulo}</b>
        <span className="muted tiny">{children}</span>
      </div>
    </div>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="passo">
      <div className="n">{n}</div>
      <div className="c">
        <b>{titulo}</b>
        <p className="muted tiny">{children}</p>
      </div>
    </div>
  );
}

function Conteudo({ perfil }: { perfil: Perfil }) {
  return (
    <AppShell perfil={perfil} ativa="alertas" recado="Ouça cada venda da sua live.">
      <div className="view on">
        <div>
          <h1 className="title-xl">
            Alertas no <em>celular</em>.
          </h1>
          <p className="sub">
            Um aplicativo que fica ao lado durante a live e toca o som de caixa registradora a
            cada venda que a extensão registra. Instala uma vez, funciona para sempre.
          </p>
        </div>

        <div className="panel pad" style={{ marginTop: 16 }}>
          <div className="spread" style={{ gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 240, flex: 1 }}>
              <h2 className="h-sec" style={{ marginBottom: 6 }}>O que você ganha com ele</h2>
              <p className="muted tiny" style={{ margin: 0 }}>
                Som de caixa registradora a cada venda · total do dia e número de vendas na tela ·
                aviso mesmo com o celular bloqueado e o aplicativo fechado · toca até com o iPhone
                no silencioso.
              </p>
            </div>
            <a
              className="btn gold"
              href="/alertas"
              style={{ textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Abrir o app de alertas
            </a>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          {/* ---------------------------------------------------------------- */}
          <div className="panel pad">
            <h2 className="h-sec" style={{ marginBottom: 14 }}> iPhone</h2>

            <Passo n={1} titulo="Abra pelo Safari">
              Precisa ser o <b>Safari</b>. O iPhone não instala aplicativo pelo Chrome nem por
              dentro do Instagram. Digite{" "}
              <span className="num" style={{ color: "var(--cyan)" }}>{ENDERECO}</span> na barra de
              endereço.
            </Passo>

            <Passo n={2} titulo="Entre com o seu e-mail">
              O mesmo e-mail que você usa aqui na comunidade. Chega um código no e-mail, você
              digita e pronto.
            </Passo>

            <Passo n={3} titulo="Toque em Compartilhar">
              É o quadradinho com uma seta para cima, na barra de baixo do Safari.
            </Passo>

            <Passo n={4} titulo='Escolha "Adicionar à Tela de Início"'>
              Role a lista até achar. Depois toque em <b>Adicionar</b>, no canto superior direito.
              Um ícone <b>NITO Alertas</b> aparece na sua tela.
            </Passo>

            <Passo n={5} titulo="Feche o Safari e abra pelo ícone">
              Este passo não é opcional. Dentro do Safari a Apple não deixa o aviso chegar — só
              pelo ícone.
            </Passo>

            <Passo n={6} titulo='Toque em "Ativar alertas" e permita as notificações'>
              Aparece um pedido de permissão do iPhone. Toque em <b>Permitir</b>. Só isso, uma vez
              na vida.
            </Passo>

            <Nota cor="var(--red)" icone="!" titulo="Duas coisas que o iPhone não faz">
              Não vibra, e não toca som próprio na notificação com o aplicativo fechado — é regra
              da Apple, não tem como mudar. O som de caixa registradora toca com o aplicativo
              aberto. Também é preciso iOS 16.4 ou mais novo.
            </Nota>
          </div>

          {/* ---------------------------------------------------------------- */}
          <div className="panel pad">
            <h2 className="h-sec" style={{ marginBottom: 14 }}> Android</h2>

            <Passo n={1} titulo="Abra pelo Chrome">
              Digite{" "}
              <span className="num" style={{ color: "var(--cyan)" }}>{ENDERECO}</span> na barra de
              endereço.
            </Passo>

            <Passo n={2} titulo="Entre com o seu e-mail">
              O mesmo e-mail que você usa aqui na comunidade. Chega um código no e-mail, você
              digita e pronto.
            </Passo>

            <Passo n={3} titulo="Toque em Instalar">
              O Chrome oferece sozinho, num botão embaixo. Se não aparecer, abra o menu de três
              pontinhos no canto superior direito e escolha{" "}
              <b>Instalar aplicativo</b> (em alguns aparelhos:{" "}
              <b>Adicionar à tela inicial</b>).
            </Passo>

            <Passo n={4} titulo="Abra pelo ícone novo">
              O <b>NITO Alertas</b> passa a ficar junto com os seus outros aplicativos.
            </Passo>

            <Passo n={5} titulo='Toque em "Ativar alertas" e permita as notificações'>
              O Android pergunta uma vez. Toque em <b>Permitir</b>.
            </Passo>

            <Nota cor="var(--green)" icone="✓" titulo="No Android vai tudo">
              Som, vibração e aviso na tela bloqueada, com o aplicativo aberto ou fechado.
            </Nota>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        <div className="panel pad" style={{ marginTop: 16 }}>
          <h2 className="h-sec" style={{ marginBottom: 14 }}>Na hora da live</h2>

          <Passo n={1} titulo="Deixe o celular ao lado, com o app aberto">
            Ele segura a tela acesa sozinho enquanto estiver na frente.
          </Passo>

          <Passo n={2} titulo="Toque uma vez em qualquer lugar da tela">
            Todo navegador exige um toque por abertura antes de liberar som — não é coisa do NITO,
            é regra do celular. Enquanto o som estiver travado, uma <b>faixa vermelha</b> avisa na
            tela. Ela some no primeiro toque.
          </Passo>

          <Passo n={3} titulo="Pode bloquear a tela e usar outro aplicativo">
            A venda continua chegando como notificação. Ao voltar para o NITO Alertas, o som volta
            sozinho.
          </Passo>
        </div>

        {/* ------------------------------------------------------------------ */}
        <div className="panel pad" style={{ marginTop: 16 }}>
          <h2 className="h-sec" style={{ marginBottom: 14 }}>Se alguma coisa não funcionar</h2>

          <div className="stack" style={{ gap: 12 }}>
            <div>
              <b style={{ fontSize: 13.5 }}>Não chega notificação nenhuma</b>
              <p className="muted tiny" style={{ marginTop: 4 }}>
                No iPhone, quase sempre é porque o aplicativo está sendo aberto pelo Safari e não
                pelo ícone da tela de início. Refaça os passos 3 a 5.
              </p>
            </div>
            <div>
              <b style={{ fontSize: 13.5 }}>Chega o aviso, mas sem o som de caixa registradora</b>
              <p className="muted tiny" style={{ marginTop: 4 }}>
                Toque uma vez na tela do aplicativo. O som fica liberado até você fechar o
                aplicativo.
              </p>
            </div>
            <div>
              <b style={{ fontSize: 13.5 }}>A tela abre pedindo para entrar toda hora</b>
              <p className="muted tiny" style={{ marginTop: 4 }}>
                Use o mesmo e-mail da comunidade. E-mail diferente cria conta diferente, e a conta
                nova não tem as suas vendas.
              </p>
            </div>
            <div>
              <b style={{ fontSize: 13.5 }}>Não aparece venda nenhuma</b>
              <p className="muted tiny" style={{ marginTop: 4 }}>
                O aplicativo mostra as vendas que a <b>extensão</b> registra durante a live. Com a
                extensão desligada, não há o que mostrar. Confira na aba Extensão se a sua chave
                está ativa.
              </p>
            </div>
            <div>
              <b style={{ fontSize: 13.5 }}>Continua sem resolver</b>
              <p className="muted tiny" style={{ marginTop: 4 }}>
                Fale com o suporte pela aba <b>Suporte</b>, contando qual aparelho você usa e em
                qual passo travou.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PaginaAlertasCelular() {
  return <AuthGuard>{(perfil) => <Conteudo perfil={perfil} />}</AuthGuard>;
}
