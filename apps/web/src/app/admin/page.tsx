"use client";
import type { BolaoNaLista } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso, Carregando, ErroDeCarga } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";

function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await api.post("/auth/entrar", { email, senha });
      aoEntrar();
    } catch (err) {
      setErro(mensagemDe(err));
    } finally {
      setEnviando(false);
      setSenha("");
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Área do organizador</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Entrar</h1>
      </div>
      <Aviso erro={erro} />
      <form onSubmit={entrar} className="card flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="label">
            E-mail
          </label>
          <input id="email" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="senha" className="label">
            Senha
          </label>
          <input id="senha" type="password" required autoComplete="current-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <Link href="/" className="text-sm text-muted underline">
        Voltar
      </Link>
    </main>
  );
}

export default function Admin() {
  const router = useRouter();
  const { dados, erro, carregando, recarregar } = useRecurso<BolaoNaLista[]>("/boloes");
  const [nome, setNome] = useState("Mega da Virada 2026");
  const [tipo, setTipo] = useState<"VIRADA" | "NORMAL">("VIRADA");
  const [falha, setFalha] = useState<string | null>(null);

  if (carregando) return <Carregando />;
  if (erro?.status === 401) return <Login aoEntrar={recarregar} />;
  if (erro) return <main className="mx-auto max-w-2xl px-4 py-10"><ErroDeCarga mensagem={erro.message} tentar={recarregar} /></main>;

  async function criar(e: FormEvent) {
    e.preventDefault();
    try {
      const { id } = await api.post<{ id: number }>("/boloes", { nome, tipo });
      router.push(`/admin/${id}`);
    } catch (err) {
      setFalha(mensagemDe(err));
    }
  }
  async function sair() {
    await api.post("/auth/sair").catch(() => undefined);
    await recarregar();
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Organizador</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Seus bolões</h1>
        </div>
        <button type="button" className="btn-ghost" onClick={sair}>
          Sair
        </button>
      </header>

      <form onSubmit={criar} className="card space-y-3">
        <h2 className="text-lg font-semibold">Novo bolão</h2>
        <Aviso erro={falha} />
        <div>
          <label htmlFor="nome" className="label">
            Nome do grupo
          </label>
          <input id="nome" required minLength={2} maxLength={80} className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="label">Tipo</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" checked={tipo === "VIRADA"} onChange={() => setTipo("VIRADA")} /> Mega da Virada 2026 (sorteio 01/01/2027, 10h)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" checked={tipo === "NORMAL"} onChange={() => setTipo("NORMAL")} /> Concurso normal
          </label>
        </fieldset>
        <button type="submit" className="btn">
          Criar bolão
        </button>
      </form>

      {dados && dados.length === 0 && <p className="text-center text-sm text-muted">Nenhum bolão ainda.</p>}
      <ul className="space-y-3">
        {dados?.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/${b.id}`} className="card block transition hover:border-brand/40">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{b.nome}</h3>
                  <p className="text-sm text-muted">
                    {b.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
                    {b.concurso ? ` · concurso ${b.concurso}` : ""}
                  </p>
                </div>
                <span className={`chip ${b.temResultado ? "bg-line text-foreground" : b.inscricoesAbertas ? "bg-brand-soft text-brand-dark" : "bg-amber-100 text-amber-800"}`}>
                  {b.temResultado ? "Conferido" : b.inscricoesAbertas ? "Inscrições abertas" : "Inscrições encerradas"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div><dt className="text-xs text-muted">Participantes</dt><dd className="font-semibold">{b.participantes}</dd></div>
                <div><dt className="text-xs text-muted">Pagos</dt><dd className="font-semibold">{b.quitados}</dd></div>
                <div><dt className="text-xs text-muted">Arrecadado</dt><dd className="font-semibold">{formatBRL(b.arrecadado)}</dd></div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
