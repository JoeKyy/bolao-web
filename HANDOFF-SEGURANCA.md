# Handoff: segurança e confiabilidade (front)

Aberto em 04/11/2026. A API e os achados BOL-01 a BOL-10 estão em `../back-bolao/HANDOFF-SEGURANCA.md`. Mesmo fluxo obrigatório (branch, `dev`, `homolog`, validação do Joe, `main`; produção só com ordem no chat; publicar a API antes do front).

| ID | Gravidade | Item | Estado | Local | Homolog | Produção |
|---|---|---|---|---|---|---|
| WEB-01 | Média, P1 | Mensagens só do servidor e sempre como texto (React escapa); nenhuma mensagem lida da URL (BOL-03). | feito | testado | pendente | pendente |
| WEB-02 | Média, P2 | Cabeçalhos: CSP (`connect-src` só self e API, `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`), `Referrer-Policy: no-referrer` (o token do convite está na URL), nosniff, DENY, Permissions-Policy, HSTS em produção, sem `X-Powered-By`. | feito | testado | pendente | pendente |
| WEB-03 | Média, P2 | CSP ainda com `script-src 'unsafe-inline'` (scripts de hidratação do Next). Próximo passo: nonce + `strict-dynamic` em Report-Only, medir e promover (como AUD-22). | pendente | n/a | pendente | pendente |
| WEB-04 | Baixa, P2 | Surpresinha com `crypto.getRandomValues` e rejeição (sem viés); a API valida de novo. | feito | testado | pendente | pendente |
| WEB-05 | Média, P2 | Contrato: `packages/shared/src/{regras,tipos}.ts` idênticos aos do back; `pnpm contrato:conferir` falha se mudarem sem regerar. Deploy deve comparar com `GET /saude/contrato` da API. | parcial | testado | pendente | pendente |
| WEB-06 | Média, P2 | CI (lint, typecheck, test, contrato, build, audit) e verificação de saúde pós-deploy. | pendente | n/a | pendente | pendente |

## Evidências (04/11/2026, local)

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (2), `pnpm contrato:conferir` e `pnpm build` ok (Next 16.4.5).
- Telas conferidas em navegador (Chrome headless, 390 px e 1280 px): convite, painel, surpresinha, Pix com QR, calculadora, gestão, modo digitação, resultado da Caixa, folha para lotérica.

## Ambientes

- Local: `pnpm dev` em localhost:3000 com `NEXT_PUBLIC_API_URL=http://localhost:3333` (`apps/web/.env.local`).

## Perfis, login e auditoria (04/11/2026)

| ID | Item | Estado |
|---|---|---|
| WEB-07 | Login com senha cifrada (RSA-OAEP, portado do gestor), "Esqueci minha senha" e recuperação por código | feito, testado no navegador |
| WEB-08 | Página Usuários com caixas de perfil (tesoureiro, administrador), criação de conta com perfis, aviso do último administrador | feito, testado no navegador |
| WEB-09 | Tela inicial por perfil ("Bolões que eu administro" só para tesoureiro; "Bolões de que eu participo" para todos), convite do bolão logado sem pedir nome, "Guardar na minha conta" | feito |
| WEB-10 | Confirmação (`?confirmar=1`) também para resultado já lançado; data do sorteio no formulário de concurso normal; texto da calculadora por tipo; "Atividade da conta" | feito |

Pendente: CI, nonce na CSP (WEB-03) e `NEXT_PUBLIC_API_URL` de produção no build.
