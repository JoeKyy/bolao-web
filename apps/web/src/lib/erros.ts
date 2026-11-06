/** Texto e ícone da tela de erro conforme o status HTTP (0 = sem rede). */
const ICONE = {
  rede: "M3 3l18 18M8.5 8.8A9 9 0 003 12m4.5 2.5a5 5 0 017.4-.4M12 19h.01M10.7 5.1A9 9 0 0121 12m-3.5 2.5",
  cadeado: "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z",
  busca: "M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z",
  alerta: "M12 9v4m0 4h.01M10.3 4.3L2.7 18a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z",
} as const;

export function variante(status?: number) {
  if (status === 0) return { icone: ICONE.rede, titulo: "Sem conexão", dica: "Confira a internet e tente de novo." };
  if (status === 401) return { icone: ICONE.cadeado, titulo: "Sua sessão acabou", dica: "Entre de novo para continuar." };
  if (status === 403) return { icone: ICONE.cadeado, titulo: "Sem permissão", dica: "Sua conta não tem acesso a esta área." };
  if (status === 404) return { icone: ICONE.busca, titulo: "Não encontrado", dica: "O endereço pode ter mudado ou não existir mais." };
  if (status === 429) return { icone: ICONE.alerta, titulo: "Muitas tentativas", dica: "Aguarde um pouco antes de tentar de novo." };
  if (status !== undefined && status >= 500) return { icone: ICONE.alerta, titulo: "Estamos com instabilidade", dica: "O erro é nosso. Tente de novo em instantes." };
  return { icone: ICONE.alerta, titulo: "Algo deu errado", dica: "Tente de novo. Se continuar, avise o organizador." };
}
