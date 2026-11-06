"use client";
import { formatDezena } from "@bolao/shared";
import Link from "next/link";
import { variante } from "@/lib/erros";
import { Casca } from "./Casca";
import { cloneElement, useEffect, useState, type ChangeEvent, type ReactElement, type ReactNode } from "react";

export function Aviso({ erro, ok }: { erro?: string | null; ok?: string | null }) {
  if (!erro && !ok) return null;
  return (
    <div
      role={erro ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
        erro ? "border-danger-line bg-danger-soft text-danger-fg" : "border-brand/30 bg-brand-soft text-brand-dark"
      }`}
    >
      {erro ?? ok}
    </div>
  );
}

type Controle = ReactElement<{ className?: string; required?: boolean; onChange?: (e: ChangeEvent<never>) => void }>;

/**
 * Rótulo + controle + dica + motivo do erro, ligados por aria (leitor de tela anuncia o erro).
 * O controle recebe `id`, `aria-invalid` e borda vermelha quando há erro, que some ao digitar.
 */
export function Campo({
  id,
  rotulo,
  erro,
  dica,
  limpar,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  limpar?: (id: string) => void;
  children: Controle;
}) {
  const filho = cloneElement(children, {
    id,
    "aria-invalid": erro ? true : undefined,
    "aria-describedby": [erro ? `${id}-erro` : "", dica ? `${id}-dica` : ""].filter(Boolean).join(" ") || undefined,
    className: `${children.props.className ?? "input"}${erro ? " input-erro" : ""}`,
    onChange: (e: ChangeEvent<never>) => {
      children.props.onChange?.(e);
      if (erro) limpar?.(id);
    },
  } as object);
  return (
    <div>
      <label htmlFor={id} className="label">
        {rotulo}
        {children.props.required && (
          <span aria-hidden="true" className="ml-0.5 text-danger-fg">
            *
          </span>
        )}
      </label>
      {filho}
      {dica && !erro && (
        <p id={`${id}-dica`} className="mt-1 text-xs text-muted">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1 text-xs font-semibold text-danger-fg">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Bloco cinza pulsante que ocupa o lugar do conteúdo enquanto ele chega. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulsar rounded-controle bg-surface-2 ${className}`} />;
}

export function EsqueletoCartao({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="card space-y-3" aria-hidden="true">
      <Esqueleto className="h-5 w-2/5" />
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto key={i} className={`h-4 ${i === linhas - 1 ? "w-3/5" : "w-full"}`} />
      ))}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-4 w-4 animate-girar rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

/** Dentro de uma tela já montada (seção, lista): esqueleto no formato de cartões. */
export function Carregando({ cartoes = 2 }: { cartoes?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Carregando…</span>
      {Array.from({ length: cartoes }, (_, i) => (
        <EsqueletoCartao key={i} />
      ))}
    </div>
  );
}

/** Tela inteira ainda sem dados: mantém a casca (marca) e mostra a silhueta da página. */
export function CarregandoPagina({ largura = "media", forma = "painel" }: { largura?: "estreita" | "media" | "larga"; forma?: "painel" | "formulario" }) {
  return (
    <Casca largura={largura} centro={forma === "formulario"}>
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
        <span className="sr-only">Carregando…</span>
        <div aria-hidden="true" className="space-y-2">
          <Esqueleto className="h-4 w-24" />
          <Esqueleto className="h-8 w-3/4" />
        </div>
        {forma === "painel" ? (
          <>
            <div aria-hidden="true" className="grid grid-cols-3 gap-3">
              <Esqueleto className="h-16" />
              <Esqueleto className="h-16" />
              <Esqueleto className="h-16" />
            </div>
            <EsqueletoCartao linhas={4} />
            <EsqueletoCartao />
          </>
        ) : (
          <EsqueletoCartao linhas={4} />
        )}
      </div>
    </Casca>
  );
}

/**
 * Falha de carga na tela: ícone, o que houve, o que fazer e uma ação. A mensagem da API é fixa
 * (nunca repete o que foi digitado) e aparece como detalhe.
 */
export function ErroDeCarga({
  mensagem,
  tentar,
  status,
  voltar,
}: {
  mensagem?: string;
  tentar?: () => void;
  status?: number;
  voltar?: { href: string; rotulo: string };
}) {
  const v = variante(status);
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-danger-soft text-danger-fg">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={v.icone} />
        </svg>
      </span>
      <div className="space-y-1">
        <h2 className="titulo-2">{v.titulo}</h2>
        <p className="text-muted">{v.dica}</p>
        {mensagem && status !== 0 && <p className="legenda">{mensagem}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {tentar && (
          <button type="button" className="btn" onClick={tentar}>
            Tentar de novo
          </button>
        )}
        {voltar && (
          <Link href={voltar.href} className="btn-ghost">
            {voltar.rotulo}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Nada para mostrar ainda: explica o motivo e oferece o próximo passo. */
export function EstadoVazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-cartao border border-dashed border-line px-4 py-8 text-center">
      <p className="titulo-3">{titulo}</p>
      {texto && <p className="text-muted">{texto}</p>}
      {acao && <div className="pt-1">{acao}</div>}
    </div>
  );
}

/**
 * Retorno de uma ação (salvou, deu erro) que acompanha a tela rolada: fixo no rodapé, anunciado
 * por leitor de tela. Sucesso some sozinho; erro fica até ser fechado. Recebe o objeto do estado,
 * então repetir a mesma mensagem mostra de novo.
 */
export function Toast({ aviso }: { aviso: { erro?: string; ok?: string } }) {
  const [fechado, setFechado] = useState<object | null>(null);
  const msg = aviso.erro ?? aviso.ok;
  useEffect(() => {
    if (!aviso.ok || aviso.erro) return;
    const t = setTimeout(() => setFechado(aviso), 6000);
    return () => clearTimeout(t);
  }, [aviso]);
  if (!msg || fechado === aviso) return null;
  const erro = Boolean(aviso.erro);
  return (
    <div className="nao-imprimir pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role={erro ? "alert" : "status"}
        className={`pointer-events-auto flex w-full max-w-md animate-entrar items-start gap-3 rounded-cartao border px-4 py-3 text-body font-medium shadow-float ${
          erro ? "border-danger-line bg-danger-soft text-danger-fg" : "border-success-line bg-success-soft text-success-fg"
        }`}
      >
        <span className="flex-1">{msg}</span>
        <button type="button" onClick={() => setFechado(aviso)} aria-label="Fechar aviso" className="-m-1 rounded p-1 opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  );
}

export function Bolinha({ n, acerto = false, tamanho = "md" }: { n: number; acerto?: boolean; tamanho?: "sm" | "md" | "lg" }) {
  const dim = tamanho === "sm" ? "h-9 w-9 text-body" : tamanho === "lg" ? "h-16 w-16 text-h1" : "h-11 w-11 text-h3";
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full font-semibold tabular-nums ${
        acerto ? "bg-brand text-brand-fg ring-2 ring-brand/30" : "bg-card text-foreground ring-1 ring-line"
      }`}
      aria-label={acerto ? `${n}, acerto` : String(n)}
    >
      {formatDezena(n)}
    </span>
  );
}

export function Dezenas({ dezenas, acertos, tamanho }: { dezenas: number[]; acertos?: number[]; tamanho?: "sm" | "md" | "lg" }) {
  const set = new Set(acertos ?? []);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2.5">
      {dezenas.map((n) => (
        <Bolinha key={n} n={n} acerto={set.has(n)} tamanho={tamanho} />
      ))}
    </div>
  );
}

export function BotaoCopiar({ texto, rotulo = "Copiar", classe = "btn" }: { texto: string; rotulo?: string; classe?: string }) {
  const [copiado, setCopiado] = useState(false);
  const [manual, setManual] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setManual(true);
    }
  }
  return (
    <>
      <button type="button" onClick={copiar} className={classe}>
        {copiado ? "Copiado!" : rotulo}
      </button>
      {manual && (
        <input
          readOnly
          aria-label="Texto para copiar"
          value={texto}
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
          className="input mt-2 font-mono text-caption"
        />
      )}
    </>
  );
}

export function Secao({ titulo, children, acao, id }: { titulo: string; children: ReactNode; acao?: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="titulo-2">
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

const ESTILO_SITUACAO = {
  quitado: "chip-success",
  parcial: "chip-warning",
  pendente: "chip-warning",
} as const;
const TEXTO_SITUACAO = { quitado: "Pago", parcial: "Pagou parte", pendente: "Pendente" } as const;

export function SeloSituacao({ situacao }: { situacao: keyof typeof ESTILO_SITUACAO }) {
  return <span className={`chip ${ESTILO_SITUACAO[situacao]}`}>{TEXTO_SITUACAO[situacao]}</span>;
}

export function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-cartao bg-brand-soft px-3 py-4 text-center">
      <p className="legenda text-brand-dark/80">{rotulo}</p>
      <p className="mt-1 text-h2 font-bold tabular-nums text-brand-dark">{valor}</p>
    </div>
  );
}

/** Bolão de outro organizador ou inexistente: mesma resposta, sem revelar qual. */
export function NaoEncontrado() {
  return (
    <Casca largura="estreita">
      <ErroDeCarga status={404} mensagem="Bolão não encontrado. Ele não existe ou não é um dos seus." voltar={{ href: "/admin", rotulo: "Ver meus bolões" }} />
    </Casca>
  );
}
