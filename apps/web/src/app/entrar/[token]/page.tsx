"use client";
import type { ConvitePublico } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Aviso, Carregando, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { formatarDataHora } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";

export default function Entrar() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { dados: c, erro, carregando, recarregar } = useRecurso<ConvitePublico>(`/convites/${encodeURIComponent(token)}`);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (c?.jaInscrito) router.replace(`/b/${encodeURIComponent(token)}`);
  }, [c, router, token]);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setFalha(null);
    try {
      await api.post(`/convites/${encodeURIComponent(token)}/inscricao`, { nome, whatsapp });
      router.replace(`/b/${encodeURIComponent(token)}`);
    } catch (err) {
      setFalha(mensagemDe(err));
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-5 py-10">
      {carregando && <Carregando />}
      {erro && (erro.status === 404 ? <Aviso erro="Este convite não existe ou foi trocado. Peça o link novo ao organizador." /> : <ErroDeCarga mensagem={erro.message} tentar={recarregar} />)}
      {c && !c.jaInscrito && (
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              {c.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
              {c.concurso ? ` · Concurso ${c.concurso}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{c.nome}</h1>
            <p className="mt-2 text-sm text-muted">
              {c.dataSorteio ? `Sorteio em ${formatarDataHora(c.dataSorteio)}. ` : ""}Cada jogo de 6 dezenas custa {formatBRL(c.precoSimples)}; você escolhe quantos jogos quer
              fazer depois de entrar.
            </p>
          </div>
          {!c.inscricoesAbertas ? (
            <Aviso erro="As inscrições deste bolão estão encerradas." />
          ) : (
            <form onSubmit={entrar} className="card space-y-4">
              <Aviso erro={falha} />
              <div>
                <label htmlFor="nome" className="label">
                  Seu nome
                </label>
                <input id="nome" required minLength={2} maxLength={60} autoComplete="name" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label htmlFor="whatsapp" className="label">
                  WhatsApp (opcional)
                </label>
                <input id="whatsapp" type="tel" maxLength={30} autoComplete="tel" placeholder="(11) 90000-0000" className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                <p className="mt-1 text-xs text-muted">Só o organizador vê. Usado para avisos do bolão; seus dados são apagados quando o bolão acabar.</p>
              </div>
              <button type="submit" className="btn w-full" disabled={enviando}>
                {enviando ? "Entrando…" : "Entrar no bolão"}
              </button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
