"use client";
import type { BolaoNaLista, Eu, ParticipacaoDTO } from "@bolao/shared";
import { formatBRL } from "@bolao/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso, BotaoCopiar, Carregando, ErroDeCarga, SeloSituacao } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { entrarComSenha } from "@/lib/loginCripto";
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
      await entrarComSenha(email, senha);
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
      <div className="flex justify-between text-sm">
        <Link href="/recuperar" className="font-semibold text-brand underline">
          Esqueci minha senha
        </Link>
        <Link href="/" className="text-muted underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}

/** Códigos de recuperação (como no gestor): gerados com a senha atual, mostrados uma vez. */
function CodigosRecuperacao() {
  const { dados, recarregar } = useRecurso<{ restantes: number }>("/auth/codigos");
  const [senha, setSenha] = useState("");
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  async function gerar(e: FormEvent) {
    e.preventDefault();
    if (dados?.restantes && !window.confirm("Gerar códigos novos? Os que você guardou antes deixam de valer.")) return;
    try {
      const r = await api.post<{ codigos: string[] }>("/auth/codigos", { senha });
      setCodigos(r.codigos);
      setSenha("");
      setErro(null);
      await recarregar();
    } catch (err) {
      setErro(mensagemDe(err));
    }
  }
  return (
    <div className="mt-4 space-y-2 border-t border-line pt-4">
      <h3 className="text-sm font-semibold">Códigos de recuperação</h3>
      <p className="text-xs text-muted">
        Servem para trocar a senha se você esquecer, sem depender de e-mail nem do administrador. Você tem {dados?.restantes ?? 0} código(s) válido(s).
      </p>
      <Aviso erro={erro} />
      {codigos ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">Guarde estes códigos agora. Eles não aparecem de novo.</p>
          <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
            {codigos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <BotaoCopiar texto={codigos.join("\n")} rotulo="Copiar códigos" />
        </div>
      ) : (
        <form onSubmit={gerar} className="flex gap-2">
          <input aria-label="Senha atual para gerar códigos" type="password" required autoComplete="current-password" placeholder="Senha atual" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <button type="submit" className="btn-ghost shrink-0">
            Gerar códigos
          </button>
        </form>
      )}
    </div>
  );
}

/** Parte do tesoureiro: criar e listar os próprios bolões. Só é montada para quem tem o perfil. */
function PainelTesoureiro() {
  const router = useRouter();
  const { dados, erro, carregando, recarregar } = useRecurso<BolaoNaLista[]>("/boloes");
  const [nome, setNome] = useState("Mega da Virada 2026");
  const [tipo, setTipo] = useState<"VIRADA" | "NORMAL">("VIRADA");
  const [falha, setFalha] = useState<string | null>(null);

  if (carregando) return <Carregando />;
  if (erro) return <ErroDeCarga mensagem={erro.message} tentar={recarregar} />;

  async function criar(e: FormEvent) {
    e.preventDefault();
    try {
      const { id } = await api.post<{ id: number }>("/boloes", { nome, tipo });
      router.push(`/admin/${id}`);
    } catch (err) {
      setFalha(mensagemDe(err));
    }
  }

  return (
    <>
      <section className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Bolões que eu administro</h2>
        <p className="text-sm text-muted">Você é o tesoureiro deles: o Pix, os convites, os pagamentos e o registro dos jogos são só seus.</p>
      </section>

      <form onSubmit={criar} className="card space-y-3">
        <h3 className="text-lg font-semibold">Novo bolão</h3>
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
    </>
  );
}

/** "Meus bolões": tudo de que a conta participa, para qualquer perfil. */
function MeusBoloes() {
  const { dados, erro, carregando, recarregar } = useRecurso<ParticipacaoDTO[]>("/participacoes");
  if (carregando) return <Carregando />;
  if (erro) return <ErroDeCarga mensagem={erro.message} tentar={recarregar} />;
  return (
    <>
      <section className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Bolões de que eu participo</h2>
        <p className="text-sm text-muted">Para entrar num bolão novo, abra o link de convite que o tesoureiro mandou, já logado.</p>
      </section>
      {dados && dados.length === 0 && <p className="text-center text-sm text-muted">Você ainda não participa de nenhum bolão com esta conta.</p>}
      <ul className="space-y-3">
        {dados?.map((b) => (
          <li key={b.convite}>
            <Link href={`/b/${b.convite}`} className="card block transition hover:border-brand/40">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{b.nome}</h3>
                  <p className="text-sm text-muted">
                    {b.tipo === "VIRADA" ? "Mega da Virada" : "Mega-Sena"}
                    {b.concurso ? ` · concurso ${b.concurso}` : ""} · {b.jogos} jogo(s)
                  </p>
                </div>
                <SeloSituacao situacao={b.situacao} />
              </div>
              <p className="mt-2 text-sm text-muted">
                Devido {formatBRL(b.devido)} · pago {formatBRL(b.pago)}
                {b.temResultado && b.parte !== null && b.parte > 0 ? ` · sua parte ${formatBRL(b.parte)}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function Admin() {
  const eu = useRecurso<Eu>("/auth/eu");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [falha, setFalha] = useState<string | null>(null);

  if (eu.carregando) return <Carregando />;
  if (eu.erro?.status === 401) return <Login aoEntrar={() => void eu.recarregar()} />;
  if (eu.erro || !eu.dados) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <ErroDeCarga mensagem={eu.erro?.message ?? "Erro"} tentar={eu.recarregar} />
      </main>
    );
  }
  const conta = eu.dados;

  async function sair() {
    await api.post("/auth/sair").catch(() => undefined);
    await eu.recarregar();
  }
  async function trocarSenha(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/auth/senha", { atual: senhaAtual, nova: senhaNova });
      setSenhaAtual("");
      setSenhaNova("");
      await eu.recarregar(); // a troca encerra todas as sessões: volta para o login
    } catch (err) {
      setFalha(mensagemDe(err));
    }
  }
  const perfis = [conta.admin && "Administrador", conta.tesoureiro && "Tesoureiro"].filter(Boolean).join(" e ");

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{conta.nome || conta.email}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Bolão da Mega</h1>
          <p className="mt-1 text-sm text-muted">{perfis ? `Perfil: ${perfis}.` : "Pessoa comum: você participa de bolões."}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button type="button" className="btn-ghost" onClick={sair}>
            Sair
          </button>
          {conta.admin && (
            <Link href="/admin/usuarios" className="text-sm font-semibold text-brand underline">
              Usuários
            </Link>
          )}
        </div>
      </header>

      {conta.tesoureiro && <PainelTesoureiro />}
      <MeusBoloes />

      <details className="card">
        <summary className="cursor-pointer font-semibold">Minha conta</summary>
        <Aviso erro={falha} />
        <form onSubmit={trocarSenha} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input aria-label="Senha atual" type="password" required autoComplete="current-password" placeholder="Senha atual" className="input" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          <input aria-label="Nova senha" type="password" required minLength={12} autoComplete="new-password" placeholder="Nova senha (12+)" className="input" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} />
          <button type="submit" className="btn-ghost">
            Trocar senha
          </button>
        </form>
        <p className="mt-2 text-xs text-muted">Trocar a senha encerra as sessões em todos os aparelhos.</p>
        <CodigosRecuperacao />
      </details>
    </main>
  );
}
