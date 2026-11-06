import Link from "next/link";
import type { ReactNode } from "react";
import { AlternarTema } from "./AlternarTema";

const LARGURA = {
  estreita: "max-w-md",
  media: "max-w-2xl",
  larga: "max-w-5xl",
} as const;

/** Marca: a bola da Mega com as seis dezenas; a dourada é a que paga o prêmio. */
export function Logo({ tamanho = 36 }: { tamanho?: number }) {
  const pontos = [
    [11, 12],
    [20, 12],
    [29, 12],
    [11, 24],
    [20, 24],
  ];
  return (
    <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="20" fill="var(--brand)" />
      {pontos.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill="var(--brand-fg)" />
      ))}
      <circle cx="29" cy="24" r="3.6" fill="#f4b323" />
    </svg>
  );
}

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-controle text-foreground">
      <Logo />
      <span className="text-h2 font-extrabold tracking-tight">
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
  children,
}: {
  largura?: keyof typeof LARGURA;
  centro?: boolean;
  acoes?: ReactNode;
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
