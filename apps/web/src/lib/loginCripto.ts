const PEM_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_FOOTER = "-----END PUBLIC KEY-----";

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem.replace(PEM_HEADER, "").replace(PEM_FOOTER, "").replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Criptografa a senha com a chave pública RSA-OAEP do back-end antes de enviar no login —
 * assim o texto puro nunca aparece no payload construído pelo navegador (Network do DevTools,
 * extensão maliciosa, proxy que termine TLS antes da hora). Complementa o HTTPS, não substitui.
 */
export async function encryptPassword(publicKeyPem: string, password: string): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(publicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const encoded = new TextEncoder().encode(password);
  const ciphertext = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, encoded);
  return arrayBufferToBase64(ciphertext);
}

/** Login no esquema do gestor: busca a chave pública da API e manda a senha cifrada. */
export async function entrarComSenha(email: string, senha: string): Promise<void> {
  const { api } = await import("./api");
  const { chavePublica } = await api.get<{ chavePublica: string }>("/auth/chave-publica");
  const senhaCifrada = await encryptPassword(chavePublica, senha);
  await api.post("/auth/entrar", { email, senhaCifrada });
}
