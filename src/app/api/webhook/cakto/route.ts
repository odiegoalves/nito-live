import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[WEBHOOK CAKTO VERCEL] Webhook recebido:", JSON.stringify(body, null, 2));

    // Repassa o webhook para o servidor VPS de licenças oficiais
    // A URL e o segredo saem do ambiente. NUNCA escreva o segredo aqui:
    // este arquivo vai para o Git e qualquer pessoa com acesso ao repositorio le.
    const vpsUrl = process.env.CAKTO_RELAY_URL;

    if (!vpsUrl) {
      console.error("[WEBHOOK CAKTO] CAKTO_RELAY_URL nao configurada no ambiente.");
      return NextResponse.json({ ok: true, warning: "relay nao configurado" }, { status: 200 });
    }


    try {
      const vpsRes = await fetch(vpsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const vpsData = await vpsRes.json();
      console.log("[WEBHOOK CAKTO VERCEL] Resposta da VPS:", vpsData);
    } catch (fErr: any) {
      console.error("[WEBHOOK CAKTO VERCEL] Erro ao repassar para VPS:", fErr.message);
    }

    // Retorna HTTP 200 OK garantido para a Cakto
    return NextResponse.json({ ok: true, received: true, processed: true }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [WEBHOOK CAKTO ERROR]", error);
    // Retorna HTTP 200 para a Cakto nunca registrar 500 Error
    return NextResponse.json({ ok: true, warning: error.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "Cakto Webhook Relay Active" }, { status: 200 });
}
