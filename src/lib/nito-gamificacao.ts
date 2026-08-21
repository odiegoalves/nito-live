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

// XP TOTAL acumulado necessario para chegar ao nivel N.
// Mesma formula do banco (fn_nivel_do_xp): 250 * (N-1) * (N+2).
//   nivel 2 = 1.000 XP | nivel 3 = 2.500 | nivel 4 = 4.500 | nivel 8 = 17.500
export function xpParaNivel(nivel: number): number {
  const n = Math.max(1, Math.floor(nivel));
  return 250 * (n - 1) * (n + 2);
}

export function nivelDoXp(xp: number): number {
  const t = Math.max(0, xp) / 250;
  return Math.max(1, Math.floor((-1 + Math.sqrt(1 + 4 * (t + 2))) / 2));
}

// Progresso DENTRO do nivel atual, para desenhar a barra.
export function progressoNoNivel(nivel: number, xpTotal: number) {
  const base = xpParaNivel(nivel);
  const proximo = xpParaNivel(nivel + 1);
  const faixa = Math.max(1, proximo - base);
  const dentro = Math.max(0, Math.min(xpTotal - base, faixa));
  return {
    atual: dentro,
    meta: faixa,
    total: Math.max(0, xpTotal),
    proximoNivel: proximo,
    percentual: Math.round((dentro / faixa) * 100),
  };
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

// Selo de Verificado: fundador e moderador sao a equipe oficial do NITO LIVE.
export function ehVerificado(papel?: string | null): boolean {
  return papel === "fundador" || papel === "moderador";
}
