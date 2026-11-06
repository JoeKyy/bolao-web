import Link from "next/link";
import type { ReactNode } from "react";
import { AlternarTema } from "./AlternarTema";
import { MenuUsuario } from "./MenuUsuario";

const LARGURA = {
  estreita: "max-w-md",
  media: "max-w-2xl",
  larga: "max-w-5xl",
} as const;

/** Marca: bola da Mega-Sena com a placa do "6" (as seis dezenas); a bolinha dourada é o prêmio. */
export function Logo({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 40 40">
      <defs>
        <radialGradient id="bolao-esfera" cx="34%" cy="28%" r="80%">
          <stop offset="0" stopColor="#35c685" />
          <stop offset=".55" stopColor="#087a4f" />
          <stop offset="1" stopColor="#04553a" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#bolao-esfera)" />
      <ellipse cx="12.5" cy="9.5" rx="5.2" ry="2.6" fill="#fff" opacity=".28" transform="rotate(-35 12.5 9.5)" />
      <circle cx="20" cy="21" r="10" fill="#fff" />
      <text x="20" y="26.6" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#087a4f" style={{ fontFamily: "var(--font-figtree), system-ui, sans-serif" }}>
        6
      </text>
      <circle cx="34" cy="7" r="4" fill="#f4b323" />
      <circle cx="33" cy="6" r="1.2" fill="#fff" opacity=".7" />
    </svg>
  );
}

function Marca() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded-controle text-foreground sm:gap-2.5">
      <Logo />
      <span className="whitespace-nowrap text-h3 font-extrabold tracking-tight sm:text-h2">
        bolão<span className="text-brand"> da mega</span>
      </span>
    </Link>
  );
}

/**
 * Casca comum das telas: cabeçalho com a marca, conteúdo com largura de leitura confortável e rodapé.
 * `estreita` para formulários, `media` para o painel do bolão, `larga` para áreas com coluna lateral.
 * `centro` centraliza o conteúdo na vertical (login, convite).
 */
export function Casca({
  largura = "media",
  centro = false,
  acoes,
  menu = false,
  children,
}: {
  largura?: keyof typeof LARGURA;
  centro?: boolean;
  acoes?: ReactNode;
  /** Mostra o menu da conta (avatar, atalhos, sair). Use nas telas de quem está logado. */
  menu?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="nao-imprimir sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
        <div className={`mx-auto flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 ${largura === "larga" ? "max-w-5xl" : "max-w-2xl"}`}>
          <Marca />
          <div className="flex items-center gap-3">
            {acoes}
            <AlternarTema />
            {menu && <MenuUsuario />}
          </div>
        </div>
      </header>
      <main className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 ${LARGURA[largura]} ${centro ? "justify-center" : ""}`}>{children}</main>
      <footer className="nao-imprimir px-4 py-6 text-center legenda">
        O Bolão da Mega só organiza o grupo. Não vende apostas, não recebe dinheiro e não confere Pix.
      </footer>
    </div>
  );
}
