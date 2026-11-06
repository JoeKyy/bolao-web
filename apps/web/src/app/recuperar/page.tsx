"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso, Campo } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { useValidacao } from "@/lib/validacao";
import { Casca } from "@/components/Casca";
import { EMAIL_PATTERN } from "@/lib/contato";

/** "Esqueci minha senha", no esquema do gestor: link por e-mail ou código de recuperação. */
export default function Recuperar() {
  const router = useRouter();
  const [modo, setModo] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [aviso, setAviso] = useState<{ erro?: string; ok?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const v = useValidacao();

  async function porEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAviso({});
    if (!v.validar(e)) return;
    setEnviando(true);
    try {
      const r = await api.post<{ mensagem: string }>("/auth/esqueci", { email });
      setAviso({ ok: r.mensagem });
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
    } finally {
      setEnviando(false);
    }
  }
  async function porCodigo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAviso({});
    if (!v.validar(e)) return;
    if (senha !== confirma) return v.marcar("confirma", "As senhas não conferem. Digite a mesma senha nos dois campos.");
    setEnviando(true);
    try {
      await api.post("/auth/recuperar", { email, codigo, novaSenha: senha });
      router.replace("/admin");
    } catch (err) {
      if (!v.doServidor(err, { email: "email2", codigo: "codigo", novaSenha: "nova" }, "nova")) setAviso({ erro: mensagemDe(err) });
      setEnviando(false);
    }
  }

  return (
    <Casca largura="estreita" centro>
      <div>
        <p className="text-body font-semibold text-brand">Área do organizador</p>
        <h1 className="mt-1 text-h1 font-bold tracking-tight">Recuperar acesso</h1>
      </div>
      <div role="tablist" className="grid grid-cols-2 gap-2">
        {(["email", "codigo"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            type="button"
            className={modo === m ? "btn" : "btn-ghost"}
            onClick={() => (setModo(m), setAviso({}))}
          >
            {m === "email" ? "Link por e-mail" : "Tenho um código"}
          </button>
        ))}
      </div>
      <Aviso erro={aviso.erro ?? v.resumo} ok={aviso.ok} />
      {modo === "email" ? (
        <form onSubmit={porEmail} noValidate className="card space-y-3">
          <p className="text-sm text-muted">Mandamos um link para definir uma nova senha. Se não chegar, peça ao administrador um link novo.</p>
          <Campo id="email" rotulo="E-mail" erro={v.erros.email} limpar={v.limpar}>
            <input type="email" required pattern={EMAIL_PATTERN} autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <button type="submit" className="btn w-full" disabled={enviando} aria-busy={enviando}>
            Enviar link
          </button>
        </form>
      ) : (
        <form onSubmit={porCodigo} noValidate className="card space-y-3">
          <p className="text-sm text-muted">Use um dos códigos de recuperação que você guardou. Cada código vale uma vez.</p>
          <Campo id="email2" rotulo="E-mail" erro={v.erros.email2} limpar={v.limpar}>
            <input type="email" required pattern={EMAIL_PATTERN} autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <Campo id="codigo" rotulo="Código (XXXX-XXXX-XXXX)" erro={v.erros.codigo} limpar={v.limpar}>
            <input required maxLength={20} autoComplete="one-time-code" className="input font-mono uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </Campo>
          <Campo id="nova" rotulo="Nova senha (12 ou mais caracteres)" erro={v.erros.nova} limpar={v.limpar}>
            <input type="password" required minLength={12} maxLength={128} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </Campo>
          <Campo id="confirma" rotulo="Repita a nova senha" erro={v.erros.confirma} limpar={v.limpar}>
            <input type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
          </Campo>
          <button type="submit" className="btn w-full" disabled={enviando} aria-busy={enviando}>
            Trocar senha e entrar
          </button>
        </form>
      )}
      <Link href="/admin" className="text-sm text-muted underline">
        Voltar ao login
      </Link>
    </Casca>
  );
}
