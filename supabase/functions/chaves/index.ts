// =============================================================================
// NITO LIVE - funcao "chaves"
//
// Ponte entre o site e o servidor de licencas.
//
// Por que existe: as chaves moram no painel admin (VPS), nao no Supabase. Se o
// navegador falasse direto com o painel, a senha de administrador precisaria
// estar no site e qualquer pessoa a leria. Aqui a senha fica no servidor.
//
// Como funciona:
//   1. confere quem esta pedindo, pelo login do proprio site
//   2. usa o e-mail dessa pessoa - nunca um e-mail que venha do navegador
//   3. pergunta ao painel as chaves daquele e-mail
//   4. devolve so o que e daquela pessoa, so do produto pedido
//
// Produtos: "tiktok" (extensao, padrao) e "shopee" (programa desktop). Cada
// produto tem sua propria lista e sua propria cota de chaves.
//
// Segredos necessarios (Edge Functions -> Secrets):
//   ADMIN_API_URL   https://admin.nitolive.com.br
//   ADMIN_USER      usuario do painel
//   ADMIN_PASS      senha do painel
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Quantas chaves cada plano permite, por produto. Sem limite = -1.
const LIMITE: Record<string, number> = {
  basic: 1,     // R$ 67
  pro: 2,       // R$ 97
  premium: -1,  // R$ 147, ilimitado
};

// Status do cliente no painel que significam "sem direito a acesso".
const STATUS_QUE_BLOQUEIAM = [
  "cancel", "refund", "reembols", "estorn", "chargeback",
  "bloque", "block", "ban", "suspen", "inativ", "inactive",
  "expir", "revog", "revok",
];

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function entrarNoPainel(base: string) {
  const r = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: Deno.env.get("ADMIN_USER"),
      password: Deno.env.get("ADMIN_PASS"),
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!d?.token) throw new Error("nao consegui falar com o painel");
  return d.token as string;
}

async function clienteDoEmail(base: string, token: string, email: string) {
  const r = await fetch(
    `${base}/api/admin/clients?search=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const d = await r.json().catch(() => ({}));
  const lista = Array.isArray(d?.clients) ? d.clients : [];
  // O painel busca por semelhanca; aqui exigimos o e-mail exato.
  return lista.find(
    (c: any) => String(c?.email ?? "").trim().toLowerCase() === email
  ) ?? null;
}

function produtoDa(l: any) {
  return String(l?.product ?? "tiktok").trim().toLowerCase() === "shopee" ? "shopee" : "tiktok";
}

function ativa(l: any) {
  return (l?.active === 1 || l?.active === true) && String(l?.status ?? "").toLowerCase() === "active";
}

type Produto = "tiktok" | "shopee";
type InfoProduto = { comprou: boolean; plano: string | null };
type Produtos = Record<Produto, InfoProduto>;

// Checkout da Cakto de cada produto (mostrado no cadeado do portal).
const LINKS_COMPRA: Record<Produto, { rotulo: string; preco: string; url: string }[]> = {
  tiktok: [
    { rotulo: "Básico · 1 chave", preco: "R$ 67", url: "https://pay.cakto.com.br/xd4yj7y" },
    { rotulo: "Pro · 2 chaves", preco: "R$ 97", url: "https://pay.cakto.com.br/3477jz3_976117" },
    { rotulo: "Premium · ilimitado", preco: "R$ 147", url: "https://pay.cakto.com.br/mdz39dg" },
  ],
  shopee: [
    { rotulo: "1 chave", preco: "R$ 67", url: "https://pay.cakto.com.br/3bt54pt_1091653" },
    { rotulo: "2 chaves", preco: "R$ 97", url: "https://pay.cakto.com.br/xirh3pe_1091658" },
  ],
};

const NOME_PRODUTO: Record<Produto, string> = { tiktok: "NITO LIVE (TikTok)", shopee: "NITO LIVE Shopee" };

// Pergunta ao painel quais produtos a pessoa comprou (com estornos descontados).
// Devolve null se a rota nao existir ou falhar - ai a funcao usa o plano B.
async function produtosDoCliente(base: string, token: string, email: string): Promise<Produtos | null> {
  try {
    const r = await fetch(`${base}/api/admin/customer-products?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const d = await r.json().catch(() => null);
    return d?.ok && d?.produtos?.tiktok && d?.produtos?.shopee ? (d.produtos as Produtos) : null;
  } catch {
    return null;
  }
}

// Gera a primeira chave do produto, se ainda nao existir nenhuma. O painel
// garante que chamadas repetidas ou simultaneas nao criam duas chaves.
async function garantirPrimeiraChave(base: string, token: string, email: string, produto: Produto): Promise<boolean> {
  try {
    const r = await fetch(`${base}/api/admin/actions/ensure-first-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, product: produto }),
    });
    const d = await r.json().catch(() => ({}));
    if (d?.created) console.log(`[chaves] primeira chave ${produto} gerada automaticamente para ${email}`);
    return !!d?.created;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const base = (Deno.env.get("ADMIN_API_URL") ?? "").replace(/\/+$/, "");
  if (!base) return responder({ erro: "ADMIN_API_URL nao configurada" }, 500);

  try {
    // ---- 1. quem esta pedindo ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return responder({ erro: "precisa estar logado" }, 401);
    const email = user.email.trim().toLowerCase();

    // ---- 2. o que a pessoa quer ----
    const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const acao = corpo?.acao === "gerar" ? "gerar" : "listar";
    const produto = corpo?.produto === "shopee" ? "shopee" : "tiktok";

    console.log(`[chaves] ${acao} ${produto} pedido por: ${email}`);

    const token = await entrarNoPainel(base);
    let cliente = await clienteDoEmail(base, token, email);

    if (!cliente) {
      console.log(`[chaves] ${email} -> nao encontrado no painel`);
      return responder({
        email,
        encontrado: false,
        plano: null,
        produto,
        limite: 0,
        podeGerar: false,
        chaves: [],
        assinatura_ativa: false,
        assinatura_expira_em: null,
        comprou: { tiktok: false, shopee: false },
        liberado: { tiktok: false, shopee: false },
        produto_liberado: false,
        links_compra: LINKS_COMPRA[produto],
        recado:
          "Não encontrei compra com este e-mail. Use o mesmo e-mail que você usou na Cakto.",
      });
    }

    // ---- 3. quais produtos a pessoa comprou ----
    const produtosPainel = await produtosDoCliente(base, token, email);
    let produtos: Produtos;
    if (produtosPainel) {
      produtos = produtosPainel;
    } else {
      // Plano B (rota do painel fora do ar): comportamento antigo.
      const textoOferta = `${cliente.productName ?? ""} ${cliente.offerName ?? ""}`.toLowerCase();
      const temShopee = (cliente.licenses ?? []).some((l: any) => produtoDa(l) === "shopee");
      produtos = {
        tiktok: { comprou: true, plano: null },
        shopee: { comprou: textoOferta.includes("shopee") || temShopee, plano: null },
      };
    }

    // ---- 4. primeira chave automatica ----
    // Quem comprou um produto e ainda nao tem nenhuma chave dele ganha a
    // primeira na hora em que entra no portal. So roda com a resposta real do
    // painel, nunca com o plano B.
    let primeiraChaveGerada = false;
    if (acao === "listar" && produtosPainel) {
      for (const p of ["tiktok", "shopee"] as Produto[]) {
        const temAlguma = (cliente.licenses ?? []).some((l: any) => produtoDa(l) === p);
        if (produtos[p].comprou && !temAlguma) {
          if (await garantirPrimeiraChave(base, token, email, p)) primeiraChaveGerada = true;
        }
      }
      if (primeiraChaveGerada) cliente = (await clienteDoEmail(base, token, email)) ?? cliente;
    }

    // Liberado = comprou, ou recebeu do admin uma chave ativa desse produto
    // (cortesia/parceiro).
    const temChaveAtiva = (p: Produto) => (cliente.licenses ?? []).some((l: any) => produtoDa(l) === p && ativa(l));
    const liberado: Record<Produto, boolean> = {
      tiktok: produtos.tiktok.comprou || temChaveAtiva("tiktok"),
      shopee: produtos.shopee.comprou || temChaveAtiva("shopee"),
    };

    // Cada produto tem o seu plano (ex.: Shopee "2 Chaves" = pro).
    const plano = String(produtos[produto].plano ?? cliente.plan ?? "basic").trim().toLowerCase();
    const limite = LIMITE[plano] ?? 1;

    // ---- 5. gerar chave nova, se o plano deixar ----
    if (acao === "gerar") {
      // Cada produto e vendido separado na Cakto. So gera chave de produto
      // comprado. Cortesias o admin gera pelo painel escolhendo o produto.
      if (!liberado[produto]) {
        return responder(
          {
            erro:
              `O ${NOME_PRODUTO[produto]} é um produto vendido separado. Para gerar a chave, é preciso comprar essa ferramenta na Cakto com este mesmo e-mail.`,
            produto_liberado: false,
            links_compra: LINKS_COMPRA[produto],
          },
          403
        );
      }

      const ativasDoProduto = (cliente.licenses ?? []).filter((l: any) => produtoDa(l) === produto && ativa(l)).length;
      if (limite !== -1 && ativasDoProduto >= limite) {
        return responder(
          {
            erro: `Seu plano permite ${limite} ${limite === 1 ? "chave" : "chaves"}. Para ter mais, faça o upgrade.`,
          },
          403
        );
      }

      const g = await fetch(`${base}/api/admin/actions/generate-key-for-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, plan: plano, durationDays: 30, product: produto }),
      });
      const resultado = await g.json().catch(() => ({}));
      if (!g.ok || resultado?.ok === false) {
        return responder({ erro: resultado?.error ?? "não consegui gerar a chave" }, 502);
      }
      console.log(`[chaves] chave ${produto} gerada para ${email}`);
      // Rele para devolver a lista ja atualizada.
      cliente = (await clienteDoEmail(base, token, email)) ?? cliente;
    }

    // ---- 6. devolve so o que e dessa pessoa, so desse produto ----
    const todasLicencas: any[] = cliente.licenses ?? [];
    const chaves = todasLicencas
      .filter((l: any) => produtoDa(l) === produto)
      .map((l: any) => {
        const ip = String(l?.activationIp ?? "").trim();
        return {
          id: l?.id,
          chave: l?.key,
          plano: l?.plan,
          produto,
          ativa: ativa(l),
          situacao: l?.status,
          expira_em: l?.expiresAt ?? null,
          ultimo_uso: l?.lastValidationAt ?? null,
          // O painel manda "—" quando nao ha aparelho; isso nao e vinculo.
          vinculada: ip !== "" && ip !== "—" && ip !== "-",
        };
      });

    const ativas = chaves.filter((c) => c.ativa).length;

    // ---- 7. a pessoa pode usar o portal? ----
    // A assinatura nao e por produto. O AuthGuard do site le estes campos
    // para liberar ou bloquear o usuario. Libera se:
    //   a) tem alguma chave ativa (qualquer produto); ou
    //   b) a conta tem data de validade futura e status ativo (ex.: acesso
    //      manual); ou
    //   c) compra nova: ainda nao tem nenhuma chave e o status nao e de
    //      cancelado/reembolsado/bloqueado/vencido. Sem isso o cliente era
    //      barrado antes de chegar na tela de gerar a primeira chave.
    // Quem ja teve chave e ela venceu, sem validade futura, continua
    // bloqueado (precisa renovar).
    const statusConta = String(cliente.status ?? "").trim().toLowerCase();
    const statusValido = !STATUS_QUE_BLOQUEIAM.some((s) => statusConta.includes(s));
    const expiraConta: string | null = cliente.expiresAt ?? cliente.dueDate ?? null;
    const expiraContaMs = expiraConta ? new Date(expiraConta).getTime() : NaN;
    const contaVencida = Number.isFinite(expiraContaMs) && expiraContaMs < Date.now();
    const contaComValidadeFutura = Number.isFinite(expiraContaMs) && !contaVencida;

    const licencasAtivasGeral = todasLicencas.filter(ativa);
    const assinaturaAtiva =
      licencasAtivasGeral.length > 0 ||
      (statusValido && contaComValidadeFutura) ||
      (statusValido && !contaVencida && todasLicencas.length === 0);

    const assinaturaExpiraEm =
      (contaComValidadeFutura ? expiraConta : null) ??
      (licencasAtivasGeral
        .map((l: any) => l?.expiresAt)
        .filter(Boolean)
        .sort()
        .pop() ?? null);

    console.log(
      `[chaves] ${email} -> status=${statusConta || "null"}, plano=${plano}, produto=${produto}, ` +
        `liberado=${liberado[produto]}, chaves_produto=${chaves.length}, ativas_produto=${ativas}, ` +
        `assinatura_ativa=${assinaturaAtiva}${primeiraChaveGerada ? ", primeira_chave_gerada" : ""}`
    );

    return responder({
      email,
      encontrado: true,
      plano,
      produto,
      limite,
      ativas,
      podeGerar: liberado[produto] && (limite === -1 || ativas < limite),
      status: cliente.status ?? null,
      chaves,
      assinatura_ativa: assinaturaAtiva,
      assinatura_expira_em: assinaturaExpiraEm,
      comprou: { tiktok: produtos.tiktok.comprou, shopee: produtos.shopee.comprou },
      liberado,
      produto_liberado: liberado[produto],
      links_compra: LINKS_COMPRA[produto],
      primeira_chave_gerada: primeiraChaveGerada,
    });
  } catch (e) {
    console.log(`[chaves] ERRO: ${e instanceof Error ? e.message : String(e)}`);
    return responder({ erro: e instanceof Error ? e.message : "falha inesperada" }, 500);
  }
});
