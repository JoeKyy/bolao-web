import Link from "next/link";
import type { ReactNode } from "react";
import { AlternarTema } from "./AlternarTema";

const LARGURA = {
  estreita: "max-w-md",
  media: "max-w-2xl",
  larga: "max-w-5xl",
} as const;

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-controle font-bold tracking-tight text-foreground">
      <span aria-hidden="true" className="grid h-7 w-7 grid-cols-3 place-items-center gap-px rounded-lg bg-brand p-1">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-fg/90" />
        ))}
      </span>
      <span className="text-h3">Bolão da Mega</span>
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
      <header className="nao-imprimir border-b border-line bg-card/80 backdrop-blur">
        <div className={`mx-auto flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 ${largura === "larga" ? "max-w-5xl" : "max-w-2xl"}`}>
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
