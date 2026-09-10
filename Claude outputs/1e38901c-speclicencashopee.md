# Especificação — Licença/Chave de acesso do NITO LIVE Shopee (Desktop)

Contexto: o NITO LIVE (extensão TikTok) já tem um sistema de licença funcionando, em
`NITO LIVE 3.0\src\modules\license.js`. Ele fala com uma API real em
`https://api.nitolive.com.br/api/activate` e já manda um campo `product` pensado desde o
início para isolar por produto no futuro (comentário `BACKEND_PRODUCT_ISOLATION_PENDING`
no próprio arquivo). Esta especificação descreve o que falta pra estender esse mesmo
sistema para o NITO LIVE Shopee (app desktop), sem quebrar o que já existe pro TikTok.

## 1. O que já existe (não mexer, só reaproveitar o padrão)

- Endpoint: `POST https://api.nitolive.com.br/api/activate`
- Payload enviado hoje (extensão TikTok):
  ```json
  {
    "key": "CHAVE-DO-CLIENTE",
    "licenseKey": "CHAVE-DO-CLIENTE",
    "email": "email-do-vendedor@exemplo.com",
    "deviceId": "NITO-uuid-gerado-localmente",
    "deviceFingerprint": "NITO-uuid-gerado-localmente",
    "product": "nito-live",
    "extensionVersion": "x.y.z"
  }
  ```
- Respostas esperadas (a extensão já trata todas):
  - `200` com `{ "ok": true, "email", "plan", "expiresAt", "daysRemaining", "product" }` → chave válida.
  - `200` com `{ "ok": false, "reason": "expired", ... }` → licença vencida.
  - `200` com `{ "ok": false, "reason": "blocked", ... }` → licença bloqueada.
  - `404` com `{ "reason": "invalid" | "expired" | "blocked", "error": "..." }` → chave não encontrada/vencida/bloqueada.
  - `400`/`401`/`403` → erro de requisição.
  - `500+` → erro do servidor (o cliente tenta de novo 1x automaticamente).
- Formato de chave aceito pelo cliente: letras/números, mínimo 7 caracteres, sem espaço
  (regex `^[A-Z0-9][A-Z0-9\-]{6,}$`, case-insensitive).

## 2. O que falta no BACKEND (api.nitolive.com.br)

1. Usar o campo `product` que já chega no payload (hoje provavelmente ignorado) para
   isolar a validação: uma chave gerada para `product: "nito-live"` (TikTok) **não** deve
   validar como `ok: true` quando o cliente manda `product: "nito-live-shopee"`, e
   vice-versa.
2. Definir o identificador do novo produto. Sugestão: `"nito-live-shopee"` (mantém o
   padrão do que já existe, só adiciona o sufixo do canal).
3. Ao emitir uma chave nova (seja qual for o fluxo de geração hoje — painel admin, webhook
   da Cakto, etc.), gravar/associar o produto correto (`nito-live` ou `nito-live-shopee`)
   junto da chave, pra API saber responder certo depois.
4. Na resposta de sucesso, o campo `"product"` devolvido deve bater com o que foi
   comprado — o cliente da extensão já rejeita como erro (`LICENSE_PRODUCT_MISMATCH`) se
   vier diferente do esperado, então isso precisa estar correto desde o backend.
5. Não é necessário criar um endpoint novo — é o mesmo `/api/activate`, só passando a
   respeitar o `product` que já é enviado.

## 3. O que falta no SITE (app.nitolive.com.br)

1. Hoje a comunidade já tem uma aba/fluxo pra gerar a chave do TikTok depois da compra via
   Cakto. Precisa de uma aba nova equivalente para "Shopee" — mesmo fluxo de tela, só
   emitindo/mostrando uma chave associada a `product: "nito-live-shopee"` no backend.
2. O fluxo de compra pela Cakto precisa direcionar o comprador do produto Shopee pra essa
   aba nova (provavelmente via qual produto/oferta ele comprou na Cakto — depende de como
   o link de redirecionamento pós-compra já funciona hoje pro TikTok).
3. Não precisa reinventar a UI — pode ser literalmente uma cópia da aba do TikTok, só
   trocando o texto e o produto que a chave gerada carrega.

## 4. O que o app desktop (NITO LIVE Shopee) vai fazer (implementação futura, depois que 2 e 3 estiverem prontos)

- Uma tela de login/ativação exibida antes de liberar o uso do programa, pedindo a chave.
- Replica em C# a mesma lógica do `license.js`: gera e guarda um `deviceId` local,
  normaliza a chave digitada, chama o mesmo endpoint `/api/activate` mandando
  `"product": "nito-live-shopee"`, trata os mesmos estados (`VALID`, `EXPIRED`,
  `BLOCKED`, `OFFLINE_GRACE` com 24h de tolerância offline, `ERROR`), e guarda a sessão
  localmente (equivalente ao `chrome.storage.local` da extensão, aqui seria um arquivo
  local em `%LOCALAPPDATA%\NitoLive\`).
- Revalida a licença a cada 6h enquanto o programa estiver aberto (mesmo intervalo já
  usado na extensão).
- Nunca loga a chave completa em nenhum log (mesma regra que já vale pro Stream Key da
  Shopee no restante do app).

## 5. Ordem sugerida

1. Backend: liberar isolamento por `product` no `/api/activate` (item 2).
2. Site: nova aba "Shopee" gerando chave com o produto certo (item 3).
3. Testar manualmente: gerar uma chave de teste "Shopee" e confirmar que a API responde
   `ok: true` com `product: "nito-live-shopee"` pra ela.
4. Só então implementar a tela de login no app desktop (item 4) — nessa etapa eu (Claude)
   preciso do acesso a esse repositório do NITO LIVE Shopee de novo pra codar.
