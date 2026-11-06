"use client";
import type { ResumoAdmin } from "@bolao/shared";
import { MAX_NUMERO, formatBRL, formatDezena } from "@bolao/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { Carregando, NaoEncontrado, ErroDeCarga } from "@/components/ui";
import { formatarDataHora } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";

/** Grade 1 a 60 como no volante, com as dezenas do jogo marcadas. */
function Volante({ dezenas }: { dezenas: number[] }) {
  const on = new Set(dezenas);
  return (
    <div className="grid grid-cols-10 gap-0.5" aria-hidden>
      {Array.from({ length: MAX_NUMERO }, (_, i) => i + 1).map((n) => (
        <span
          key={n}
          className={`flex h-5 items-center justify-center rounded text-[10px] tabular-nums ${on.has(n) ? "bg-black font-bold text-white" : "border border-gray-300 text-gray-400"}`}
        >
          {formatDezena(n)}
        </span>
      ))}
    </div>
  );
}

/** Folha para levar à lotérica (ou copiar no volante). Imprime ou salva em PDF pelo navegador. */
export default function Imprimir() {
  const { id } = useParams<{ id: string }>();
  const base = `/boloes/${encodeURIComponent(id)}`;
  const { dados: r, erro, carregando, recarregar } = useRecurso<ResumoAdmin>(base);
  const router = useRouter();
  // Só o organizador (tesoureiro) chega aqui: sem sessão, vai para o login.
  useEffect(() => {
    if (erro?.status === 401) router.replace("/admin");
  }, [erro, router]);
  const [filtro, setFiltro] = useState<"pagos" | "todos">("pagos");
  if (carregando || erro?.status === 401) return <Carregando />;
  if (erro?.status === 404) return <NaoEncontrado />;
  if (erro || !r) return <main className="mx-auto max-w-md px-4 py-10"><ErroDeCarga mensagem={erro?.message ?? "Erro"} tentar={recarregar} /></main>;

  const quitado = new Set(r.participantes.filter((p) => p.situacao === "quitado").map((p) => p.id));
  const jogos = r.jogos.filter((j) => (filtro === "pagos" ? quitado.has(j.participanteId) && !j.registrado : true));
  const total = jogos.reduce((s, j) => s + j.preco, 0);

  return (
    <main className="mx-auto max-w-3xl tema-claro space-y-4 bg-white px-4 py-6 text-black">
      <div className="nao-imprimir flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/${id}`} className="text-sm font-semibold text-brand">
          ← Voltar
        </Link>
        <div className="flex items-center gap-3">
          <select aria-label="Quais jogos" className="input !w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value as "pagos" | "todos")}>
            <option value="pagos">Pagos e não registrados</option>
            <option value="todos">Todos os jogos</option>
          </select>
          <button type="button" className="btn" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>
      </div>
      <header className="border-b border-black pb-2">
        <h1 className="text-xl font-bold">
          {r.bolao.nome} · {r.bolao.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
          {r.bolao.concurso ? ` · concurso ${r.bolao.concurso}` : ""}
        </h1>
        <p className="text-sm">
          {jogos.length} jogo(s) · total {formatBRL(total)}
          {r.bolao.dataSorteio ? ` · sorteio ${formatarDataHora(r.bolao.dataSorteio)}` : ""}
        </p>
      </header>
      <ol className="grid gap-3 sm:grid-cols-2">
        {jogos.map((j, i) => (
          <li key={j.id} className="quebra space-y-2 rounded-lg border border-gray-400 p-3">
            <div className="flex justify-between text-sm">
              <strong>Jogo {i + 1}</strong>
              <span>
                {j.dezenas.length} dezenas · {formatBRL(j.preco)}
              </span>
            </div>
            <p className="font-mono text-xl font-bold tracking-wider">{j.dezenas.map(formatDezena).join("  ")}</p>
            <Volante dezenas={j.dezenas} />
          </li>
        ))}
      </ol>
    </main>
  );
}
