"use client";
import type { Eu } from "@bolao/shared";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useRecurso } from "@/lib/useRecurso";

const inicial = (e: Eu) => (e.nome || e.email).trim().charAt(0).toUpperCase();

/**
 * Menu da conta no cabeçalho (como nos apps de reserva): avatar com a inicial, nome e um painel com
 * e-mail, atalhos e "Sair". Só aparece para quem está logado; some em silêncio para visitantes.
 */
export function MenuUsuario() {
  const { dados: eu } = useRecurso<Eu>("/auth/eu");
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  if (!eu) return null;

  async function sair() {
    await api.post("/auth/sair").catch(() => undefined);
    // Recarga completa de propósito: limpa todo estado em memória da sessão que acabou.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/admin");
  }

  const item = "flex min-h-11 w-full items-center rounded-controle px-3 text-left text-body font-medium hover:bg-surface-2";
  return (
    <div ref={raiz} className="nao-imprimir relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 shadow-card transition-colors hover:border-foreground/30"
      >
        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-brand text-body font-bold text-brand-fg">
          {inicial(eu)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-body font-medium sm:block">{eu.nome.split(" ")[0] || eu.email}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${aberto ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="sr-only">Menu da conta</span>
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 animate-entrar rounded-cartao border border-line bg-card p-2 shadow-float">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate font-semibold">{eu.nome || "Minha conta"}</p>
            <p className="legenda truncate">{eu.email}</p>
          </div>
          <div className="pt-2">
            <Link role="menuitem" href="/admin" className={`${item} text-foreground`} onClick={() => setAberto(false)}>
              Meus bolões
            </Link>
            {eu.admin && (
              <Link role="menuitem" href="/admin/usuarios" className={`${item} text-foreground`} onClick={() => setAberto(false)}>
                Usuários
              </Link>
            )}
            <button type="button" role="menuitem" className={`${item} text-danger-fg`} onClick={sair}>
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
