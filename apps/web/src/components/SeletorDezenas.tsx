"use client";
import { MAX_NUMERO, MIN_DEZENAS_JOGO, formatBRL, formatDezena, precoJogo, surpresinha } from "@bolao/shared";
import { useState } from "react";
import { aleatorio } from "@/lib/aleatorio";

interface Props {
  maxDezenas: number;
  precoSimples: number;
  /** Devolve true quando gravou (o seletor limpa). */
  onConfirmar: (dezenas: number[], surpresinha: boolean) => Promise<boolean>;
  rotuloConfirmar?: string;
}

/** Volante de 1 a 60 com quantidade de dezenas, preço e botão Surpresinha. */
export function SeletorDezenas({ maxDezenas, precoSimples, onConfirmar, rotuloConfirmar = "Incluir jogo" }: Props) {
  const [qtd, setQtd] = useState(MIN_DEZENAS_JOGO);
  const [marcadas, setMarcadas] = useState<number[]>([]);
  const [veioDaSurpresinha, setVeioDaSurpresinha] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const alternar = (n: number) => {
    setVeioDaSurpresinha(false);
    setMarcadas((m) => (m.includes(n) ? m.filter((x) => x !== n) : m.length < qtd ? [...m, n].sort((a, b) => a - b) : m));
  };
  const mudarQtd = (k: number) => {
    setQtd(k);
    setMarcadas((m) => m.slice(0, k));
  };
  const gerar = () => {
    setMarcadas(surpresinha(qtd, aleatorio));
    setVeioDaSurpresinha(true);
  };
  const confirmar = async () => {
    setEnviando(true);
    try {
      if (await onConfirmar(marcadas, veioDaSurpresinha)) {
        setMarcadas([]);
        setVeioDaSurpresinha(false);
      }
    } finally {
      setEnviando(false);
    }
  };

  const opcoes = Array.from({ length: maxDezenas - MIN_DEZENAS_JOGO + 1 }, (_, i) => i + MIN_DEZENAS_JOGO);
  const completo = marcadas.length === qtd;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="qtd-dezenas" className="label">
            Dezenas no jogo
          </label>
          <select id="qtd-dezenas" className="input !w-auto" value={qtd} onChange={(e) => mudarQtd(Number(e.target.value))}>
            {opcoes.map((k) => (
              <option key={k} value={k}>
                {k} dezenas · {formatBRL(precoJogo(k, precoSimples))}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-gold" onClick={gerar}>
          Surpresinha
        </button>
        {marcadas.length > 0 && (
          <button type="button" className="btn-ghost" onClick={() => (setMarcadas([]), setVeioDaSurpresinha(false))}>
            Limpar
          </button>
        )}
      </div>

      <div role="group" aria-label="Volante de 1 a 60" className="grid grid-cols-10 gap-1">
        {Array.from({ length: MAX_NUMERO }, (_, i) => i + 1).map((n) => {
          const on = marcadas.includes(n);
          const bloqueada = !on && completo;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              disabled={bloqueada}
              onClick={() => alternar(n)}
              className={`aspect-square rounded-lg text-xs font-semibold tabular-nums transition sm:text-sm ${
                on ? "bg-brand text-brand-fg" : "border border-line bg-card hover:bg-brand-soft disabled:opacity-35"
              }`}
            >
              {formatDezena(n)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {marcadas.length} de {qtd} escolhidas · <strong className="text-foreground">{formatBRL(precoJogo(qtd, precoSimples))}</strong>
        </p>
        <button type="button" className="btn" disabled={!completo || enviando} aria-busy={enviando} onClick={confirmar}>
          {enviando ? "Salvando…" : rotuloConfirmar}
        </button>
      </div>
    </div>
  );
}
