// =============================================================================
// NITO LIVE - patentes e XP.
// O banco ja guarda `nivel` e `xp` em `perfis`. Aqui fica so a traducao
// desses numeros para o que o membro ve na tela.
// =============================================================================

export interface Patente {
  nome: string;
  romano: string;
  nivelMin: number;
  nivelMax: number;
  cor: "r" | "c" | "g" | "v";
}

export const PATENTES: Patente[] = [
  { nome: "Iniciante", romano: "I", nivelMin: 1, nivelMax: 4, cor: "c" },
  { nome: "Vendedor", romano: "II", nivelMin: 5, nivelMax: 9, cor: "c" },
  { nome: "Operador", romano: "III", nivelMin: 10, nivelMax: 19, cor: "c" },
  { nome: "Estrategista", romano: "IV", nivelMin: 20, nivelMax: 34, cor: "g" },
  { nome: "Mestre da Live", romano: "V", nivelMin: 35, nivelMax: 49, cor: "v" },
  { nome: "Lenda NITO", romano: "VI", nivelMin: 50, nivelMax: 9999, cor: "r" },
];

export function patenteDoNivel(nivel: number): Patente {
  return PATENTES.find((p) => nivel >= p.nivelMin && nivel <= p.nivelMax) ?? PATENTES[0];
}

// Cada nivel custa 500 XP a mais que o anterior: 1000, 1500, 2000...
export function xpDoNivel(nivel: number): number {
  return 1000 + (nivel - 1) * 500;
}

export function progressoNoNivel(nivel: number, xp: number) {
  const meta = xpDoNivel(nivel);
  const atual = Math.max(0, Math.min(xp, meta));
  return { atual, meta, percentual: meta > 0 ? Math.round((atual / meta) * 100) : 0 };
}

export function proximaPatente(nivel: number): Patente | null {
  const atual = patenteDoNivel(nivel);
  const i = PATENTES.indexOf(atual);
  return i >= 0 && i < PATENTES.length - 1 ? PATENTES[i + 1] : null;
}

// Quantos dias faltam para a assinatura vencer. null quando nao ha data.
export function diasRestantes(expiraEm?: string | null): number | null {
  if (!expiraEm) return null;
  const fim = new Date(expiraEm).getTime();
  if (!Number.isFinite(fim)) return null;
  return Math.max(0, Math.ceil((fim - Date.now()) / 86400000));
}

export function saudacao(agora = new Date()): string {
  const h = agora.getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function iniciais(nome?: string): string {
  const limpo = (nome ?? "").trim();
  if (!limpo) return "?";
  return limpo[0].toUpperCase();
}
