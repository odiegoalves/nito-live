// =============================================================================
// NITO LIVE - qual e a versao publicada da extensao.
//
// Quem pergunta e a propria extensao instalada, de tempos em tempos, para
// avisar o cliente quando sai versao nova. Nao ha login: e um programa
// perguntando, nao uma pessoa.
//
// A resposta traz SO o numero da versao e a nota do que mudou. O endereco do
// arquivo nao vem aqui de proposito - quem baixa passa pela aba Extensao,
// onde a assinatura e conferida.
// =============================================================================
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    return NextResponse.json(
      { ok: false, erro: "servidor sem configuracao do banco" },
      { status: 500 }
    );
  }

  try {
    const sb = createClient(url, chave, { auth: { persistSession: false } });
    // Funcao do banco em vez de leitura direta da tabela: assim quem nao esta
    // logado enxerga apenas versao e notas, e nada mais da tabela.
    const { data, error } = await sb.rpc("fn_versao_atual");
    if (error) throw error;

    const linha = Array.isArray(data) ? data[0] : data;
    if (!linha || !linha.versao) {
      return NextResponse.json({ ok: true, versao: null });
    }

    return NextResponse.json(
      {
        ok: true,
        versao: String(linha.versao),
        notas: linha.notas ?? "",
        publicado_em: linha.publicado_em ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "falha ao consultar a versao";
    return NextResponse.json({ ok: false, erro: msg }, { status: 502 });
  }
}
