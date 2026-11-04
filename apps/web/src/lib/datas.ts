export function formatarDataHora(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export const umEm = (n: number | null) => (n === null ? "sem jogos pagos ainda" : `1 em ${n.toLocaleString("pt-BR")}`);
