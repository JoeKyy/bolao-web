"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Aviso, Campo } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useValidacao } from "@/lib/validacao";

/** Guarda, só nesta aba, para qual e-mail já mandamos o link (a tela de entrada pode ter pedido). */
export const chaveEnvio = (convite: string) => `bolao-conta-enviada:${convite}`;

/**
 * Quem entrou só pelo aparelho não tem conta: limpar o histórico ou trocar de celular perde os
 * jogos e o Pix. Aqui a pessoa informa o e-mail e recebe o link que cria a conta (ou guarda o
 * bolão numa conta que já tem). A participação só vai para a conta depois da confirmação.
 */
export function GuardarConta({ convite, aoTerConta }: { convite: string; aoTerConta: () => void }) {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const v = useValidacao();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o armazenamento da aba uma vez ao montar
      setEnviado(sessionStorage.getItem(chaveEnvio(convite)));
    } catch {
      /* sem armazenamento: só não mostra o estado anterior */
    }
  }, [convite]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFalha(null);
    if (!v.validar(e)) return;
    setEnviando(true);
    try {
      await api.post(`/convites/${encodeURIComponent(convite)}/conta`, { email });
      try {
        sessionStorage.setItem(chaveEnvio(convite), email);
      } catch {
        /* ok */
      }
      setEnviado(email);
    } catch (err) {
      if (!v.doServidor(err, { email: "email-conta" })) setFalha(mensagemDe(err));
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
          Seus jogos e o Pix estão só neste aparelho. Se você limpar o histórico do navegador ou trocar de celular, perde o acesso. Com uma conta, entra de qualquer lugar.
        </p>
      </div>
      {enviado ? (
        <div className="space-y-3">
          <Aviso ok={`Enviamos o link para ${enviado}. Abra o e-mail para guardar seu bolão (veja também o spam).`} />
          <button type="button" className="btn-ghost btn-sm" onClick={() => setEnviado(null)}>
            Usar outro e-mail ou pedir de novo
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="space-y-3">
          <Aviso erro={falha ?? v.resumo} />
          <Campo id="email-conta" rotulo="Seu e-mail" erro={v.erros["email-conta"]} dica="Enviamos um link para confirmar o e-mail e criar a senha." limpar={v.limpar}>
            <input type="email" required maxLength={120} autoComplete="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <button type="submit" className="btn w-full sm:w-auto" disabled={enviando} aria-busy={enviando}>
            {enviando ? "Enviando…" : "Enviar link"}
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
