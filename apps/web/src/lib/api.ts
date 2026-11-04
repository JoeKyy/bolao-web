import type { ErroApi } from "@bolao/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/** Erro vindo da API. `mensagem` é texto fixo do servidor; mostre sempre como texto. */
export class ErroDaApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(API_URL + caminho, {
      method: metodo,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
        // Cabeçalho exigido pela API em toda escrita (proteção contra CSRF).
        ...(metodo !== "GET" ? { "X-Bolao": "1" } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroDaApi(0, "rede", "Sem conexão com o servidor. Confira a internet e tente de novo.");
  }
  if (r.status === 204) return undefined as T;
  const texto = await r.text();
  const dados: unknown = texto ? JSON.parse(texto) : undefined;
  if (!r.ok) {
    const e = dados as Partial<ErroApi> | undefined;
    throw new ErroDaApi(r.status, e?.codigo ?? "erro", typeof e?.mensagem === "string" ? e.mensagem : "Não foi possível concluir.");
  }
  return dados as T;
}

export const api = {
  get: <T>(c: string) => chamar<T>("GET", c),
  post: <T = void>(c: string, corpo: unknown = {}) => chamar<T>("POST", c, corpo),
  patch: <T = void>(c: string, corpo: unknown) => chamar<T>("PATCH", c, corpo),
  del: <T = void>(c: string) => chamar<T>("DELETE", c),
};

export const mensagemDe = (e: unknown) => (e instanceof ErroDaApi ? e.message : "Algo deu errado. Tente de novo.");
