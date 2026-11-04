"use client";
import type { ConviteOrganizadorCriado, Eu, UsuarioDTO } from "@bolao/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Aviso, BotaoCopiar, Campo, Carregando, ErroDeCarga, Secao } from "@/components/ui";
import { api, mensagemDe } from "@/lib/api";
import { formatarDataHora } from "@/lib/datas";
import { useRecurso } from "@/lib/useRecurso";
import { useValidacao } from "@/lib/validacao";

/** Link gerado: aparece uma vez só, para o administrador repassar. */
function LinkGerado({ titulo, convite, nome }: { titulo: string; convite: ConviteOrganizadorCriado; nome: string }) {
  const link = `${window.location.origin}/organizador/${convite.token}`;
  const msg = `${nome}, este é o seu link para ${titulo.toLowerCase()} no Bolão da Mega (vale até ${formatarDataHora(convite.expiraEm)}, uso único): ${link}`;
  return (
    <div className="space-y-2 rounded-xl border border-brand/30 bg-brand-soft p-3">
      <p className="text-sm font-semibold text-brand-dark">
        {titulo}: link para {nome}
      </p>
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

function Perfil({ rotulo, dica, marcado, desabilitado, onChange }: { rotulo: string; dica: string; marcado: boolean; desabilitado?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-start gap-2 text-sm ${desabilitado ? "opacity-60" : ""}`}>
      <input type="checkbox" className="mt-1" checked={marcado} disabled={desabilitado} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium">{rotulo}</span>
        <span className="block text-xs text-muted">{dica}</span>
      </span>
    </label>
  );
}

const DICA_ADMIN = "Gerencia as contas e os perfis. Não tem acesso direto aos bolões dos outros, e tudo o que fizer sobre uma conta fica registrado para a pessoa ver.";
const DICA_TESOUREIRO = "Cria e administra os próprios bolões: Pix, convites, pagamentos, exportação e registro dos jogos.";

/** Página Usuários (como no gestor): perfis por pessoa. Só o perfil Administrador chega aqui. */
export default function Usuarios() {
  const router = useRouter();
  const eu = useRecurso<Eu>("/auth/eu");
  const { dados, erro, carregando, recarregar } = useRecurso<UsuarioDTO[]>("/usuarios");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [admin, setAdmin] = useState(false);
  const [tesoureiro, setTesoureiro] = useState(true);
  const v = useValidacao();
  const [aviso, setAviso] = useState<{ erro?: string; ok?: string }>({});
  const [gerado, setGerado] = useState<{ titulo: string; convite: ConviteOrganizadorCriado; nome: string } | null>(null);

  useEffect(() => {
    if (erro?.status === 401) router.replace("/admin");
  }, [erro, router]);

  if (carregando || erro?.status === 401) return <Carregando />;
  if (erro?.status === 403) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Aviso erro="Só o administrador gerencia usuários." />
      </main>
    );
  }
  if (erro) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <ErroDeCarga mensagem={erro.message} tentar={recarregar} />
      </main>
    );
  }

  const faz = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) setAviso({ ok });
      await Promise.all([recarregar(), eu.recarregar()]);
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
    }
  };
  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAviso({});
    if (!v.validar(e)) return;
    try {
      const convite = await api.post<ConviteOrganizadorCriado>("/usuarios", { email, nome, admin, tesoureiro });
      setGerado({ titulo: "Criar a conta", convite, nome });
      setAviso({});
      setEmail("");
      setNome("");
      setAdmin(false);
      setTesoureiro(true);
      await recarregar();
    } catch (err) {
      if (!v.doServidor(err, { nome: "nome-conta", email: "email-conta" })) setAviso({ erro: mensagemDe(err) });
    }
  }
  async function novoLink(u: UsuarioDTO) {
    try {
      const convite = await api.post<ConviteOrganizadorCriado>(`/usuarios/${u.id}/link`);
      setGerado({ titulo: u.pendente ? "Criar a conta" : "Trocar a senha", convite, nome: u.nome });
    } catch (err) {
      setAviso({ erro: mensagemDe(err) });
    }
  }
  const alternarAtivo = (u: UsuarioDTO) => {
    if (u.ativo && !window.confirm(`Desativar ${u.nome}? A sessão cai na hora e a pessoa não entra mais (os bolões continuam guardados).`)) return;
    void faz(() => api.post(`/usuarios/${u.id}/ativo`, { ativo: !u.ativo }), u.ativo ? `${u.nome} desativado.` : `${u.nome} reativado.`);
  };
  const mudarPerfil = (u: UsuarioDTO, perfil: "admin" | "tesoureiro", valor: boolean) => {
    if (u.id === eu.dados?.id && perfil === "admin" && !valor && !window.confirm("Tirar o seu próprio perfil de administrador? Você perde o acesso a esta página.")) return;
    void faz(() => api.patch(`/usuarios/${u.id}/perfis`, { [perfil]: valor }), "Perfis atualizados.");
  };

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-10">
      <Link href="/admin" className="text-sm font-semibold text-brand">
        ← Início
      </Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted">
          Os perfis se combinam: uma pessoa pode ser administradora, tesoureira, as duas coisas ou nenhuma (só participa de bolões). Sempre precisa existir ao menos um administrador ativo.
        </p>
      </header>
      <Aviso erro={aviso.erro ?? v.resumo} ok={aviso.ok} />
      {gerado && <LinkGerado {...gerado} />}

      <Secao titulo="Nova conta" id="nova">
        <form onSubmit={criar} noValidate className="space-y-3">
          <div className="grid items-start gap-2 sm:grid-cols-2">
            <Campo id="nome-conta" rotulo="Nome" erro={v.erros["nome-conta"]} limpar={v.limpar}>
              <input required minLength={2} maxLength={60} placeholder="Nome da pessoa" className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
            </Campo>
            <Campo id="email-conta" rotulo="E-mail" erro={v.erros["email-conta"]} limpar={v.limpar}>
              <input type="email" required maxLength={120} placeholder="nome@exemplo.com" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Campo>
          </div>
          <div className="space-y-2">
            <Perfil rotulo="Tesoureiro" dica={DICA_TESOUREIRO} marcado={tesoureiro} onChange={setTesoureiro} />
            <Perfil rotulo="Administrador" dica={DICA_ADMIN} marcado={admin} onChange={setAdmin} />
          </div>
          <button type="submit" className="btn">
            Criar conta e gerar link
          </button>
        </form>
      </Secao>

      <Secao titulo="Contas" id="contas">
        <ul className="divide-y divide-line">
          {dados?.map((u) => {
            const sou = u.id === eu.dados?.id;
            return (
              <li key={u.id} className="space-y-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {u.nome || u.email}
                    {sou && <span className="ml-2 text-xs text-muted">(você)</span>}
                    {!u.ativo && <span className="chip ml-2 bg-red-100 text-red-800">desativado</span>}
                    {u.ativo && u.pendente && <span className="chip ml-2 bg-amber-100 text-amber-800">convite pendente</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {u.email} · {u.boloes} bolão(ões) como tesoureiro · participa de {u.participacoes} · desde {formatarDataHora(u.criadoEm).slice(0, 10)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Perfil rotulo="Tesoureiro" dica="" marcado={u.tesoureiro} desabilitado={!u.ativo} onChange={(v) => mudarPerfil(u, "tesoureiro", v)} />
                  <Perfil rotulo="Administrador" dica="" marcado={u.admin} desabilitado={!u.ativo} onChange={(v) => mudarPerfil(u, "admin", v)} />
                  {!u.admin && !u.tesoureiro && <span className="text-xs text-muted">Pessoa comum: só participa de bolões.</span>}
                </div>
                {!sou && (
                  <div className="flex flex-wrap gap-2">
                    {u.ativo && (
                      <button type="button" className="btn-ghost" onClick={() => novoLink(u)}>
                        {u.pendente ? "Reenviar convite" : "Link de nova senha"}
                      </button>
                    )}
                    <button type="button" className={u.ativo ? "btn-danger" : "btn-ghost"} onClick={() => alternarAtivo(u)}>
                      {u.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Secao>
    </main>
  );
}
