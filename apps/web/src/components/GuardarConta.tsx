"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Aviso, Campo } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useValidacao } from "@/lib/validacao";
import { EMAIL_PATTERN } from "@/lib/contato";

/** Guarda, só nesta aba, para qual e-mail já mandamos o link (a tela de entrada pode ter pedido). */
export const chaveEnvio = (convite: string) => `bolao-conta-enviada:${convite}`;
/** Motivo de o pedido de conta ter falhado logo depois de entrar no bolão (a pessoa tenta de novo no cartão). */
export const chaveErro = (convite: string) => `bolao-conta-erro:${convite}`;

/**
 * Quem entrou só pelo aparelho não tem conta: limpar o histórico ou trocar de celular perde os
 * jogos e o Pix. Aqui a pessoa informa o e-mail e recebe o link que cria a conta (ou guarda o
 * bolão numa conta que já tem). A participação só vai para a conta depois da confirmação.
 */
export function GuardarConta({ convite, aoTerConta }: { convite: string; aoTerConta: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [enviado, setEnviado] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const v = useValidacao();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o armazenamento da aba uma vez ao montar
      setEnviado(sessionStorage.getItem(chaveEnvio(convite)));
      const erro = sessionStorage.getItem(chaveErro(convite));
      if (erro) {
        setFalha(erro);
        sessionStorage.removeItem(chaveErro(convite));
      }
    } catch {
      /* sem armazenamento: só não mostra o estado anterior */
    }
  }, [convite]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFalha(null);
    if (!v.validar(e)) return;
    if (senha !== confirma) return v.marcar("confirma-conta", "As senhas não conferem. Digite a mesma senha nos dois campos.");
    setEnviando(true);
    try {
      await api.post(`/convites/${encodeURIComponent(convite)}/conta`, { email, senha });
      try {
        sessionStorage.setItem(chaveEnvio(convite), email);
      } catch {
        /* ok */
      }
      setEnviado(email);
    } catch (err) {
      if (!v.doServidor(err, { email: "email-conta", senha: "senha-conta" }, "senha-conta")) setFalha(mensagemDe(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-labelledby="guardar-titulo" className="nao-imprimir card space-y-4 !border-brand/40">
      <div className="space-y-1">
        <h2 id="guardar-titulo" className="titulo-2">
          Guarde seu bolão numa conta
        </h2>
        <p className="text-muted">
          Seus jogos e o Pix estão só neste aparelho. Se você limpar o histórico do navegador ou trocar de celular, perde o acesso. Crie uma conta com e-mail e senha e entre de qualquer lugar.
        </p>
      </div>
      {enviado ? (
        <div className="space-y-3">
          <Aviso ok={`Enviamos um link para ${enviado}. Abra o e-mail e confirme para ativar a conta com a senha que você escolheu (veja também o spam). Até lá, seu acesso continua neste aparelho.`} />
          <button type="button" className="btn-ghost btn-sm" onClick={() => setEnviado(null)}>
            Usar outro e-mail ou pedir o link de novo
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="space-y-3">
          <Aviso erro={falha ?? v.resumo} />
          <Campo id="email-conta" rotulo="Seu e-mail" erro={v.erros["email-conta"]} dica="Enviamos um link para confirmar que o e-mail é seu." limpar={v.limpar}>
            <input type="email" required pattern={EMAIL_PATTERN} maxLength={120} autoComplete="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <Campo id="senha-conta" rotulo="Senha (12 a 128 caracteres)" erro={v.erros["senha-conta"]} dica="Evite senhas comuns e o seu nome ou e-mail. Uma frase com palavras soltas funciona bem." limpar={v.limpar}>
            <input type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </Campo>
          <Campo id="confirma-conta" rotulo="Repita a senha" erro={v.erros["confirma-conta"]} limpar={v.limpar}>
            <input type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
          </Campo>
          <button type="submit" className="btn w-full sm:w-auto" disabled={enviando} aria-busy={enviando}>
            {enviando ? "Enviando…" : "Criar conta"}
          </button>
        </form>
      )}
      <p className="text-caption text-muted">
        Já tem conta?{" "}
        <button type="button" className="font-semibold text-brand underline" onClick={aoTerConta}>
          Entre e guarde por ela
        </button>
        .
      </p>
    </section>
  );
}
