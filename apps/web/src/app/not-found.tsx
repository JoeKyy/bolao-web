import { Casca } from "@/components/Casca";
import { ErroDeCarga } from "@/components/ui";

export default function NaoEncontradaPagina() {
  return (
    <Casca largura="estreita" centro>
      <ErroDeCarga status={404} voltar={{ href: "/", rotulo: "Ir para o início" }} />
    </Casca>
  );
}
