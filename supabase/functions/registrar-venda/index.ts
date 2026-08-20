import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const auth = req.headers.get('Authorization') ?? '';
  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response(JSON.stringify({ erro: 'nao autenticado' }),
    { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const body = await req.json();
  const vendas = (Array.isArray(body) ? body : [body]).map((v) => ({
    user_id: user.id,
    id_pedido: String(v.id_pedido ?? v.orderId ?? '').slice(0, 120),
    origem: v.origem ?? 'tiktok_shop',
    produto: (v.produto ?? v.product ?? '').slice(0, 300),
    valor_centavos: Math.max(0, Math.round(Number(v.valor_centavos ?? (Number(v.valor ?? 0) * 100)))),
    status: ['pendente','aprovado','cancelado','reembolsado'].includes(v.status) ? v.status : 'aprovado',
    ocorrido_em: v.ocorrido_em ?? new Date().toISOString()
  })).filter((v) => v.id_pedido);

  if (!vendas.length) return new Response(JSON.stringify({ erro: 'sem id_pedido' }),
    { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const { data, error } = await sb.from('vendas')
    .upsert(vendas, { onConflict: 'user_id,id_pedido', ignoreDuplicates: false })
    .select('id, id_pedido');

  return new Response(JSON.stringify({ ok: !error, gravadas: data?.length ?? 0, erro: error?.message }), {
    status: error ? 400 : 200,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
});
