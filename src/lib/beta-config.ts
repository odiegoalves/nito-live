/**
 * NITO LIVE — AMBIENTE BETA PRIVADO
 * Configuração canônica da allowlist de acesso ao ambiente beta.
 * 
 * Regra: Nenhuma verificação de autorização beta deve depender de e-mails hardcoded
 * espalhados pelo código. Toda verificação deve utilizar a função `isBetaAuthorized`.
 */

export const NITO_COMMUNITY_BETA_ALLOWLIST: string[] = [
  "afiliadodiegoalves@gmail.com"
];

/**
 * Normaliza e valida se o e-mail informado tem permissão para acessar o ambiente beta.
 * Aplica `.trim().toLowerCase()` em ambas as pontas da comparação.
 */
export function isBetaAuthorized(email?: string | null): boolean {
  if (!email) return false;
  const normalizedInput = email.trim().toLowerCase();
  return NITO_COMMUNITY_BETA_ALLOWLIST.some(
    (allowedEmail) => allowedEmail.trim().toLowerCase() === normalizedInput
  );
}
