"use client";
import "./globals.css";

/** Último recurso: o próprio layout falhou. Sem componentes compartilhados, só HTML e tokens. */
export default function ErroGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="grid min-h-dvh place-items-center px-4">
        <div role="alert" className="card max-w-md space-y-3 text-center">
          <h1 className="titulo-2">Algo deu errado</h1>
          <p className="text-muted">Não foi possível abrir o aplicativo. Tente de novo em instantes.</p>
          <button type="button" className="btn" onClick={reset}>
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
