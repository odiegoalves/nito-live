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
