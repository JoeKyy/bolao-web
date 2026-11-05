import type { ErroApi } from "@bolao/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/** Erro vindo da API. `mensagem` é texto fixo do servidor; mostre sempre como texto. */
export class ErroDaApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
    /** Motivo por campo, quando a API recusa a validação (`entrada_invalida`). */
    public readonly campos?: Record<string, string>,
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
    throw new ErroDaApi(r.status, e?.codigo ?? "erro", typeof e?.mensagem === "string" ? e.mensagem : "Não foi possível concluir.", e?.campos);
  }
  return dados as T;
}

export const api = {
  get: <T>(c: string) => chamar<T>("GET", c),
  post: <T = void>(c: string, corpo: unknown = {}) => chamar<T>("POST", c, corpo),
  patch: <T = void>(c: string, corpo: unknown) => chamar<T>("PATCH", c, corpo),
  del: <T = void>(c: string) => chamar<T>("DELETE", c),
};

/** Nome do campo da API como o usuário o conhece. */
export const ROTULOS: Record<string, string> = {
  nome: "Nome",
  email: "E-mail",
  senha: "Senha",
  senhaNova: "Nova senha",
  senhaAtual: "Senha atual",
  whatsapp: "WhatsApp",
  dataSorteio: "Data do sorteio",
  concurso: "Concurso",
  precoSimples: "Preço da aposta simples",
  maxDezenasParticipante: "Máximo de dezenas por participante",
  maxParticipantes: "Máximo de participantes",
  instrucoes: "Instruções",
  pixChave: "Chave Pix",
  pixNome: "Nome do recebedor do Pix",
  pixCidade: "Cidade do Pix",
  dezenas: "Dezenas",
  codigo: "Código",
  tipo: "Tipo",
};

/** Texto do aviso: com `campos`, diz qual campo e por quê ("Nome: use pelo menos 2 caracteres."). */
export const mensagemDe = (e: unknown) => {
  if (!(e instanceof ErroDaApi)) return "Algo deu errado. Tente de novo.";
  const linhas = Object.entries(e.campos ?? {}).map(([k, m]) => (k === "_" ? m : `${ROTULOS[k] ?? "Campo"}: ${m}`));
  return linhas.length ? linhas.join(" ") : e.message;
};

/**
 * Bolão travado (sorteio passou ou resultado lançado): a API recusa com `bolao_travado` o que
 * mexe no rateio. Aqui o organizador confirma e a chamada é repetida com `?confirmar=1`.
 * Devolve undefined se ele desistir.
 */
export async function comConfirmacao<T>(fazer: (sufixo: string) => Promise<T>): Promise<T | undefined> {
  try {
    return await fazer("");
  } catch (e) {
    if (e instanceof ErroDaApi && e.codigo === "bolao_travado") {
      if (!window.confirm(`${e.message}\n\nContinuar?`)) return undefined;
      return await fazer("?confirmar=1");
    }
    throw e;
  }
}
