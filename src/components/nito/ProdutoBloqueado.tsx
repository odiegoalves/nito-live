"use client";

// =============================================================================
// NITO LIVE - cartao de produto bloqueado.
// Aparece na aba de um produto que a pessoa nao comprou (TikTok ou Shopee):
// cadeado, o que a ferramenta faz e os botoes de compra da Cakto.
// Os links vem da funcao "chaves"; se nao vierem, usa os de baixo.
// =============================================================================

import React from "react";
import type { LinkCompra, ProdutoChave } from "@/lib/nito-motor";

const PADRAO: Record<ProdutoChave, LinkCompra[]> = {
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

const TEXTO: Record<ProdutoChave, { nome: string; frase: string; itens: string[] }> = {
  tiktok: {
    nome: "NITO LIVE para TikTok Shop",
    frase: "A extensão do Chrome que automatiza sua live no TikTok Shop.",
    itens: [
      "Fixa e gira os produtos da live sozinha",
      "Responde o chat e comenta automaticamente",
      "Chave própria, separada da Shopee",
    ],
  },
  shopee: {
    nome: "NITO LIVE Shopee",
    frase: "O programa de PC que automatiza sua live na Shopee.",
    itens: [
      "Instalador único para Windows",
      "Mesma conta do portal, chave separada da extensão TikTok",
      "Ativa na hora com a chave gerada aqui",
    ],
  },
};

export function ProdutoBloqueado({ produto, links }: { produto: ProdutoChave; links?: LinkCompra[] }) {
  const t = TEXTO[produto];
  const opcoes = links && links.length ? links : PADRAO[produto];

  return (
    <div className="panel pad" style={{ marginTop: 16, textAlign: "center", padding: "40px 24px" }}>
      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 16px",
          borderRadius: 18,
          display: "grid",
          placeItems: "center",
          fontSize: "1.8rem",
          background: "rgba(255,255,255,.04)",
          border: "1px solid var(--line)",
        }}
      >
        🔒
      </div>
      <span className="eyebrow">FERRAMENTA BLOQUEADA</span>
      <h2 className="h-sec" style={{ marginTop: 8 }}>Você ainda não tem o {t.nome}</h2>
      <p className="muted" style={{ maxWidth: 460, margin: "10px auto 0" }}>{t.frase}</p>

      <ul className="muted tiny" style={{ listStyle: "none", padding: 0, margin: "18px auto 0", maxWidth: 380, textAlign: "left", display: "grid", gap: 6 }}>
        {t.itens.map((i) => (
          <li key={i}>✓ {i}</li>
        ))}
      </ul>

      <div style={{ display: "grid", gap: 10, maxWidth: 380, margin: "24px auto 0" }}>
        {opcoes.map((o, i) => (
          <a
            key={o.url}
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className={i === 0 ? "btn p" : "btn g"}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, textDecoration: "none" }}
          >
            <span style={{ textAlign: "left" }}>COMPRAR · {o.rotulo}</span>
            <b style={{ whiteSpace: "nowrap" }}>{o.preco}</b>
          </a>
        ))}
      </div>

      <p className="muted tiny" style={{ marginTop: 16 }}>
        Use o <strong>mesmo e-mail desta conta</strong> na compra. Assim que o pagamento for aprovado, sua
        chave aparece aqui sozinha.
      </p>
    </div>
  );
}
