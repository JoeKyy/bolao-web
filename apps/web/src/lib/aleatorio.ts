/** Inteiro uniforme em [0, n) com crypto.getRandomValues (rejeição para não ter viés). */
export function aleatorio(n: number): number {
  if (!Number.isInteger(n) || n <= 0 || n > 2 ** 32) throw new Error("n inválido");
  const limite = Math.floor(2 ** 32 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limite) return buf[0] % n;
  }
}
