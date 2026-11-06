import { describe, expect, it } from "vitest";
import { EMAIL_PATTERN, WHATSAPP_PATTERN, formatarWhatsapp } from "./contato";

const whats = (v: string) => new RegExp(`^(?:${WHATSAPP_PATTERN})$`).test(v);
const email = (v: string) => new RegExp(`^(?:${EMAIL_PATTERN})$`).test(v);

describe("WhatsApp", () => {
  it("aceita celular e fixo com DDD, em vários formatos", () => {
    for (const v of ["(11) 91234-5678", "11912345678", "11 9 1234-5678", "+55 11 91234-5678", "5511912345678", "(11) 3333-4444", "1133334444"]) {
      expect(whats(v)).toBe(true);
    }
  });
  it("recusa o que não é telefone brasileiro", () => {
    for (const v of ["119999999999999", "123", "99999-9999", "(00) 91234-5678", "(11) 81234-56789", "11812345678", "abcdefghijk"]) {
      expect(whats(v)).toBe(false);
    }
  });
  it("máscara: formata enquanto digita sem esconder dígitos a mais", () => {
    expect(formatarWhatsapp("")).toBe("");
    expect(formatarWhatsapp("1")).toBe("(1");
    expect(formatarWhatsapp("11")).toBe("(11");
    expect(formatarWhatsapp("119")).toBe("(11) 9");
    expect(formatarWhatsapp("1133334444")).toBe("(11) 3333-4444");
    expect(formatarWhatsapp("11912345678")).toBe("(11) 91234-5678");
    expect(formatarWhatsapp("119999999999999")).toBe("(11) 99999-9999 9999"); // a sobra aparece e o campo fica inválido
    expect(whats(formatarWhatsapp("119999999999999"))).toBe(false);
    expect(formatarWhatsapp("+55 11 91234-5678")).toBe("(11) 91234-5678");
  });
});

describe("e-mail", () => {
  it("exige domínio com ponto", () => {
    for (const v of ["nome@exemplo.com", "a.b+c@sub.dominio.com.br"]) expect(email(v)).toBe(true);
    for (const v of ["a@b", "sem-arroba.com", "a@b.c", "a b@exemplo.com", "@exemplo.com"]) expect(email(v)).toBe(false);
  });
});
