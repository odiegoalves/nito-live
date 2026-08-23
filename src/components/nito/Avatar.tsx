"use client";

// =============================================================================
// NITO LIVE - a foto da pessoa.
//
// Existe uma peca so, usada em post, comentario, chat, lista de online,
// compositor, aula e ranking. Antes cada tela desenhava o seu proprio circulo
// com as iniciais; bastava criar a setima tela para alguem esquecer a foto de
// novo.
//
// Sem foto, mostra as iniciais como sempre foi. Com foto que nao carrega (link
// quebrado, arquivo apagado), volta para as iniciais em vez de deixar um
// quadrado vazio na tela.
//
// O tamanho e o formato continuam vindo do CSS de cada lugar: esta peca so
// troca o CONTEUDO do circulo, nunca o tamanho dele.
// =============================================================================

import React, { useState } from "react";
import { iniciais } from "@/lib/nito-gamificacao";

interface Props {
  nome?: string | null;
  url?: string | null;
  /** classe do lugar onde ele aparece: .av, .avatar, etc. */
  className?: string;
  /** cor de fundo quando nao ha foto */
  style?: React.CSSProperties;
  /** texto no lugar das iniciais, para o selo oficial da NITO LIVE */
  texto?: string;
}

export function Avatar({ nome, url, className, style, texto }: Props) {
  const [falhou, setFalhou] = useState(false);

  if (url && !falhou) {
    return (
      <div className={className} style={{ ...style, overflow: "hidden", padding: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          onError={() => setFalhou(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {texto ?? iniciais(nome ?? undefined)}
    </div>
  );
}
