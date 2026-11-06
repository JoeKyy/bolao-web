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
import { chaveEnvio, chaveErro } from "@/components/GuardarConta";
import { EMAIL_PATTERN } from "@/lib/contato";
import { WHATSAPP_DICA, WHATSAPP_PATTERN, formatarWhatsapp } from "@/lib/contato";

export default function Entrar() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { dados: c, erro, carregando, recarregar } = useRecurso<ConvitePublico>(`/convites/${encodeURIComponent(token)}`);
  const eu = useRecurso<Eu>("/auth/eu"); // 401 = não está logado; segue pelo link, sem conta
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [modo, setModo] = useState<"conta" | "nome">("conta");
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
    if (!logado && modo === "conta" && senha !== confirma) return v.marcar("confirma", "As senhas não conferem. Digite a mesma senha nos dois campos.");
    setEnviando(true);
    try {
      await api.post(`/convites/${encodeURIComponent(token)}/inscricao`, logado ? { whatsapp } : { nome, whatsapp });
      if (!logado && modo === "conta") {
        // Já pede a conta (e-mail confirmado + a senha escolhida aqui). Se falhar, o motivo aparece no
        // cartão da tela do bolão, onde a pessoa tenta de novo sem perder a entrada.
        try {
          await api.post(`/convites/${encodeURIComponent(token)}/conta`, { email, senha });
          sessionStorage.setItem(chaveEnvio(token), email);
        } catch (err) {
          try {
            sessionStorage.setItem(chaveErro(token), mensagemDe(err));
          } catch {
            /* sem armazenamento */
          }
        }
      }
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
            <p className="text-body font-semibold text-brand">
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
                  <div role="group" aria-label="Como você quer entrar" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
                    {(
                      [
                        ["conta", "Criar conta"],
                        ["nome", "Só com meu nome"],
                      ] as const
                    ).map(([m, rotulo]) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={modo === m}
                        onClick={() => setModo(m)}
                        className={`min-h-11 rounded-full px-3 text-body font-semibold transition-colors ${modo === m ? "bg-card text-foreground shadow-card" : "text-muted hover:text-foreground"}`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                  <p className="text-body text-muted">
                    {modo === "conta"
                      ? "Com conta você entra pelo celular, computador ou outro aparelho e não perde seus jogos nem o Pix se limpar o navegador."
                      : "Seu acesso fica só neste aparelho. Você pode criar a conta depois, dentro do bolão."}
                  </p>
                  <Campo id="nome" rotulo="Seu nome" erro={v.erros.nome} limpar={v.limpar}>
                    <input required minLength={2} maxLength={60} autoComplete="name" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </Campo>
                  {modo === "conta" && (
                    <>
                      <Campo id="email" rotulo="E-mail" erro={v.erros.email} dica="Enviamos um link para confirmar que o e-mail é seu." limpar={v.limpar}>
                        <input type="email" required pattern={EMAIL_PATTERN} maxLength={120} autoComplete="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Campo>
                      <Campo id="senha" rotulo="Senha (12 a 128 caracteres)" erro={v.erros.senha} dica="Evite senhas comuns e o seu nome ou e-mail. Uma frase com palavras soltas funciona bem." limpar={v.limpar}>
                        <input type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
                      </Campo>
                      <Campo id="confirma" rotulo="Repita a senha" erro={v.erros.confirma} limpar={v.limpar}>
                        <input type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
                      </Campo>
                    </>
                  )}
                </>
              )}
              <Campo id="whatsapp" rotulo="WhatsApp (opcional)" erro={v.erros.whatsapp} dica="Só o organizador vê. Usado para avisos do bolão; seus dados são apagados quando o bolão acabar." limpar={v.limpar}>
                <input type="tel" inputMode="tel" pattern={WHATSAPP_PATTERN} title={WHATSAPP_DICA} maxLength={30} autoComplete="tel" placeholder="(11) 91234-5678" className="input" value={whatsapp} onChange={(e) => setWhatsapp(formatarWhatsapp(e.target.value))} />
              </Campo>
              <button type="submit" className="btn w-full" disabled={enviando} aria-busy={enviando}>
                {enviando ? "Entrando…" : !logado && modo === "conta" ? "Criar conta e entrar no bolão" : "Entrar no bolão"}
              </button>
              {!logado && (
                <p className="legenda">
                  Já tem conta?{" "}
                  <Link href="/admin" className="font-semibold text-brand underline">
                    Entre primeiro
                  </Link>
                  . Entrou antes e perdeu o acesso? Peça ao organizador um link de acesso.
                </p>
              )}
            </form>
          )}
        </>
      )}
    </Casca>
  );
}
