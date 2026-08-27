import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// =============================================================================
// NITO LIVE - ponte de vendas da extensao.
// A extensao nao tem login no Supabase, so a chave de licenca. Esta funcao
// revalida a chave direto no servidor de licencas (nao confia no e-mail que a
// extensao manda), acha o usuario correspondente no Supabase pelo e-mail
// oficial devolvido pelo servidor, e grava a venda em nome dele.
// =============================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LICENSE_API = 'https://admin.valoranegocios.com.br/painel-seguro-liveinfinity/api/check';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── AVISO PUSH ───────────────────────────────────────────────────────────
// A extensao grava a venda direto aqui (sem passar pelo VPS), entao o
// aviso push (som + notificacao mesmo com o celular bloqueado) tambem
// precisa disparar daqui - senao a venda fica gravada, mas o dono da live
// so fica sabendo se estiver com o app aberto olhando na hora.
// Mesmo texto/formato que o servidor VPS ja usava (nitoEnviarPush em
// server.js), pra nao mudar como a notificacao aparece pro operador.
async function enviarPush(sb: ReturnType<typeof createClient>, email: string, venda: Record<string, unknown>) {
  const chavePub = Deno.env.get('NITO_VAPID_PUBLICA');
  const chavePriv = Deno.env.get('NITO_VAPID_PRIVADA');
  if (!chavePub || !chavePriv) {
    console.log('[PUSH] configuracao de push incompleta (faltam as chaves VAPID nos secrets da funcao)');
    return;
  }

  const { data: inscricoes, error } = await sb
    .from('push_inscricoes')
    .select('id, endpoint, p256dh, auth')
    .eq('email', email);

  if (error) {
    console.log('[PUSH] falha ao consultar aparelhos: ' + error.message);
    return;
  }
  if (!inscricoes || inscricoes.length === 0) return;

  webpush.setVapidDetails(
    Deno.env.get('NITO_VAPID_CONTATO') || 'mailto:noreply@nitolive.com.br',
    chavePub,
    chavePriv
  );

  const centavos = Number(venda.valor_centavos || 0);
  const valor = centavos > 0
    ? (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;
  const produto = venda.produto ? String(venda.produto).slice(0, 60) : '';
  const corpo = valor ? (valor + (produto ? ' — ' + produto : '')) : (produto || 'venda registrada');
  const carga = JSON.stringify({ titulo: 'Venda na sua live', corpo, url: '/alertas' });

  for (const i of inscricoes as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>) {
    try {
      await webpush.sendNotification(
        { endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } },
        carga,
        { TTL: 600, urgency: 'high' }
      );
    } catch (e) {
      const cod = (e as { statusCode?: number })?.statusCode;
      if (cod === 404 || cod === 410) {
        await sb.from('push_inscricoes').delete().eq('id', i.id);
        console.log('[PUSH] aparelho removido por nao existir mais');
      } else {
        console.log('[PUSH] falha ao entregar: ' + cod + ' ' + (e as Error)?.message);
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ erro: 'metodo nao permitido' }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ erro: 'corpo invalido' }, 400);
  }

  const licenseKey = String(body.license_key ?? '').trim();
  if (!licenseKey) return json({ erro: 'license_key ausente' }, 400);

  // 1. Revalida a chave direto no servidor de licencas - a fonte da verdade
  //    do e-mail e sempre o servidor, nunca o que a extensao mandar solto.
  let email: string | null = null;
  try {
    const resp = await fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        key: licenseKey,
        deviceId: body.device_id ?? 'nito-vendas-bridge',
        product: 'nito-live',
        extensionVersion: body.extension_version ?? 'server-check',
      }),
    });
    if (!resp.ok) return json({ erro: 'licenca invalida ou vencida' }, 401);
    const respBody = await resp.json();
    email = respBody?.email ?? null;
  } catch {
    return json({ erro: 'nao consegui falar com o servidor de licencas' }, 502);
  }

  if (!email) return json({ erro: 'servidor de licencas nao devolveu e-mail' }, 502);

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('NITO_SERVICE_ROLE_KEY')!
  );

  // 2. Acha o usuario do Supabase pelo e-mail oficial da licenca.
  const { data: userId, error: erroUsuario } = await sb.rpc('fn_user_id_por_email', { p_email: email });
  if (erroUsuario) return json({ erro: 'falha ao procurar usuario: ' + erroUsuario.message }, 500);
  if (!userId) {
    return json({ erro: 'nenhuma conta encontrada com este e-mail no app.nitolive.com.br', email }, 404);
  }

  // 3. Monta a venda. Sem id_pedido real do TikTok, a extensao deve mandar um
  //    identificador proprio e estavel (ex: comprador+produto+minuto) para nao
  //    duplicar a mesma compra se o mesmo evento disparar de novo.
  const idPedido = String(body.id_pedido ?? '').trim();
  if (!idPedido) return json({ erro: 'id_pedido ausente' }, 400);

  const venda = {
    user_id: userId,
    id_pedido: idPedido.slice(0, 120),
    origem: body.origem ?? 'tiktok_shop',
    produto: String(body.produto ?? '').slice(0, 300),
    valor_centavos: Math.max(0, Math.round(Number(body.valor_centavos ?? (Number(body.valor ?? 0) * 100)))),
    status: ['pendente', 'aprovado', 'cancelado', 'reembolsado'].includes(body.status) ? body.status : 'aprovado',
    ocorrido_em: body.ocorrido_em ?? new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('vendas')
    .upsert([venda], { onConflict: 'user_id,id_pedido', ignoreDuplicates: false })
    .select('id, id_pedido');

  // O aviso e so um espelho: se ele falhar, a venda ja gravada continua
  // valendo normalmente - por isso fica num try/catch que nunca derruba a
  // resposta principal.
  if (!error && data && data.length > 0) {
    try {
      await enviarPush(sb, email, venda);
    } catch (ePush) {
      console.log('[PUSH] erro geral: ' + (ePush as Error)?.message);
    }
  }

  return json({ ok: !error, gravadas: data?.length ?? 0, erro: error?.message }, error ? 400 : 200);
});
