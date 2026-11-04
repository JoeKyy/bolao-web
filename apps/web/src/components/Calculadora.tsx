"use client";
import { formatBRL, parseReais, parteHipotetica } from "@bolao/shared";
import { useState } from "react";
import { umEm } from "@/lib/datas";

interface Props {
  estimativa: number | null;
  meuPeso: number;
  pesoTotal: number;
  chanceUmEm: number | null;
  /** Peso se a pessoa ainda não pagou: o que ela deve (para simular). */
  pesoSimulado?: number;
  /** A Virada não acumula; concurso normal acumula (BAUD-11). */
  virada: boolean;
}

/** "Quanto eu ganho se o bolão acertar?" Simulação, não promessa. */
export function Calculadora({ estimativa, meuPeso, pesoTotal, chanceUmEm, pesoSimulado, virada }: Props) {
  const [premioTxt, setPremioTxt] = useState(estimativa ? (estimativa / 100).toLocaleString("pt-BR") : "");
  const [ganhadores, setGanhadores] = useState(1);
  const premio = parseReais(premioTxt) ?? 0;
  const simulado = meuPeso === 0 && !!pesoSimulado;
  const peso = meuPeso || pesoSimulado || 0;
  const total = simulado ? pesoTotal + peso : pesoTotal;
  const parte = parteHipotetica(Math.floor(premio / Math.max(1, ganhadores)), peso, total);
  const pct = total > 0 ? (peso / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="calc-premio" className="label">
            Prêmio da sena (R$)
          </label>
          <input id="calc-premio" inputMode="decimal" className="input" value={premioTxt} onChange={(e) => setPremioTxt(e.target.value)} />
        </div>
        <div>
          <label htmlFor="calc-ganhadores" className="label">
            Apostas ganhadoras no Brasil
          </label>
          <input
            id="calc-ganhadores"
            type="number"
            min={1}
            max={1000}
            className="input"
            value={ganhadores}
            onChange={(e) => setGanhadores(Math.min(1000, Math.max(1, Math.trunc(Number(e.target.value) || 1))))}
          />
        </div>
      </div>
      <div className="rounded-xl bg-brand-soft p-4">
        <p className="text-sm text-brand-dark">
          {peso > 0 ? (
            <>
              Sua participação: <strong>{formatBRL(peso)}</strong> de {formatBRL(total)} ({pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% do bolão)
              {simulado && " (contando como se já estivesse pago)"}
            </>
          ) : (
            "Inclua um jogo para ver a sua parte."
          )}
        </p>
        <p className="mt-1 text-2xl font-bold text-brand-dark tabular-nums">{formatBRL(parte)}</p>
        <p className="text-xs text-brand-dark/80">
          se o bolão fizer a sena{ganhadores > 1 ? ` e dividir com mais ${ganhadores - 1} aposta(s)` : " sozinho"}
        </p>
      </div>
      <p className="text-xs text-muted">
        Chance do bolão fazer a sena: <strong>{umEm(chanceUmEm)}</strong>. É simulação: {virada ? "a Mega da Virada não acumula (sem ganhador da sena, o prêmio desce para a quina)" : "se ninguém acertar a sena o prêmio acumula para o próximo concurso"}, e o prêmio real
        depende de quantos acertarem. Aposte só o que pode perder.
      </p>
    </div>
  );
}
