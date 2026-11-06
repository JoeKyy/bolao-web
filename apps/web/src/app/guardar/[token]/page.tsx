"use client";
import type { VinculoConfirmado, VinculoPublico } from "@bolao/shared";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Casca } from "@/components/Casca";
import { Aviso, Campo, CarregandoPagina, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";
import { useValidacao } from "@/lib/validacao";

const SENHA_MINIMA = 12;

/** Destino do link enviado por e-mail: provar o e-mail e guardar o bolão numa conta. */
export default function Guardar() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { dados: c, erro, carregando, recarregar } = useRecurso<VinculoPublico>(`/vinculo/${encodeURIComponent(token)}`);
  const [nome, setNome] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState<VinculoConfirmado | null>(null);
  const v = useValidacao();

  if (carregando) return <CarregandoPagina largura="estreita" forma="formulario" />;
  if (erro) {
    return (
      <Casca largura="estreita">
        {erro.status === 404 ? (
          <ErroDeCarga status={404} mensagem="Este link não vale mais: já foi usado, venceu ou foi trocado por um mais novo. Peça outro na tela do bolão." voltar={{ href: "/", rotulo: "Ir para o início" }} />
        ) : (
          <ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} />
        )}
      </Casca>
    );
  }
  if (!c) return null;

  if (pronto) {
    return (
      <Casca largura="estreita" centro>
        <div className="card space-y-3">
          <h1 className="titulo-1">Bolão guardado</h1>
          <p className="text-muted">
            O bolão <strong className="text-foreground">{c.bolao}</strong> agora está na conta <strong className="text-foreground">{c.email}</strong>. Entre com esse e-mail e a sua senha em qualquer aparelho.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={pronto.sessao ? `/b/${pronto.convite}` : "/admin"} className="btn">
              {pronto.sessao ? "Abrir meu bolão" : "Entrar na minha conta"}
            </Link>
          </div>
        </div>
      </Casca>
    );
  }

  const nomeAtual = nome ?? c.nome;

  async function confirmar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFalha(null);
    if (!c!.contaExiste && !c!.senhaDefinida) {
      if (!v.validar(e)) return;
      if (senha !== confirma) return v.marcar("confirma", "As senhas não conferem. Digite a mesma senha nos dois campos.");
    }
    setEnviando(true);
    try {
      const r = await api.post<VinculoConfirmado>(`/vinculo/${encodeURIComponent(token)}`, c!.contaExiste || c!.senhaDefinida ? {} : { nome: nomeAtual, senha });
      if (r.sessao) router.replace(`/b/${encodeURIComponent(r.convite)}`);
      else setPronto(r);
    } catch (err) {
      if (!v.doServidor(err, { nome: "nome", senha: "senha" }, "senha")) setFalha(mensagemDe(err));
      setEnviando(false);
    }
  }

  return (
    <Casca largura="estreita" centro>
      <div>
        <p className="text-body font-semibold text-brand">{c.bolao}</p>
        <h1 className="mt-1 text-h1 font-bold tracking-tight">{c.contaExiste ? "Guardar na sua conta" : c.senhaDefinida ? "Confirmar seu e-mail" : "Criar sua conta"}</h1>
        <p className="mt-2 text-muted">
          {c.contaExiste
            ? "Já existe uma conta com este e-mail. Confirme para guardar este bolão nela. Se for a sua, entre com a senha dela."
            : c.senhaDefinida
              ? "Falta só confirmar que o e-mail é seu. Sua conta fica ativa com a senha que você escolheu ao se cadastrar."
              : "Crie uma senha para entrar de qualquer aparelho e nunca perder seus jogos nem o Pix deste bolão."}
        </p>
      </div>
      <form onSubmit={confirmar} noValidate className="card space-y-4">
        <Aviso erro={falha ?? v.resumo} />
        <div>
          <p className="label">E-mail</p>
          <p className="font-medium">{c.email}</p>
        </div>
        {!c.contaExiste && !c.senhaDefinida && (
          <>
            <Campo id="nome" rotulo="Seu nome" erro={v.erros.nome} limpar={v.limpar}>
              <input required minLength={2} maxLength={60} autoComplete="name" className="input" value={nomeAtual} onChange={(e) => setNome(e.target.value)} />
            </Campo>
            <Campo id="senha" rotulo="Senha (12 a 128 caracteres)" erro={v.erros.senha} dica="Evite senhas comuns, sequências e o seu nome ou e-mail. Uma frase com palavras soltas funciona bem." limpar={v.limpar}>
              <input type="password" required minLength={SENHA_MINIMA} maxLength={128} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </Campo>
            <Campo id="confirma" rotulo="Repita a senha" erro={v.erros.confirma} limpar={v.limpar}>
              <input type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
            </Campo>
          </>
        )}
        <button type="submit" className="btn w-full" disabled={enviando} aria-busy={enviando}>
          {enviando ? "Salvando…" : c.contaExiste ? "Guardar bolão na minha conta" : c.senhaDefinida ? "Confirmar e ativar minha conta" : "Criar conta e guardar o bolão"}
        </button>
      </form>
    </Casca>
  );
}
