"use client";
import type { ConviteOrganizadorPublico } from "@bolao/shared";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso, Campo, CarregandoPagina, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";
import { useValidacao } from "@/lib/validacao";
import { Casca } from "@/components/Casca";

const SENHA_MINIMA = 12;

/** Quem recebeu o convite de organizador cria a conta (ou troca a senha) aqui. */
export default function ConviteOrganizador() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { dados: c, erro, carregando, recarregar } = useRecurso<ConviteOrganizadorPublico>(`/convite-organizador/${encodeURIComponent(token)}`);
  const [nome, setNome] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const v = useValidacao();

  if (carregando) return <CarregandoPagina largura="estreita" forma="formulario" />;
  if (erro) {
    return (
      <Casca largura="estreita">
        {erro.status === 404 ? <Aviso erro="Este link não vale mais (já foi usado, expirou ou foi trocado). Peça um novo ao administrador." /> : <ErroDeCarga status={erro.status} mensagem={erro.message} tentar={recarregar} />}
      </Casca>
    );
  }
  if (!c) return null;
  const nomeAtual = nome ?? c.nome;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFalha(null);
    if (!v.validar(e)) return;
    if (senha !== confirma) return v.marcar("confirma", "As senhas não conferem. Digite a mesma senha nos dois campos.");
    setEnviando(true);
    try {
      await api.post(`/convite-organizador/${encodeURIComponent(token)}`, { nome: nomeAtual, senha });
      router.replace("/admin");
    } catch (err) {
      if (!v.doServidor(err, { nome: "nome", senha: "senha" }, "senha")) setFalha(mensagemDe(err));
      setEnviando(false);
    }
  }

  return (
    <Casca largura="estreita" centro>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Bolão da Mega</p>
        <h1 className="mt-1 text-h1 font-bold tracking-tight">{c.tipo === "novo" ? "Criar sua conta de organizador" : "Trocar sua senha"}</h1>
        <p className="mt-2 text-sm text-muted">
          {c.tipo === "novo"
            ? "Como organizador você é o tesoureiro dos seus bolões: configura o Pix, manda os convites, confirma os pagamentos e registra os jogos na Caixa."
            : "Depois de trocar, as sessões abertas em outros aparelhos são encerradas."}
        </p>
      </div>
      <form onSubmit={enviar} noValidate className="card space-y-3">
        <Aviso erro={falha ?? v.resumo} />
        <div>
          <p className="label">E-mail</p>
          <p className="text-sm font-medium">{c.email}</p>
        </div>
        {c.tipo === "novo" ? (
          <Campo id="nome" rotulo="Seu nome" erro={v.erros.nome} limpar={v.limpar}>
            <input required minLength={2} maxLength={60} autoComplete="name" className="input" value={nomeAtual} onChange={(e) => setNome(e.target.value)} />
          </Campo>
        ) : (
          <div>
            <p className="label">Nome</p>
            <p className="text-sm font-medium">{c.nome}</p>
          </div>
        )}
        <Campo id="senha" rotulo="Senha (12 a 128 caracteres)" erro={v.erros.senha} dica="Evite senhas comuns, sequências e o seu nome ou e-mail. Uma frase com palavras soltas funciona bem." limpar={v.limpar}>
          <input type="password" required minLength={SENHA_MINIMA} maxLength={128} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        <Campo id="confirma" rotulo="Repita a senha" erro={v.erros.confirma} limpar={v.limpar}>
          <input type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
        </Campo>
        <button type="submit" className="btn w-full" disabled={enviando} aria-busy={enviando}>
          {enviando ? "Salvando…" : c.tipo === "novo" ? "Criar conta" : "Trocar senha"}
        </button>
      </form>
    </Casca>
  );
}
