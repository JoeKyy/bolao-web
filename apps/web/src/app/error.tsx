"use client";
import { Casca } from "@/components/Casca";
import { ErroDeCarga } from "@/components/ui";

/** Erro inesperado ao desenhar a tela. Nunca mostra o texto do erro (pode conter dados internos). */
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Casca largura="estreita" centro>
      <ErroDeCarga status={500} tentar={reset} voltar={{ href: "/", rotulo: "Ir para o início" }} />
    </Casca>
  );
}
