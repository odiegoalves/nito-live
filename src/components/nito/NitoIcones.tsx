"use client";

// Sprite unico de icones. Fica escondido no topo da casca e cada tela usa
// <Icone nome="home" /> em vez de repetir o desenho do SVG.

import React from "react";

const TRACO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SpriteIcones() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="ic-home" viewBox="0 0 24 24" {...TRACO}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.8V21h14V9.8" /></symbol>
        <symbol id="ic-users" viewBox="0 0 24 24" {...TRACO}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M17 11.2a3 3 0 0 0 0-6" /><path d="M18 20c0-2.6-1-4.4-2.6-5.4" /></symbol>
        <symbol id="ic-book" viewBox="0 0 24 24" {...TRACO}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 19.5z" /></symbol>
        <symbol id="ic-chart" viewBox="0 0 24 24" {...TRACO}><path d="M3 17l5.5-6 4 3.5L21 6" /><path d="M16 6h5v5" /></symbol>
        <symbol id="ic-plug" viewBox="0 0 24 24" {...TRACO}><path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 0 1-12 0z" /><path d="M12 17v4" /></symbol>
        <symbol id="ic-help" viewBox="0 0 24 24" {...TRACO}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 1 1 3.3 2.5c-.6.2-.8.7-.8 1.3v.4" /><path d="M12 17h.01" /></symbol>
        <symbol id="ic-user" viewBox="0 0 24 24" {...TRACO}><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" /></symbol>
        <symbol id="ic-out" viewBox="0 0 24 24" {...TRACO}><path d="M14 20H6V4h8" /><path d="M11 12h10M18 8.5 21.5 12 18 15.5" /></symbol>
        <symbol id="ic-send" viewBox="0 0 24 24" {...TRACO}><path d="M21 3 10.5 13.5" /><path d="M21 3l-6.5 18-4-8-8-4z" /></symbol>
        <symbol id="ic-heart" viewBox="0 0 24 24" {...TRACO}><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" /></symbol>
        <symbol id="ic-msg" viewBox="0 0 24 24" {...TRACO}><path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3v-7A7.5 7.5 0 0 1 10.5 4h3A7.5 7.5 0 0 1 21 11.5z" /></symbol>
        <symbol id="ic-play" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l11-6.5z" /></symbol>
        <symbol id="ic-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></symbol>
        <symbol id="ic-menu" viewBox="0 0 24 24" {...TRACO}><path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" /></symbol>
        <symbol id="ic-x" viewBox="0 0 24 24" {...TRACO}><path d="M5 5l14 14M19 5 5 19" /></symbol>
        <symbol id="ic-seta-dupla" viewBox="0 0 24 24" {...TRACO}><path d="M15 5 8 12l7 7" /></symbol>
        <symbol id="ic-trofeu" viewBox="0 0 24 24" {...TRACO}><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a4 4 0 0 0 4 4M17 5h3v2a4 4 0 0 1-4 4" /><path d="M12 14v3M9 21h6M9 21c0-2 1-2.5 3-2.5s3 .5 3 2.5" /></symbol>
        <symbol id="ic-onda" viewBox="0 0 24 24" {...TRACO}><path d="M2 12h2.5l2-6 3 12 2.5-9 2 6h3l2-6 2.5 3" /></symbol>
        <symbol id="ic-bell" viewBox="0 0 24 24" {...TRACO}><path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.4 5.5 2 6.5H4c.6-1 2-2.5 2-6.5z" /><path d="M9.7 20a2.3 2.3 0 0 0 4.6 0" /></symbol>
        <symbol id="ic-clip" viewBox="0 0 24 24" {...TRACO}><path d="M8 12.5 15 5.5a3.4 3.4 0 0 1 4.8 4.8L11 19a5.2 5.2 0 0 1-7.4-7.4L12.5 3" /></symbol>
      </defs>
    </svg>
  );
}

export function Icone({ nome, tam = 17 }: { nome: string; tam?: number }) {
  return (
    <svg width={tam} height={tam} aria-hidden="true">
      <use href={`#ic-${nome}`} />
    </svg>
  );
}

// Selo azul de Verificado (equipe oficial NITO LIVE): usar ao lado do nome
// do autor sempre que ehVerificado(autor.papel) for verdadeiro.
export function SeloVerificado({ tam = 15 }: { tam?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4, flexShrink: 0 }}
    >
      <title>Verificado</title>
      <path
        d="M12 2.5l2.4 1.4 2.7-.5 1.3 2.4 2.4 1.3-.5 2.7 1.4 2.4-1.4 2.4.5 2.7-2.4 1.3-1.3 2.4-2.7-.5-2.4 1.4-2.4-1.4-2.7.5-1.3-2.4-2.4-1.3.5-2.7L2.5 12l1.4-2.4-.5-2.7 2.4-1.3 1.3-2.4 2.7.5z"
        fill="#2b8bff"
      />
      <path
        d="M8.2 12.3l2.4 2.4 5.2-5.2"
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
