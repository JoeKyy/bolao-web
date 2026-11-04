"use client";
import type { ConviteOrganizadorCriado, Eu, OrganizadorDTO } from "@bolao/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Aviso, BotaoCopiar, Carregando, ErroDeCarga, Secao } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { formatarDataHora } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";

/** Link gerado: aparece uma vez só, para o administrador repassar. */
function LinkGerado({ titulo, convite, nome }: { titulo: string; convite: ConviteOrganizadorCriado; nome: string }) {
  const link = `${window.location.origin}/organizador/${convite.token}`;
  const msg = `${nome}, este é o seu link para ${titulo.toLowerCase()} no Bolão da Mega (vale até ${formatarDataHora(convite.expiraEm)}, uso único): ${link}`;
  return (
    <div className="space-y-2 rounded-xl border border-brand/30 bg-brand-soft p-3">
      <p className="text-sm font-semibold text-brand-dark">{titulo}: link para {nome}</p>
      <p className="break-all rounded-lg bg-white p-2 font-mono text-xs">{link}</p>
      <div className="flex flex-wrap gap-2">
        <BotaoCopiar texto={link} rotulo="Copiar link" />
        <a className="btn-ghost" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
          Enviar pelo WhatsApp
        </a>
      </div>
      <p className="text-xs text-brand-dark/80">O link vale 7 dias e só pode ser usado uma vez. Ele não aparece de novo: se perder, gere outro.</p>
    </div>
  );
}

export default function Organizadores() {
  const router = useRouter();
  const eu = useRecurso<Eu>("/auth/eu");
  const { dados, erro, carregando, recarregar } = useRecurso<OrganizadorDTO[]>("/organizadores");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [aviso, setAviso] = useState<{ erro?: string; ok?: string }>({});
  const [gerado, setGerado] = useState<{ titulo: string; convite: ConviteOrganizadorCriado; nome: string } | null>(null);

  useEffect(() => {
    if (erro?.status === 401) router.replace("/admin");
  }, [erro, router]);

  if (carregando || erro?.status === 401) return <Carregando />;
  if (erro?.status === 403) return <main className="mx-auto max-w-2xl px-4 py-10"><Aviso erro="Só o administrador gerencia organizadores." /></main>;
  if (erro) return <main className="mx-auto max-w-2xl px-4 py-10"><ErroDeCarga mensagem={erro.message} tentar={recarregar} /></main>;

  async function convidar(e: FormEvent) {
    e.preventDefault();
    try {
      const convite = await api.post<ConviteOrganizadorCriado>("/organizadores/convites", { email, nome });
      setGerado({ titulo: "Criar a conta", convite, nome });
      setAviso({});
      setEmail("");
      setNome("");
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
    }
  }
  async function novoLink(o: OrganizadorDTO) {
    try {
      const convite = await api.post<ConviteOrganizadorCriado>(`/organizadores/${o.id}/link`);
      setGerado({ titulo: o.pendente ? "Criar a conta" : "Trocar a senha", convite, nome: o.nome });
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
    }
  }
  async function alternar(o: OrganizadorDTO) {
    if (o.ativo && !window.confirm(`Desativar ${o.nome}? A sessão dele cai na hora e ele não entra mais (os bolões continuam guardados).`)) return;
    try {
      await api.post(`/organizadores/${o.id}/ativo`, { ativo: !o.ativo });
      setAviso({ ok: o.ativo ? `${o.nome} desativado.` : `${o.nome} reativado.` });
      await recarregar();
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-10">
      <Link href="/admin" className="text-sm font-semibold text-brand">
        ← Meus bolões
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Organizadores</h1>
        <p className="text-sm text-muted">
          Cada organizador é o tesoureiro dos próprios bolões: só ele configura o Pix, manda os convites, confirma pagamentos, exporta e registra os jogos.
          Você gerencia as contas, mas não vê os bolões dos outros.
        </p>
      </header>
      <Aviso erro={aviso.erro} ok={aviso.ok} />
      {gerado && <LinkGerado {...gerado} />}

      <Secao titulo="Convidar organizador" id="convidar">
        <form onSubmit={convidar} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input aria-label="Nome" required minLength={2} maxLength={60} placeholder="Nome" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input aria-label="E-mail" type="email" required maxLength={120} placeholder="E-mail" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn">
            Gerar convite
          </button>
        </form>
      </Secao>

      <Secao titulo="Contas" id="contas">
        <ul className="divide-y divide-line">
          {dados?.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {o.nome || o.email}
                  {o.papel === "ADMIN" && <span className="chip ml-2 bg-foreground text-white">admin</span>}
                  {!o.ativo && <span className="chip ml-2 bg-red-100 text-red-800">desativado</span>}
                  {o.ativo && o.pendente && <span className="chip ml-2 bg-amber-100 text-amber-800">convite pendente</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {o.email} · {o.boloes} bolão(ões) · desde {formatarDataHora(o.criadoEm).slice(0, 10)}
                </p>
              </div>
              {o.id !== eu.dados?.id && (
                <div className="flex gap-2">
                  {o.ativo && (
                    <button type="button" className="btn-ghost" onClick={() => novoLink(o)}>
                      {o.pendente ? "Reenviar convite" : "Link de nova senha"}
                    </button>
                  )}
                  <button type="button" className={o.ativo ? "btn-danger" : "btn-ghost"} onClick={() => alternar(o)}>
                    {o.ativo ? "Desativar" : "Reativar"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Secao>
    </main>
  );
}
