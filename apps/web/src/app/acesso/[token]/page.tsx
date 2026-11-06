"use client";
import type { AcessoPublico } from "@bolao/shared";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Casca } from "@/components/Casca";
import { Aviso, CarregandoPagina, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";

/** Link de acesso do organizador: a pessoa confirma que é ela e este aparelho volta a ver o bolão. */
export default function Acesso() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { dados: c, erro, carregando, recarregar } = useRecurso<AcessoPublico>(`/acesso/${encodeURIComponent(token)}`);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (carregando) return <CarregandoPagina largura="estreita" forma="formulario" />;
  if (erro) {
    return (
      <Casca largura="estreita">
        {erro.status === 404 ? (
          <ErroDeCarga status={404} mensagem="Este link não vale mais: já foi usado, venceu ou foi trocado por um mais novo. Peça outro ao organizador." voltar={{ href: "/", rotulo: "Ir para o início" }} />
        ) : (
          <ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} />
        )}
      </Casca>
    );
  }
  if (!c) return null;

  async function entrar() {
    setFalha(null);
    setEnviando(true);
    try {
      const r = await api.post<{ convite: string }>(`/acesso/${encodeURIComponent(token)}`);
      router.replace(`/b/${encodeURIComponent(r.convite)}`);
    } catch (err) {
      setFalha(mensagemDe(err));
      setEnviando(false);
    }
  }

  return (
    <Casca largura="estreita" centro>
      <div>
        <p className="text-body font-semibold text-brand">{c.bolao}</p>
        <h1 className="mt-1 text-h1 font-bold tracking-tight">Voltar ao seu bolão</h1>
        <p className="mt-2 text-muted">
          O organizador liberou o acesso de <strong className="text-foreground">{c.nome}</strong> neste aparelho. Só continue se esse nome é o seu.
        </p>
      </div>
      <div className="card space-y-4">
        <Aviso erro={falha} />
        <button type="button" className="btn w-full" onClick={entrar} disabled={enviando} aria-busy={enviando}>
          {enviando ? "Entrando…" : `Sou ${c.nome.split(" ")[0]}, entrar no bolão`}
        </button>
        <p className="legenda">Depois de entrar, guarde o bolão numa conta para não perder o acesso de novo.</p>
      </div>
    </Casca>
  );
}
