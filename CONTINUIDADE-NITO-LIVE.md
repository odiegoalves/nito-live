# NITO LIVE — documento de continuidade

Cole este documento inteiro na primeira mensagem de uma conversa nova.
Ele descreve onde o projeto está, o que falta e as armadilhas já conhecidas.

Atualizado em 21/08/2026.

---

## 1. O que é o projeto

O **NITO LIVE** é uma extensão do Chrome que automatiza lives no TikTok Shop
(rotação de produtos, respostas no chat, proteção contra violação). É um produto
pago, vendido pela Cakto em três planos:

| Plano | Preço | Chaves |
|---|---|---|
| basic | R$ 67 | 1 |
| pro | R$ 97 | 2 |
| premium | R$ 147 | ilimitadas |

O trabalho atual é a **área de membros** — comunidade, aulas, vendas, licença e
suporte — em `app.nitolive.com.br`.

O dono é o **Diego Alves**, que não é programador. Ele executa comandos que
recebe prontos, e precisa que cada instrução diga **onde** rodar.

---

## 2. Onde cada coisa mora

| Peça | Endereço | Detalhe |
|---|---|---|
| Área de membros | `app.nitolive.com.br` | Next.js 16 na Vercel |
| Página de vendas | `nitolive.com.br` | HTML único, na Netlify |
| Painel administrativo | `admin.nitolive.com.br` | Node + MySQL, na VPS |
| Código | `github.com/odiegoalves/nito-live` | branch `main` |
| Pasta no computador dele | `C:\Users\diegu\OneDrive\Área de Trabalho\NITO-LIVE` | |
| Banco da área de membros | Supabase, projeto `yppzbfjzdpjdxlfljohq` | |
| VPS | `179.197.74.225` | pm2: `nito-admin` (porta 8790) |
| Servidor de licenças | `/var/www/liveinfinity/LIVE-INFINITY-v2-mysql/license-server/server.js` | recebe o webhook da Cakto |
| Painel admin (código) | `/var/www/nitolive/admin/server.js` | |
| Banco MySQL | `live_infinity` | tabelas `licenses`, `cakto_webhook_events` |

**Links diretos do Supabase** (troque nada, o identificador é esse mesmo):

- SQL Editor — `https://supabase.com/dashboard/project/yppzbfjzdpjdxlfljohq/sql/new`
- Edge Functions — `https://supabase.com/dashboard/project/yppzbfjzdpjdxlfljohq/functions`
- Segredos — `https://supabase.com/dashboard/project/yppzbfjzdpjdxlfljohq/settings/functions`
- Storage — `https://supabase.com/dashboard/project/yppzbfjzdpjdxlfljohq/storage/buckets`

---

## 3. Como o acesso do cliente funciona

1. A pessoa compra na Cakto.
2. O webhook da Cakto avisa **dois** destinos: o servidor de licenças na VPS
   (que cria a chave) e uma função no Supabase (que libera o acesso à comunidade
   pela tabela `clientes_liberados`).
3. A pessoa cria conta em `app.nitolive.com.br/login` **com o mesmo e-mail da
   compra**. Se usar outro e-mail, nada é encontrado.
4. O cadastro exige um **código de 6 dígitos** enviado por e-mail.

E-mail sai pelo SMTP da Hostinger, remetente `noreply@nitolive.com.br`,
`smtp.hostinger.com` porta 465. No Supabase, **Confirm email** está ligado e
**Email OTP Length** está em **6**.

Hoje existem cerca de **70 clientes liberados** e só **5 criaram conta** — os
outros ainda não foram avisados de que a comunidade existe.

---

## 4. O que já está pronto e funcionando

**Telas de acesso** (`/login`) — entrar, criar conta, confirmar código, recuperar
senha e definir senha nova, tudo numa tela só. Visual do robô com neon vermelho.
`/cadastro`, `/criar-conta` e `/recuperar-senha` redirecionam pra lá.

**Casca do ecossistema** (`src/components/nito/AppShell.tsx`) — menu lateral com
sete abas, cartão de patente com XP, aviso de vencimento no topo.

**Início** — faturamento, pedidos e assinatura.

**Comunidade** — cinco abas: Importante (só administração publica), Chat ao vivo
(texto, foto, vídeo, menção, presença), Seu resultado (foto obrigatória),
Insights e Melhorias (com enquete Sim/Não). Publicação pode ser fixada no topo.

**Aulas** — módulos gerenciáveis, aulas com vídeo por link (YouTube, Vimeo,
Panda, Bunny, mp4 ou iframe colado), descrição, materiais, curtidas e
comentários. Rascunho e publicado. Só a administração publica.

**Minhas Vendas** — filtro dia/semana/mês/ano, histórico e ranking de produtos.
**Está vazia** porque a ponte com a extensão não existe ainda.

**Extensão** — publicação do arquivo `.zip` pela tela (só administração),
situação da licença e **as chaves reais do cliente**, vindas do servidor de
licenças, com botão de gerar nova respeitando o limite do plano.

**Suporte** — chamados com conversa em tempo real, encerramento e histórico.

**Meu Perfil** — foto, dados e oito conquistas calculadas do XP e do nível.

**Gamificação** — XP e nível são calculados por gatilhos no banco: publicar 50,
resultado com foto 150, comentar 15, aula concluída 100, curtida recebida 5
(para o dono do post). Patentes: Iniciante, Vendedor, Operador, Estrategista,
Mestre da Live, Lenda NITO.

---

## 5. O que falta, em ordem de importância

### 5.1 A assinatura não chega no perfil  ← comece por aqui
Os campos `perfis.assinatura_ativa` e `perfis.assinatura_expira_em` estão vazios
para todo mundo. Consequências: o cartão da aba Início fica em branco, o aviso de
vencimento no topo não aparece, e o bloqueio das aulas por assinatura não
funciona. O conserto é o webhook da Cakto passar a atualizar esses dois campos a
cada compra e renovação.

### 5.2 A ponte das vendas da extensão
A tabela `vendas` no Supabase nunca recebeu nada. A aba Minhas Vendas depende
disso. Envolve mexer na extensão que 70 clientes já têm instalada — é a parte
mais delicada do projeto e merece plano antes de código.

### 5.3 Conteúdo das aulas
A trilha está vazia. Sem aula, quem entra na comunidade não encontra nada.

### 5.4 Hospedagem de vídeo
Hoje as aulas usam YouTube. O player do YouTube **não permite** remover o título,
o nome do canal nem o botão "Assista no YouTube" — o parâmetro que fazia isso foi
descontinuado, e cobrir com CSS viola os termos de uso. Além disso, link do
YouTube vaza: qualquer aluno repassa no WhatsApp. Alternativas conversadas:
Panda Video (brasileiro), Bunny Stream (mais barato), Vimeo pago. Todas dão
player limpo e travam o vídeo no domínio. **Pendente**: descobrir se a Área de
Membros da Cakto, onde os vídeos já estão, fornece código de incorporação.

### 5.5 Convidar os 65 clientes que ainda não se cadastraram

---

## 6. Segurança — pendências reais

**Trocar estas senhas.** Todas apareceram em conversa e devem ser consideradas
comprometidas:

- `client_secret` da API da Cakto
- senha do painel administrativo (usada também na função `chaves` do Supabase —
  se trocar, atualize o segredo `ADMIN_PASS`)
- senha da caixa `noreply@nitolive.com.br` (usada no SMTP do Supabase)
- senha de root da VPS (vazou num repositório público antes)

**Conferir**: se o repositório `canaldiegoalves-debug/liveinvinitysite` está
privado. Avaliar deixar `odiegoalves/nito-live` privado também.

**Já resolvido**: o painel administrativo aceitava qualquer token — qualquer
pessoa da internet controlava tudo. Hoje o login gera token aleatório com
validade de 12 horas e o `requireAdminAuth` confere de verdade.

---

## 7. Como trabalhar com o Diego

Ele é leigo e executa o que recebe pronto. O que funciona:

**Diga sempre onde rodar.** Ele tem quatro lugares e confunde: SQL Editor do
Supabase, PowerShell no computador dele, terminal da VPS, e painéis web. Cole o
link direto junto do comando.

**Um passo de cada vez.** Vários caminhos alternativos travam ele.

**SQL vem antes do código.** Isso deu errado três vezes: entregar código e SQL
juntos faz ele publicar o código e esquecer o SQL, e a tela quebra por tabela
inexistente. Diga **"roda o SQL primeiro, só depois publica"** em destaque, e
cole o SQL na conversa, não em arquivo anexo.

**Não peça senha nem chave.** Ele manda print com a senha visível. Prefira
comandos que comparem ou mostrem só na tela dele.

**Peça texto, não print, quando for texto.** Print custa cerca de cinquenta vezes
mais. E o aplicativo dele **duplica cada print** — vale ele conferir isso.

**Comando longo vai em uma linha só.** Colar bloco grande no `nano` corta no
meio. O que funciona é `echo '<base64>' | base64 -d > arquivo && node arquivo`.

**Publicar o site**, sempre no PowerShell:

```powershell
cd "$env:USERPROFILE\OneDrive\Área de Trabalho\NITO-LIVE"; git add -A; git commit -m "mensagem"; git push
```

**Quando a tela não muda depois de publicar**, o build falhou. Peça: Vercel →
projeto `nito-live` → aba **Deployments** → clicar no primeiro → copiar o erro.
Isso resolve em um passo o que por dedução leva três.

---

## 8. Armadilhas já descobertas (não repita)

**Sessão em cookie, não em localStorage.** `src/lib/nito-motor.ts` usa
`createBrowserClient` do `@supabase/ssr` de propósito: o middleware lê a sessão
do cookie. Trocar por `createClient` do `supabase-js` derruba todo mundo pro
login em laço infinito.

**Variáveis `NEXT_PUBLIC_` não podem ser "Sensitive" na Vercel.** Elas entram no
build; marcadas como sensíveis, chegam vazias e o site sai com erro 500.

**Erro do Supabase não é `Error` do JavaScript.** É objeto simples com `message`,
`details`, `hint`, `code`. Escrever `e instanceof Error ? e.message : "..."`
descarta a mensagem real. Use a função `comoErro()` que já existe no motor.

**Função do Supabase precisa liberar `x-client-info` e `apikey` no CORS.** Sem
isso o navegador manda só o OPTIONS e cancela o POST — a função nem roda, e o log
fica só com "booted". Sintoma: na aba Invocations aparece OPTIONS sem POST.

**A função `Chat.assinar` devolve objeto `{digitando, sair}`, não função.**
Chamar como função quebra o build inteiro.

**Coluna nova no banco precisa entrar também no tipo do TypeScript**, senão o
build falha com "does not exist in type".

**Depois de criar tabela, rode `notify pgrst, 'reload schema';`** senão a API
responde "Could not find the table in the schema cache" por alguns minutos.

**XP é total acumulado**, não progresso dentro do nível. A fórmula do banco e a
do `nito-gamificacao.ts` precisam continuar iguais: nível N exige
`250 * (N-1) * (N+2)` de XP total.

---

## 9. Arquivos SQL já aplicados

`01-schema.sql` (base), `07-liberar-clientes.sql`, `10-ecossistema.sql`,
`11-corrige-comentarios-aula.sql`, `12-extensao.sql`, `13-modulos.sql`, mais a
política de update em `posts` (para fixar publicação).

Todos são seguros de rodar de novo.

---

## 10. Estrutura do código

```
src/lib/nito-motor.ts          toda leitura e escrita do banco
src/lib/nito-gamificacao.ts    patentes, XP, dias restantes
src/app/nito-ui.css            sistema visual, tudo preso na classe .nito
src/components/nito/           AppShell, PostNito, CompositorNito,
                               ChatNito, AulaDetalhe, NitoIcones
src/app/{inicio,comunidade,aulas,vendas,extensao,suporte,perfil}/page.tsx
supabase/functions/chaves/     ponte com o servidor de licenças
```

O CSS inteiro está sob `.nito` de propósito: as telas antigas usam estilo em
linha e nada vaza entre os dois mundos.
