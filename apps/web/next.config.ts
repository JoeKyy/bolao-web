import type { NextConfig } from "next";

const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333").origin;
const PRODUCAO = process.env.NODE_ENV === "production";

/**
 * CSP (BOL-08). O Next injeta scripts inline para hidratar, então `script-src` ainda precisa de
 * 'unsafe-inline' sem nonce. A política estrita (nonce + strict-dynamic) vai primeiro em
 * Report-Only, como no AUD-22 do gestor; esta já fecha o resto: nada de iframe, de objeto, de
 * formulário para fora e de conexão a outro domínio além da API.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${PRODUCAO ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@bolao/shared"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // O token do convite está na URL: nunca mandar o endereço para outro site.
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...(PRODUCAO ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
