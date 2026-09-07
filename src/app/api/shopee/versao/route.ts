// =============================================================================
// Rota publica (sem login) que o programa NITO LIVE Shopee (desktop, C#) chama
// sozinho ao abrir, so pra saber se tem uma versao mais nova publicada. Usa a
// mesma tabela extensao_versoes que a pagina /shopee ja le, filtrando por
// produto="shopee". Nao precisa de service role: a leitura e publica de
// proposito (o arquivo_url ja e um link de download publico de qualquer jeito).
//
// Se der erro de RLS (tabela nao deixa leitura anonima), rodar no Supabase:
//   create policy "leitura publica de versoes"
//   on extensao_versoes for select using (true);
// =============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await sb
      .from("extensao_versoes")
      .select("versao, arquivo_url, notas, tamanho_bytes, publicado_em")
      .eq("produto", "shopee")
      .eq("atual", true)
      .order("publicado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ erro: "Nenhuma versão publicada." }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Erro desconhecido." },
      { status: 500 }
    );
  }
}
