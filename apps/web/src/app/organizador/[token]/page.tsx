"use client";
import type { ConviteOrganizadorPublico } from "@bolao/shared";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso, Carregando, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";

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

  if (carregando) return <Carregando />;
  if (erro) {
    return (
      <main className="mx-auto max-w-sm px-5 py-10">
        {erro.status === 404 ? <Aviso erro="Este link não vale mais (já foi usado, expirou ou foi trocado). Peça um novo ao administrador." /> : <ErroDeCarga mensagem={erro.message} tentar={recarregar} />}
      </main>
    );
  }
  if (!c) return null;
  const nomeAtual = nome ?? c.nome;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (senha !== confirma) return setFalha("As senhas não conferem.");
    if (senha.length < SENHA_MINIMA) return setFalha(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    setEnviando(true);
    setFalha(null);
    try {
      await api.post(`/convite-organizador/${encodeURIComponent(token)}`, { nome: nomeAtual, senha });
      router.replace("/admin");
    } catch (err) {
      setFalha(mensagemDe(err));
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Bolão da Mega</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{c.tipo === "novo" ? "Criar sua conta de organizador" : "Trocar sua senha"}</h1>
        <p className="mt-2 text-sm text-muted">
          {c.tipo === "novo"
            ? "Como organizador você é o tesoureiro dos seus bolões: configura o Pix, manda os convites, confirma os pagamentos e registra os jogos na Caixa."
            : "Depois de trocar, as sessões abertas em outros aparelhos são encerradas."}
        </p>
      </div>
      <form onSubmit={enviar} className="card space-y-3">
        <Aviso erro={falha} />
        <div>
          <p className="label">E-mail</p>
          <p className="text-sm font-medium">{c.email}</p>
        </div>
        <div>
          <label htmlFor="nome" className="label">
            Seu nome
          </label>
          <input id="nome" required minLength={2} maxLength={60} autoComplete="name" className="input" value={nomeAtual} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label htmlFor="senha" className="label">
            Senha (12 ou mais caracteres)
          </label>
          <input id="senha" type="password" required minLength={SENHA_MINIMA} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirma" className="label">
            Repita a senha
          </label>
          <input id="confirma" type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
        </div>
        <button type="submit" className="btn w-full" disabled={enviando}>
          {enviando ? "Salvando…" : c.tipo === "novo" ? "Criar conta" : "Trocar senha"}
        </button>
      </form>
    </main>
  );
}
