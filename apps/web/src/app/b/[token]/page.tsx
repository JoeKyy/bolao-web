"use client";
import type { PainelParticipante } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calculadora } from "@/components/Calculadora";
import { PixCard } from "@/components/PixCard";
import { SeletorDezenas } from "@/components/SeletorDezenas";
import { Aviso, Toast, CarregandoPagina, Dezenas, ErroDeCarga, Numero, Secao, SeloSituacao } from "@/components/ui";
import { ErroDaApi, api, mensagemDe } from "@/lib/api";
import { formatarDataHora } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";
import { Casca } from "@/components/Casca";

const FAIXA = { sena: "Sena", quina: "Quina", quadra: "Quadra" } as const;

export default function PainelBolao() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const base = `/convites/${encodeURIComponent(token)}`;
  const { dados: p, erro, carregando, recarregar } = useRecurso<PainelParticipante>(`${base}/painel`);
  const [aviso, setAviso] = useState<{ erro?: string; ok?: string }>({});

  useEffect(() => {
    if (erro?.status === 401) router.replace(`/entrar/${encodeURIComponent(token)}`);
  }, [erro, router, token]);

  if (carregando) return <CarregandoPagina />;
  if (erro && erro.status !== 401) {
    return (
      <Casca>
        {erro.status === 404 ? <Aviso erro="Este convite não existe ou foi trocado. Peça o link novo ao organizador." /> : <ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} />}
      </Casca>
    );
  }
  if (!p) return null;

  const { bolao: b, eu } = p;
  const temResultado = !!b.resultado;

  async function incluir(dezenas: number[], surpresinha: boolean) {
    try {
      await api.post(`${base}/jogos`, { dezenas, surpresinha });
      setAviso({ ok: "Jogo incluído. Lembre de pagar a diferença pelo Pix." });
      await recarregar();
      return true;
    } catch (e) {
      setAviso({ erro: mensagemDe(e) });
      return false;
    }
  }
  async function guardarNaConta() {
    try {
      await api.post(`${base}/vincular`);
      setAviso({ ok: "Bolão guardado na sua conta." });
      await recarregar();
    } catch (e) {
      if (e instanceof ErroDaApi && e.status === 401) {
        router.push("/admin");
        return;
      }
      setAviso({ erro: mensagemDe(e) });
    }
  }
  async function remover(id: number) {
    if (!window.confirm("Remover este jogo?")) return;
    try {
      await api.del(`${base}/jogos/${id}`);
      setAviso({ ok: "Jogo removido." });
      await recarregar();
    } catch (e) {
      setAviso({ erro: mensagemDe(e) });
    }
  }

  return (
    <Casca>
      {p.visaoOrganizador && (
        <div className="nao-imprimir flex items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-2 text-sm text-background">
          <span>Você está vendo como participante.</span>
          <Link className="underline" href={`/admin/${b.id}`}>
            Voltar à gestão
          </Link>
        </div>
      )}
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {b.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
          {b.concurso ? ` · Concurso ${b.concurso}` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{b.nome}</h1>
        {b.dataSorteio && <p className="mt-1 text-sm text-muted">Sorteio em {formatarDataHora(b.dataSorteio)}</p>}
      </header>

      <Toast aviso={aviso} />

      {p.acesso === "aparelho" && (
        <div className="nao-imprimir space-y-2 rounded-xl border border-line bg-card p-3 text-sm">
          <p>
            Você está vendo este bolão só neste aparelho. Entre na sua conta e guarde o bolão nela para ver em qualquer lugar.
          </p>
          <button type="button" className="btn-ghost" onClick={guardarNaConta}>
            Guardar na minha conta
          </button>
        </div>
      )}
      {eu && (
        <section aria-labelledby="minha" className="card space-y-3 !border-brand/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="minha" className="text-lg font-semibold">
                Olá, {eu.nome.split(" ")[0]}!
              </h2>
              <p className="text-sm text-muted">
                {p.meusJogos.length} jogo{p.meusJogos.length === 1 ? "" : "s"} · {formatBRL(eu.devido)} · pago {formatBRL(eu.pago)}
              </p>
            </div>
            <SeloSituacao situacao={eu.situacao} />
          </div>
          {p.pix && <PixCard pix={p.pix} />}
          {!p.pix && eu.devido > eu.pago && (
            <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning-fg">
              Falta pagar <strong>{formatBRL(eu.devido - eu.pago)}</strong>. {b.instrucoes || "Combine o pagamento com o organizador."}
            </p>
          )}
          {temResultado && eu.parte !== null && (
            <p className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">Sua parte do prêmio: {formatBRL(eu.parte)}</p>
          )}
        </section>
      )}

      <section aria-label="Resumo" className="grid grid-cols-3 gap-3">
        <Numero rotulo="Participantes" valor={String(p.participantes.length)} />
        <Numero rotulo="Jogos" valor={String(p.totais.jogos)} />
        <Numero rotulo="Arrecadado" valor={formatBRL(p.totais.arrecadado)} />
      </section>

      {temResultado && b.resultado && (
        <Secao titulo="Resultado" id="res">
          <Dezenas dezenas={b.resultado.dezenas} />
          <p className="text-sm">
            {p.totais.melhorFaixa ? (
              <>
                O bolão fez <strong>{FAIXA[p.totais.melhorFaixa]}</strong>! Prêmio do bolão: <strong>{formatBRL(p.totais.premioBolao ?? 0)}</strong>.
              </>
            ) : (
              "Desta vez o bolão não premiou."
            )}
          </p>
        </Secao>
      )}

      {eu && (
        <Secao titulo="Meus jogos" id="meus">
          {p.meusJogos.length === 0 && <p className="text-sm text-muted">Você ainda não tem jogos. Escolha as dezenas abaixo ou peça uma surpresinha.</p>}
          <ul className="space-y-2">
            {p.meusJogos.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3">
                <div className="space-y-1">
                  <Dezenas dezenas={j.dezenas} acertos={j.conferencia?.acertadas} tamanho="sm" />
                  <p className="text-xs text-muted">
                    {j.dezenas.length} dezenas · {formatBRL(j.preco)}
                    {j.surpresinha ? " · surpresinha" : ""}
                    {j.registrado ? " · registrado na Caixa" : ""}
                  </p>
                </div>
                {b.inscricoesAbertas && !j.registrado && (
                  <button type="button" className="text-xs font-semibold text-danger-fg" onClick={() => remover(j.id)}>
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
          {b.inscricoesAbertas ? (
            <div className="border-t border-line pt-3">
              <h3 className="mb-2 text-sm font-semibold">Novo jogo</h3>
              <SeletorDezenas maxDezenas={b.maxDezenasParticipante} precoSimples={b.precoSimples} onConfirmar={incluir} />
            </div>
          ) : (
            <p className="text-sm text-muted">As inscrições estão encerradas; não dá mais para incluir jogos.</p>
          )}
        </Secao>
      )}

      {!temResultado && (
        <Secao titulo="Quanto eu ganho?" id="calc">
          <Calculadora
            virada={b.tipo === "VIRADA"}
            estimativa={b.estimativaPremio}
            meuPeso={eu ? Math.min(eu.pago, eu.devido) : 0}
            pesoSimulado={eu?.devido}
            pesoTotal={p.totais.pesoPrevisto}
            chanceUmEm={p.chance.umEm}
          />
        </Secao>
      )}

      <Secao titulo="Participantes" id="parts">
        <ul className="divide-y divide-line">
          {p.participantes.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="font-medium">
                {x.nome}
                {eu?.id === x.id && <span className="ml-1 text-muted">(você)</span>}
              </span>
              {temResultado && x.parte !== null && x.parte > 0 ? (
                <span className="font-semibold text-brand-dark tabular-nums">{formatBRL(x.parte)}</span>
              ) : (
                <SeloSituacao situacao={x.situacao} />
              )}
            </li>
          ))}
        </ul>
      </Secao>

      <details className="card">
        <summary className="cursor-pointer text-lg font-semibold">Todos os jogos do bolão ({p.jogos.length})</summary>
        <ul className="mt-3 space-y-2">
          {p.jogos.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center gap-2">
              <Dezenas dezenas={j.dezenas} acertos={j.conferencia?.acertadas} tamanho="sm" />
              {j.conferencia?.faixa && <span className="chip bg-brand-soft text-brand-dark">{FAIXA[j.conferencia.faixa]}</span>}
              {!j.registrado && <span className="chip bg-line text-muted">a registrar</span>}
            </li>
          ))}
        </ul>
      </details>
    </Casca>
  );
}
