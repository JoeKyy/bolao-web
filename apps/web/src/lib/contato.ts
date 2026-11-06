/**
 * Regras de e-mail e WhatsApp, as mesmas da API (que confere de novo). Usadas como `pattern` dos
 * campos: o navegador só aceita `a@b` em type="email", então exigimos domínio com ponto.
 */
export const EMAIL_PATTERN = "[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}";

/** Telefone brasileiro: DDD + 8 dígitos (fixo) ou 9 + 8 dígitos (celular), com +55 e símbolos opcionais. */
export const WHATSAPP_PATTERN = "\\s*(\\+?55\\s*)?\\(?[1-9][1-9]\\)?\\s*(9\\s*)?\\d{4}[\\-\\s]?\\d{4}\\s*";
export const WHATSAPP_DICA = "Informe o WhatsApp com DDD, como (11) 91234-5678.";
export const EMAIL_DICA = "Informe um e-mail válido, como nome@exemplo.com.";

/**
 * Máscara enquanto digita: (11) 91234-5678. Aceita colar com +55 ou só dígitos. Dígitos a mais não são
 * descartados em silêncio: ficam no fim do campo e a validação aponta o erro.
 */
export function formatarWhatsapp(entrada: string): string {
  let d = entrada.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  const sobra = d.slice(11, 20);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = d.length === 11 ? 5 : 4; // celular: 5+4; fixo: 4+4
  return `(${ddd}) ${resto.slice(0, corte)}${resto.length > corte ? `-${resto.slice(corte)}` : ""}${sobra ? ` ${sobra}` : ""}`;
}
