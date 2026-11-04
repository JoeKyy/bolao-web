"use client";
import { formatDezena } from "@bolao/shared";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export function Aviso({ erro, ok }: { erro?: string | null; ok?: string | null }) {
  if (!erro && !ok) return null;
  return (
    <div
      role={erro ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
        erro ? "border-red-200 bg-red-50 text-red-800" : "border-brand/30 bg-brand-soft text-brand-dark"
      }`}
    >
      {erro ?? ok}
    </div>
  );
}

export function Carregando() {
  return <p className="py-10 text-center text-sm text-muted">Carregando…</p>;
}

export function ErroDeCarga({ mensagem, tentar }: { mensagem: string; tentar: () => void }) {
  return (
    <div className="card space-y-3 text-center">
      <p className="text-sm text-red-800">{mensagem}</p>
      <button type="button" className="btn-ghost" onClick={tentar}>
        Tentar de novo
      </button>
    </div>
  );
}

export function Bolinha({ n, acerto = false, tamanho = "md" }: { n: number; acerto?: boolean; tamanho?: "sm" | "md" | "lg" }) {
  const dim = tamanho === "sm" ? "h-7 w-7 text-xs" : tamanho === "lg" ? "h-14 w-14 text-2xl" : "h-9 w-9 text-sm";
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full font-semibold tabular-nums ${
        acerto ? "bg-brand text-white ring-2 ring-brand/30" : "border border-line bg-white text-foreground"
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
    <div className="flex flex-wrap gap-1.5">
      {dezenas.map((n) => (
        <Bolinha key={n} n={n} acerto={set.has(n)} tamanho={tamanho} />
      ))}
    </div>
  );
}

export function BotaoCopiar({ texto, rotulo = "Copiar", classe = "btn" }: { texto: string; rotulo?: string; classe?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copie o texto:", texto);
    }
  }
  return (
    <button type="button" onClick={copiar} className={classe}>
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}

export function Secao({ titulo, children, acao, id }: { titulo: string; children: ReactNode; acao?: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-lg font-semibold">
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

const ESTILO_SITUACAO = {
  quitado: "bg-brand-soft text-brand-dark",
  parcial: "bg-amber-100 text-amber-800",
  pendente: "bg-amber-100 text-amber-800",
} as const;
const TEXTO_SITUACAO = { quitado: "Pago", parcial: "Pagou parte", pendente: "Pendente" } as const;

export function SeloSituacao({ situacao }: { situacao: keyof typeof ESTILO_SITUACAO }) {
  return <span className={`chip ${ESTILO_SITUACAO[situacao]}`}>{TEXTO_SITUACAO[situacao]}</span>;
}

export function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="card !p-3 text-center">
      <p className="text-xs text-muted">{rotulo}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums sm:text-lg">{valor}</p>
    </div>
  );
}

/** Bolão de outro organizador ou inexistente: mesma resposta, sem revelar qual. */
export function NaoEncontrado() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-10 text-center">
      <p className="text-sm text-muted">Bolão não encontrado. Ele não existe ou não é um dos seus.</p>
      <Link href="/admin" className="btn-ghost">
        Ver meus bolões
      </Link>
    </main>
  );
}
