"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Aviso } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";

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

  async function porEmail(e: FormEvent) {
    e.preventDefault();
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
  async function porCodigo(e: FormEvent) {
    e.preventDefault();
    if (senha !== confirma) return setAviso({ erro: "As senhas não conferem." });
    setEnviando(true);
    try {
      await api.post("/auth/recuperar", { email, codigo, novaSenha: senha });
      router.replace("/admin");
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5 py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Área do organizador</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Recuperar acesso</h1>
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
      <Aviso erro={aviso.erro} ok={aviso.ok} />
      {modo === "email" ? (
        <form onSubmit={porEmail} className="card space-y-3">
          <p className="text-sm text-muted">Mandamos um link para definir uma nova senha. Se não chegar, peça ao administrador um link novo.</p>
          <div>
            <label htmlFor="email" className="label">
              E-mail
            </label>
            <input id="email" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn w-full" disabled={enviando}>
            Enviar link
          </button>
        </form>
      ) : (
        <form onSubmit={porCodigo} className="card space-y-3">
          <p className="text-sm text-muted">Use um dos códigos de recuperação que você guardou. Cada código vale uma vez.</p>
          <div>
            <label htmlFor="email2" className="label">
              E-mail
            </label>
            <input id="email2" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="codigo" className="label">
              Código (XXXX-XXXX-XXXX)
            </label>
            <input id="codigo" required maxLength={20} autoComplete="one-time-code" className="input font-mono uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nova" className="label">
              Nova senha (12 ou mais caracteres)
            </label>
            <input id="nova" type="password" required minLength={12} autoComplete="new-password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <div>
            <label htmlFor="confirma" className="label">
              Repita a nova senha
            </label>
            <input id="confirma" type="password" required autoComplete="new-password" className="input" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
          </div>
          <button type="submit" className="btn w-full" disabled={enviando}>
            Trocar senha e entrar
          </button>
        </form>
      )}
      <Link href="/admin" className="text-sm text-muted underline">
        Voltar ao login
      </Link>
    </main>
  );
}
