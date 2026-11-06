"use client";
import { useEffect, useState } from "react";
import { CHAVE } from "@/lib/tema";

type Escolha = "sistema" | "claro" | "escuro";

function aplicar(e: Escolha) {
  const raiz = document.documentElement;
  if (e === "sistema") raiz.removeAttribute("data-tema");
  else raiz.setAttribute("data-tema", e);
  try {
    if (e === "sistema") localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, e);
  } catch {
    /* navegação privada: vale só nesta visita */
  }
}

const ICONES: Record<Escolha, string> = {
  sistema: "M4 5h16v11H4zM9 20h6M12 16v4",
  claro: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  escuro: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
};
const ROTULOS: Record<Escolha, string> = { sistema: "Seguir o sistema", claro: "Tema claro", escuro: "Tema escuro" };

/** Controle de tema: segue o sistema por padrão; a escolha manual fica salva neste aparelho. */
export function AlternarTema() {
  const [escolha, setEscolha] = useState<Escolha>("sistema");
  useEffect(() => {
    const salvo = document.documentElement.getAttribute("data-tema");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o DOM uma vez ao montar
    setEscolha(salvo === "claro" || salvo === "escuro" ? salvo : "sistema");
  }, []);
  return (
    <div role="group" aria-label="Aparência" className="nao-imprimir inline-flex rounded-full border border-line bg-surface-2 p-0.5">
      {(Object.keys(ICONES) as Escolha[]).map((e) => (
        <button
          key={e}
          type="button"
          aria-pressed={escolha === e}
          aria-label={ROTULOS[e]}
          title={ROTULOS[e]}
          onClick={() => {
            setEscolha(e);
            aplicar(e);
          }}
          className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
            escolha === e ? "bg-card text-foreground shadow-card" : "text-muted hover:text-foreground"
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONES[e]} />
          </svg>
        </button>
      ))}
    </div>
  );
}
