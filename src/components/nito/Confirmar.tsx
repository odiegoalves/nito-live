"use client";

// =============================================================================
// NITO LIVE - confirmacao no visual do portal.
//
// Substitui o window.confirm do navegador. Alguns navegadores embutidos (como
// o do app do Claude) nem mostram aquela janela e respondem "cancelar" na
// hora - o botao parecia nao fazer nada.
//
// Uso:
//   const { confirmar, janela } = useConfirmar();
//   if (!(await confirmar({ titulo: "Excluir?", texto: "...", botao: "Sim, excluir" }))) return;
//   ...e coloque {janela} em qualquer lugar do JSX do componente.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface PedidoConfirmacao {
  titulo: string;
  texto?: string;
  /** texto do botao de confirmar */
  botao?: string;
  /** icone do topo */
  icone?: string;
}

export function useConfirmar() {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const confirmar = useCallback((p: PedidoConfirmacao) => {
    // Se ja havia uma janela aberta, a anterior conta como cancelada.
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPedido(p);
    });
  }, []);

  const responder = useCallback((ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setPedido(null);
  }, []);

  // Fechar o componente com a janela aberta conta como cancelar.
  useEffect(() => () => resolverRef.current?.(false), []);

  const janela =
    pedido && typeof document !== "undefined"
      ? createPortal(
          // Vai direto no <body> para ficar por cima do menu lateral. O
          // div.nito mantem o estilo do portal.
          <div className="nito" style={{ background: "transparent" }}>
            <div
              className="confirmar-fundo"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirmar-titulo"
              onMouseDown={(e) => e.target === e.currentTarget && responder(false)}
              onKeyDown={(e) => e.key === "Escape" && responder(false)}
            >
              <div className="panel pad confirmar-caixa">
                <div className="confirmar-icone" aria-hidden>
                  {pedido.icone ?? "🗑"}
                </div>
                <h3 id="confirmar-titulo" className="h-sec" style={{ justifyContent: "center" }}>
                  {pedido.titulo}
                </h3>
                {pedido.texto && (
                  <p className="muted tiny" style={{ marginTop: 8 }}>
                    {pedido.texto}
                  </p>
                )}
                <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 18 }}>
                  <button type="button" className="btn g" onClick={() => responder(false)} autoFocus>
                    Cancelar
                  </button>
                  <button type="button" className="btn p" onClick={() => responder(true)}>
                    {pedido.botao ?? "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return { confirmar, janela };
}
