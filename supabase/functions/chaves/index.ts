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
//   4. devolve so o que e daquela pessoa
//
// Segredos necessarios (Edge Functions -> Secrets):
//   ADMIN_API_URL   https://admin.nitolive.com.br
//   ADMIN_USER      usuario do painel
//   ADMIN_PASS      senha do painel
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Quantas chaves cada plano permite. Sem limite = -1.
const LIMITE: Record<string, number> = {
  basic: 1,     // R$ 67
  pro: 2,       // R$ 97
  premium: -1,  // R$ 147, ilimitado
};

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

    const token = await entrarNoPainel(base);
    let cliente = await clienteDoEmail(base, token, email);

    if (!cliente) {
      return responder({
        email,
        encontrado: false,
        plano: null,
        limite: 0,
        podeGerar: false,
        chaves: [],
        recado:
          "Não encontrei compra com este e-mail. Use o mesmo e-mail que você usou na Cakto.",
      });
    }

    const plano = String(cliente.plan ?? "basic").trim().toLowerCase();
    const limite = LIMITE[plano] ?? 1;

    // ---- 3. gerar chave nova, se o plano deixar ----
    if (acao === "gerar") {
      const ativas = (cliente.licenses ?? []).filter((l: any) => l?.active).length;
      if (limite !== -1 && ativas >= limite) {
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
        body: JSON.stringify({ email, plan: plano, durationDays: 30 }),
      });
      const resultado = await g.json().catch(() => ({}));
      if (!g.ok || resultado?.ok === false) {
        return responder({ erro: resultado?.error ?? "não consegui gerar a chave" }, 502);
      }
      // Relê para devolver a lista ja atualizada.
      cliente = (await clienteDoEmail(base, token, email)) ?? cliente;
    }

    // ---- 4. devolve so o que e dessa pessoa ----
    const chaves = (cliente.licenses ?? []).map((l: any) => ({
      id: l?.id,
      chave: l?.key,
      plano: l?.plan,
      ativa: !!l?.active,
      situacao: l?.status,
      expira_em: l?.expiresAt ?? null,
      ultimo_uso: l?.lastValidationAt ?? null,
      vinculada: !!l?.activationIp,
    }));

    const ativas = chaves.filter((c) => c.ativa).length;

    return responder({
      email,
      encontrado: true,
      plano,
      limite,
      ativas,
      podeGerar: limite === -1 || ativas < limite,
      status: cliente.status ?? null,
      chaves,
    });
  } catch (e) {
    return responder({ erro: e instanceof Error ? e.message : "falha inesperada" }, 500);
  }
});
