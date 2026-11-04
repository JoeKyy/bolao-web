"use client";
import type { ResumoAdmin } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { Aviso, Bolinha, Carregando, ErroDeCarga, SeloSituacao } from "@/components/ui";
import { api, comConfirmacao, mensagemDe } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";

/** Um jogo por tela, com dezenas grandes, para digitar no app Loterias Caixa e marcar como registrado. */
export default function Digitar() {
  const { id } = useParams<{ id: string }>();
  const base = `/boloes/${encodeURIComponent(id)}`;
  const { dados: r, erro, carregando, recarregar } = useRecurso<ResumoAdmin>(base);
  const router = useRouter();
  // Só o organizador (tesoureiro) chega aqui: sem sessão, vai para o login.
  useEffect(() => {
    if (erro?.status === 401) router.replace("/admin");
  }, [erro, router]);
  const [i, setI] = useState(0);
  const [soPendentes, setSoPendentes] = useState(true);
  const [comprovante, setComprovante] = useState("");
  const [aviso, setAviso] = useState<{ erro?: string; ok?: string }>({});

  if (carregando || erro?.status === 401) return <Carregando />;
  if (erro || !r) return <main className="mx-auto max-w-md px-4 py-10"><ErroDeCarga mensagem={erro?.message ?? "Erro"} tentar={recarregar} /></main>;

  const dono = new Map(r.participantes.map((p) => [p.id, p]));
  // Pagos primeiro: são os que devem ser registrados.
  const fila = r.jogos
    .filter((j) => (soPendentes ? !j.registrado : true))
    .sort((a, b) => Number(dono.get(b.participanteId)?.situacao === "quitado") - Number(dono.get(a.participanteId)?.situacao === "quitado") || a.id - b.id);
  const atual = fila[Math.min(i, Math.max(0, fila.length - 1))];
  const p = atual ? dono.get(atual.participanteId) : undefined;

  async function marcar(registrado: boolean) {
    if (!atual) return;
    try {
      const feito = await comConfirmacao((q) => api.post(`${base}/jogos/${atual.id}/registro${q}`, { registrado, comprovante: comprovante || null }).then(() => true));
      if (!feito) return;
      setComprovante("");
      setAviso({ ok: registrado ? "Registrado. Próximo jogo." : "Registro desfeito." });
      if (!soPendentes) setI((x) => Math.min(x + 1, fila.length - 1));
      await recarregar();
    } catch (e) {
      setAviso({ erro: mensagemDe(e) });
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href={`/admin/${id}`} className="text-sm font-semibold text-brand">
          ← Voltar
        </Link>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soPendentes} onChange={(e) => (setSoPendentes(e.target.checked), setI(0))} /> Só não registrados
        </label>
      </div>
      <h1 className="text-xl font-bold">Modo digitação</h1>
      <p className="text-sm text-muted">
        Abra o app Loterias Caixa ao lado, digite as dezenas e marque aqui. {r.totais.jogosRegistrados} de {r.totais.jogos} registrados.
      </p>
      <Aviso erro={aviso.erro} ok={aviso.ok} />
      {!atual ? (
        <div className="card text-center text-sm">Nenhum jogo {soPendentes ? "pendente de registro" : ""}. 🎉</div>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              Jogo {Math.min(i, fila.length - 1) + 1} de {fila.length}
            </span>
            <span className="text-muted">
              {atual.dezenas.length} dezenas · {formatBRL(atual.preco)}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2" aria-label="Dezenas do jogo">
            {atual.dezenas.map((n) => (
              <Bolinha key={n} n={n} tamanho="lg" />
            ))}
          </div>
          {p && (
            <div className="flex items-center justify-between rounded-xl bg-background p-3 text-sm">
              <span>
                De <strong>{p.nome}</strong>
              </span>
              <SeloSituacao situacao={p.situacao} />
            </div>
          )}
          {p && p.situacao !== "quitado" && <Aviso erro="Este participante ainda não pagou tudo. Confirme antes de registrar." />}
          {atual.registrado ? (
            <button type="button" className="btn-ghost w-full" onClick={() => marcar(false)}>
              Desfazer registro{atual.comprovante ? ` (${atual.comprovante})` : ""}
            </button>
          ) : (
            <>
              <input aria-label="Comprovante ou número da aposta (opcional)" placeholder="Comprovante / nº da aposta (opcional)" maxLength={80} className="input" value={comprovante} onChange={(e) => setComprovante(e.target.value)} />
              <button type="button" className="btn w-full !min-h-12 text-base" onClick={() => marcar(true)}>
                Registrei na Caixa
              </button>
            </>
          )}
          <div className="flex justify-between">
            <button type="button" className="btn-ghost" disabled={i === 0} onClick={() => setI((x) => Math.max(0, x - 1))}>
              Anterior
            </button>
            <button type="button" className="btn-ghost" disabled={i >= fila.length - 1} onClick={() => setI((x) => Math.min(fila.length - 1, x + 1))}>
              Pular
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
