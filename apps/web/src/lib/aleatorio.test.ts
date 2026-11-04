import { describe, expect, it } from "vitest";
import { surpresinha, validarDezenas } from "@bolao/shared";
import { aleatorio } from "./aleatorio";

describe("aleatorio e surpresinha no navegador", () => {
  it("fica no intervalo", () => {
    for (let i = 0; i < 2000; i++) {
      const v = aleatorio(60);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(60);
    }
  });
  it("surpresinha válida para 6 a 20 dezenas", () => {
    for (let k = 6; k <= 20; k++) expect(validarDezenas(surpresinha(k, aleatorio), { min: k, max: k }).ok).toBe(true);
  });
});
