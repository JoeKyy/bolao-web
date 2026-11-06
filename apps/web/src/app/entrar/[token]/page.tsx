"use client";
import type { ConvitePublico, Eu } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Aviso, Campo, Carregando, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { formatarDataHora } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";
import { useValidacao } from "@/lib/validacao";
import { Casca } from "@/components/Casca";

export default function Entrar() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { dados: c, erro, carregando, recarregar } = useRecurso<ConvitePublico>(`/convites/${encodeURIComponent(token)}`);
  const eu = useRecurso<Eu>("/auth/eu"); // 401 = não está logado; segue pelo link, sem conta
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const v = useValidacao();

  useEffect(() => {
    if (c?.jaInscrito) router.replace(`/b/${encodeURIComponent(token)}`);
  }, [c, router, token]);

  const logado = !!eu.dados;
  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFalha(null);
    if (!v.validar(e)) return;
    setEnviando(true);
    try {
      await api.post(`/convites/${encodeURIComponent(token)}/inscricao`, logado ? { whatsapp } : { nome, whatsapp });
      router.replace(`/b/${encodeURIComponent(token)}`);
    } catch (err) {
      if (!v.doServidor(err, { nome: "nome", whatsapp: "whatsapp" })) setFalha(mensagemDe(err));
      setEnviando(false);
    }
  }

  return (
    <Casca largura="estreita" centro>
      {carregando && <Carregando />}
      {erro && (erro.status === 404 ? <Aviso erro="Este convite não existe ou foi trocado. Peça o link novo ao organizador." /> : <ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} />)}
      {c && !c.jaInscrito && (
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              {c.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
              {c.concurso ? ` · Concurso ${c.concurso}` : ""}
            </p>
            <h1 className="mt-1 text-h1 font-bold tracking-tight">{c.nome}</h1>
            <p className="mt-2 text-sm text-muted">
              {c.dataSorteio ? `Sorteio em ${formatarDataHora(c.dataSorteio)}. ` : ""}Cada jogo de 6 dezenas custa {formatBRL(c.precoSimples)}; você escolhe quantos jogos quer
              fazer depois de entrar.
            </p>
          </div>
          {!c.inscricoesAbertas ? (
            <Aviso erro="As inscrições deste bolão estão encerradas." />
          ) : (
            <form onSubmit={entrar} noValidate className="card space-y-4">
              <Aviso erro={falha ?? v.resumo} />
              {logado ? (
                <p className="rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">
                  Você vai entrar como <strong>{eu.dados!.nome || eu.dados!.email}</strong>. O bolão fica guardado na sua conta e aparece em qualquer aparelho.
                </p>
              ) : (
                <>
                  <Campo id="nome" rotulo="Seu nome" erro={v.erros.nome} limpar={v.limpar}>
                    <input required minLength={2} maxLength={60} autoComplete="name" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </Campo>
                  <p className="text-xs text-muted">
                    Tem conta?{" "}
                    <Link href="/admin" className="font-semibold text-brand underline">
                      Entre primeiro
                    </Link>{" "}
                    para ver este bolão em qualquer aparelho.
                  </p>
                </>
              )}
              <Campo id="whatsapp" rotulo="WhatsApp (opcional)" erro={v.erros.whatsapp} dica="Só o organizador vê. Usado para avisos do bolão; seus dados são apagados quando o bolão acabar." limpar={v.limpar}>
                <input type="tel" maxLength={30} autoComplete="tel" placeholder="(11) 90000-0000" className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </Campo>
              <button type="submit" className="btn w-full" disabled={enviando} aria-busy={enviando}>
                {enviando ? "Entrando…" : "Entrar no bolão"}
              </button>
            </form>
          )}
        </>
      )}
    </Casca>
  );
}
