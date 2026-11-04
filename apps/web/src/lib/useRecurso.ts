"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErroDaApi, api } from "./api";

interface Estado<T> {
  caminho: string | null;
  dados: T | null;
  erro: ErroDaApi | null;
}

/**
 * Lê um recurso da API (GET caminho) e expõe recarregar(), que resolve depois da nova leitura.
 * Falha de leitura aparece como erro, nunca como lista vazia.
 */
export function useRecurso<T>(caminho: string) {
  const [estado, setEstado] = useState<Estado<T>>({ caminho: null, dados: null, erro: null });
  const [versao, setVersao] = useState(0);
  const pendentes = useRef<(() => void)[]>([]);

  useEffect(() => {
    let vivo = true;
    const fim = () => {
      const r = pendentes.current;
      pendentes.current = [];
      r.forEach((f) => f());
    };
    api.get<T>(caminho).then(
      (dados) => {
        if (vivo) setEstado({ caminho, dados, erro: null });
        fim();
      },
      (e: unknown) => {
        if (vivo) setEstado((s) => ({ caminho, dados: s.caminho === caminho ? s.dados : null, erro: e instanceof ErroDaApi ? e : new ErroDaApi(0, "erro", "Algo deu errado. Tente de novo.") }));
        fim();
      },
    );
    return () => {
      vivo = false;
    };
  }, [caminho, versao]);

  const recarregar = useCallback(
    () =>
      new Promise<void>((resolver) => {
        pendentes.current.push(resolver);
        setVersao((v) => v + 1);
      }),
    [],
  );

  const atual = estado.caminho === caminho;
  return {
    dados: atual ? estado.dados : null,
    erro: atual ? estado.erro : null,
    carregando: !atual,
    recarregar,
  };
}
