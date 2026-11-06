import Link from "next/link";
import { Casca } from "@/components/Casca";

export default function Inicio() {
  return (
    <Casca largura="estreita" centro>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Mega-Sena</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Bolão da Mega</h1>
        <p className="mt-3 text-muted">
          Cada grupo tem o seu bolão: escolha seus jogos (ou peça uma surpresinha), pague por Pix e acompanhe a conferência e o rateio.
        </p>
      </div>
      <div className="card text-sm text-muted">
        <p className="font-semibold text-foreground">Recebeu um link de convite?</p>
        <p className="mt-1">Abra o link que o organizador mandou no grupo para entrar no seu bolão.</p>
      </div>
      <Link href="/admin" className="btn-ghost self-start">
        Sou o organizador
      </Link>
    </Casca>
  );
}
