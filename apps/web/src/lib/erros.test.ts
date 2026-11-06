import { describe, expect, it } from "vitest";
import { variante } from "./erros";

describe("variante de erro", () => {
  it("escolhe o título pelo status", () => {
    expect(variante(0).titulo).toBe("Sem conexão");
    expect(variante(401).titulo).toBe("Sua sessão acabou");
    expect(variante(403).titulo).toBe("Sem permissão");
    expect(variante(404).titulo).toBe("Não encontrado");
    expect(variante(429).titulo).toBe("Muitas tentativas");
    expect(variante(502).titulo).toBe("Estamos com instabilidade");
  });
  it("cai no genérico sem status ou com status desconhecido", () => {
    expect(variante().titulo).toBe("Algo deu errado");
    expect(variante(418).titulo).toBe("Algo deu errado");
  });
  it("sempre traz ícone e orientação", () => {
    for (const s of [undefined, 0, 401, 403, 404, 429, 500]) {
      const v = variante(s);
      expect(v.icone.length).toBeGreaterThan(0);
      expect(v.dica.length).toBeGreaterThan(0);
    }
  });
});
