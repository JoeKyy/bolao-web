# Bolão da Mega: Front-end (`bolao-web`)

Interface web do **Bolão da Mega**, um organizador de bolões informais da Mega-Sena (primeiro alvo: **Mega da Virada 2026**, sorteio em 01/01/2027, 10h de Brasília). Este repositório é o **front-end**. A API fica em [`JoeKyy/back-bolao`](https://github.com/JoeKyy/back-bolao).

> **O aplicativo só organiza.** Ele não vende aposta, não recebe dinheiro e não verifica Pix. O tesoureiro recebe o Pix na conta dele, confirma os pagamentos na mão, exporta os jogos e os registra na Caixa (app ou lotérica).

Endereços:

| | Produção | Homologação |
|---|---|---|
| Front | https://bolao.joekyy.com.br | https://homolog-bolao.joekyy.com.br |
| API que ele chama | https://api.bolao.joekyy.com.br | https://api.homolog-bolao.joekyy.com.br |

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Stack](#2-stack)
3. [Estrutura do repositório](#3-estrutura-do-repositório)
4. [Telas e rotas](#4-telas-e-rotas)
5. [Componentes e bibliotecas internas](#5-componentes-e-bibliotecas-internas)
6. [Formulários e validação](#6-formulários-e-validação)
7. [Como o front conversa com a API](#7-como-o-front-conversa-com-a-api)
8. [Segurança](#8-segurança)
9. [Configuração](#9-configuração)
10. [Rodando localmente](#10-rodando-localmente)
11. [Testes e qualidade](#11-testes-e-qualidade)
12. [Contrato com a API](#12-contrato-com-a-api)
13. [Build, Docker e CI/CD](#13-build-docker-e-cicd)
14. [Operação](#14-operação)
15. [Documentos relacionados](#15-documentos-relacionados)

---

## 1. Visão geral

O front é uma aplicação **Next.js (App Router) renderizada no cliente** que fala **direto com a API** pelo navegador, com cookie de sessão. Não há back-end próprio no Next: ele só serve as páginas.

```
Navegador ──HTTPS──► nginx do CloudPanel ──► container web (Next.js standalone, 127.0.0.1:3000)
    │
    └── fetch com cookie (credentials: include) ──► api.bolao.joekyy.com.br (NestJS)
```

Três tipos de pessoa usam o front, e cada uma tem o seu caminho:

| Quem | Como entra | O que faz |
|---|---|---|
| **Participante** | Pelo link de convite do bolão (`/entrar/<token>`), com ou sem conta | Escolhe os jogos (com surpresinha), vê quanto deve, paga o Pix, acompanha o resultado e simula o prêmio. |
| **Tesoureiro** (organizador do bolão) | Login em `/admin` | Cria o bolão, configura o Pix, convida, confirma pagamentos, exporta e registra os jogos, lança o resultado. |
| **Administrador** | Login em `/admin` | Gerencia contas e perfis em `/admin/usuarios` e gera links de acesso. Pode também ser tesoureiro. |

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS 4 (tokens em `globals.css`) |
| Pix | `qrcode` (QR do Pix copia e cola) |
| Código compartilhado | pacote de workspace `@bolao/shared` (regras e tipos idênticos aos da API) |
| Testes | Vitest |
| Gerenciador | pnpm 11 (monorepo com `apps/web` e `packages/shared`) |
| Empacotamento | Docker multi-stage, saída `standalone` do Next |
| CI/CD | GitHub Actions, deploy por SSH com comando forçado |

## 3. Estrutura do repositório

```
bolao-web/
├── README.md                     Este arquivo
├── HANDOFF-SEGURANCA.md          Padrão de segurança e achados de auditoria
├── Dockerfile                    Imagem do front (multi-stage; recebe NEXT_PUBLIC_API_URL no build)
├── docker-compose.yml            Container web (network_mode host, 256 MB, healthcheck)
├── package.json, pnpm-*.yaml     Raiz do workspace e scripts
│
├── apps/
│   └── web/                      A aplicação Next.js
│       ├── next.config.ts        CSP, cabeçalhos de segurança, output standalone, build exige API
│       ├── .env.local.example    NEXT_PUBLIC_API_URL
│       ├── vitest.config.ts, eslint.config.mjs, tsconfig.json, postcss.config.mjs
│       ├── public/               Arquivos estáticos
│       └── src/
│           ├── app/              Rotas (App Router), uma pasta por tela
│           │   ├── layout.tsx            Estrutura HTML, idioma, metadados
│           │   ├── globals.css           Tokens de cor e classes de componente (.card, .btn, .input...)
│           │   ├── page.tsx              Página inicial (apresentação e entrada)
│           │   ├── admin/
│           │   │   ├── page.tsx                  Login, "Minha conta" e lista de bolões
│           │   │   ├── usuarios/page.tsx         Contas, perfis e links (administrador)
│           │   │   └── [id]/
│           │   │       ├── page.tsx              Gestão do bolão pelo tesoureiro
│           │   │       ├── digitar/page.tsx      Um jogo por tela, para digitar no app Loterias Caixa
│           │   │       └── imprimir/page.tsx     Folha com volantes para levar à lotérica
│           │   ├── b/[token]/page.tsx            Painel do participante
│           │   ├── entrar/[token]/page.tsx       Inscrição pelo link de convite
│           │   ├── organizador/[token]/page.tsx  Criar a conta ou definir senha por link
│           │   └── recuperar/page.tsx            "Esqueci minha senha" (link por e-mail ou código)
│           ├── components/
│           │   ├── ui.tsx                Aviso, Campo, Secao, Dezenas, Bolinha, BotaoCopiar, SeloSituacao...
│           │   ├── SeletorDezenas.tsx    Volante de 1 a 60, preço e botão Surpresinha
│           │   ├── Calculadora.tsx       "Quanto eu ganho?" (simulação, não promessa)
│           │   └── PixCard.tsx           Pix copia e cola e QR
│           └── lib/
│               ├── api.ts                Cliente HTTP da API, ErroDaApi, mensagens por campo
│               ├── useRecurso.ts         Hook de leitura (GET) com carregando, erro e recarregar
│               ├── validacao.ts          Hook de validação de formulário (campo e motivo)
│               ├── loginCripto.ts        Cifra a senha com a chave pública da API (RSA-OAEP)
│               ├── aleatorio.ts          Sorteio sem viés (crypto.getRandomValues) para a surpresinha
│               ├── datas.ts              Formatação de data e hora (Brasília)
│               └── aleatorio.test.ts
│
├── packages/
│   └── shared/                   @bolao/shared: CONTRATO COM A API (cópia idêntica nos dois repos)
│       └── src/
│           ├── regras.ts         Regras puras: dezenas, preço, conferência, rateio, formatação
│           ├── tipos.ts          Tipos das respostas da API
│           ├── contrato.json     Impressão digital (sha256) dos dois arquivos acima
│           └── index.ts
│
├── scripts/
│   └── gerar-contrato.mjs        Gera e confere o contrato.json
│
├── deploy/                       Publicação na VPS
│   ├── README.md                 Passo a passo (a parte comum está no repositório da API)
│   ├── env.homolog.example       Modelo do .env da homologação (porta 3400)
│   └── env.producao.example      Modelo do .env da produção (porta 3000)
│
└── .github/workflows/
    ├── esteira.yml               Confere o caminho de promoção (dev -> homolog -> main)
    └── deploy.yml                Verificação, build da imagem, deploy por SSH, health check
```

## 4. Telas e rotas

| Rota | Quem usa | Para que serve |
|---|---|---|
| `/` | todos | Apresentação do aplicativo e entrada para a área do organizador. |
| `/entrar/<token>` | participante | Inscrição pelo link de convite: nome e WhatsApp (opcional). Quem está logado entra com a própria conta e o bolão aparece em qualquer aparelho. |
| `/b/<token>` | participante | Painel do bolão: situação do pagamento, **Pix copia e cola e QR**, **meus jogos** (volante, surpresinha, remoção de jogo ainda não pago), **resultado** e **calculadora de prêmio**, e a lista de participantes. |
| `/admin` | tesoureiro e administrador | Login. Depois de entrar: **Minha conta** (trocar senha, códigos de recuperação, atividade da conta), meus bolões, criar bolão (Virada ou concurso normal) e participações em bolões de outras pessoas. |
| `/admin/<id>` | tesoureiro dono | Gestão do bolão: **convite** (copiar, gerar outro), configurações e **Pix**, **participantes e pagamentos**, **registrar os jogos na Caixa**, **resultado e rateio** (importar da Caixa ou lançar na mão), histórico e exportação. |
| `/admin/<id>/digitar` | tesoureiro dono | Um jogo por tela, com dezenas grandes, para digitar no app Loterias Caixa e marcar como registrado. |
| `/admin/<id>/imprimir` | tesoureiro dono | Folha com volantes (grade de 1 a 60 com as dezenas marcadas) para levar à lotérica; imprime ou salva em PDF pelo navegador. |
| `/admin/usuarios` | administrador | Criar contas, alterar perfis (administrador e tesoureiro, combináveis), ativar ou desativar e gerar novos links. |
| `/organizador/<token>` | convidado | Criar a conta (nome e senha) ou definir uma nova senha, a partir de um link de uso único com validade de 7 dias. |
| `/recuperar` | todos | "Esqueci minha senha": link por e-mail ou código de recuperação. |

Todas as telas funcionam em celular (a maioria dos participantes entra por ele): layout em coluna, alvos de toque grandes e sem rolagem horizontal.

## 5. Componentes e bibliotecas internas

**Componentes (`src/components`)**

| Componente | Função |
|---|---|
| `ui.tsx` | Peças de interface reutilizadas: `Aviso` (erro ou sucesso, com `role` de acessibilidade), `Campo` (rótulo, controle, dica e erro ligados por aria), `Secao`, `Dezenas` e `Bolinha`, `BotaoCopiar`, `SeloSituacao`, `Carregando`, `ErroDeCarga`. |
| `SeletorDezenas` | Volante de 1 a 60, contagem de dezenas, preço do jogo (`C(k,6)` apostas simples) e botão **Surpresinha**. |
| `Calculadora` | Simula "quanto eu ganho se o bolão acertar" a partir da estimativa de prêmio e do peso da pessoa. É simulação, não promessa. |
| `PixCard` | Mostra o Pix copia e cola, o QR e o valor a pagar. |

**Bibliotecas (`src/lib`)**

| Arquivo | Função |
|---|---|
| `api.ts` | Cliente HTTP: acrescenta o cabeçalho anti-CSRF, trata erro de rede, traduz a resposta de erro em `ErroDaApi` (com `codigo`, `mensagem` e `campos`) e monta o texto do aviso. Inclui `comConfirmacao`, que pede confirmação quando o bolão está travado. |
| `useRecurso.ts` | Lê um recurso (GET) e expõe `dados`, `erro`, `carregando` e `recarregar()`. Falha de leitura aparece como erro, nunca como lista vazia. |
| `validacao.ts` | Hook `useValidacao` e `motivoDoCampo` (ver a próxima seção). |
| `loginCripto.ts` | Busca a chave pública da API e cifra a senha (RSA-OAEP com SHA-256) antes do login, para o texto puro não aparecer no payload. |
| `aleatorio.ts` | Inteiro uniforme com `crypto.getRandomValues` e rejeição, sem viés; usado na surpresinha. |
| `datas.ts` | Formatação de data e hora no horário de Brasília. |

## 6. Formulários e validação

Os formulários principais seguem um padrão único, que diz **qual campo** tem problema e **por quê**:

- O `<form>` usa `noValidate` e o envio chama `validar(e)`, do hook `useValidacao`. Ele percorre os campos, usa a validação nativa do navegador (`required`, `minLength`, `type="email"`...) e escreve o motivo **em português**, embaixo do campo.
- O componente `Campo` liga rótulo, controle, dica e erro com `aria-invalid` e `aria-describedby` (o leitor de tela anuncia o erro), marca campos obrigatórios com asterisco e pinta a borda de vermelho.
- O **foco vai ao primeiro campo inválido**, há um **resumo no topo** ("Corrija os 2 campos destacados abaixo.") e o erro **some assim que a pessoa digita**.
- Erros que só o envio descobre também caem no campo certo: confirmação de senha diferente (`marcar`), política de senha recusada pela API (`senha_curta`, `senha_comum`...) e **validação da API**, que devolve `campos` (`{ "nome": "Use pelo menos 2 caracteres." }`) e é mapeada para o campo da tela (`doServidor`).
- Nos formulários menores dentro do bolão (pagamento, resultado, configurações), o aviso no topo já diz o campo e o motivo ("Nome: use pelo menos 2 caracteres.").

Telas que usam o padrão completo: login, novo bolão, recuperar senha (as duas formas), convite de organizador, entrada do participante e criação de conta em Usuários.

## 7. Como o front conversa com a API

- Endereço: `NEXT_PUBLIC_API_URL`, **gravado no bundle na hora do build**. Para trocar de API é preciso construir de novo (o deploy faz isso por ambiente).
- Toda chamada usa `credentials: "include"` (cookie de sessão) e `cache: "no-store"`.
- Escritas levam `X-Bolao: 1`; a API também confere a `Origin`, por isso o endereço do front precisa estar em `CORS_ORIGINS` da API.
- Respostas de erro têm sempre `{ codigo, mensagem, campos? }` e as mensagens são **texto fixo**, exibido sempre como texto (nunca como HTML).
- Sessão: o cookie é `HttpOnly`, entra e sai pela API; o front só consulta `GET /auth/eu`. O participante sem conta é reconhecido por um cookie de aparelho emitido pela API na inscrição.
- Bolão travado (sorteio passou ou resultado lançado): a API recusa com `bolao_travado` o que mexe no rateio; `comConfirmacao` mostra a pergunta e repete a chamada com `?confirmar=1`.

## 8. Segurança

O padrão seguido está em [`HANDOFF-SEGURANCA.md`](HANDOFF-SEGURANCA.md). Do lado do front:

- **CSP e cabeçalhos** (`next.config.ts`): `default-src 'self'`, `connect-src` só para o próprio site e a origem da API, `frame-ancestors 'none'` (sem iframe), `object-src 'none'`, `form-action 'self'`, `base-uri 'self'`; `X-Powered-By` desligado. O `script-src` ainda precisa de `'unsafe-inline'` (o Next injeta scripts para hidratar); a política estrita com nonce está nas pendências.
- **Build seguro**: o build de produção **falha** se `NEXT_PUBLIC_API_URL` não estiver definida, em vez de apontar para `localhost` em silêncio.
- **Senha**: nunca trafega em texto puro no payload (RSA-OAEP com a chave pública da API) e o campo é limpo depois do envio.
- **Sem segredos no front**: tudo que vai no bundle é público (`NEXT_PUBLIC_*`); não há chave, token nem credencial no repositório.
- **Texto de usuário** é sempre renderizado como texto pelo React; nada de `dangerouslySetInnerHTML`.
- **Surpresinha** sorteada com `crypto.getRandomValues`, sem viés.
- **Container**: imagem fixada por digest, roda como usuário `node`, escuta só em `127.0.0.1`, 256 MB de memória e healthcheck.

## 9. Configuração

| Variável | Quando | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **build** | Endereço público da API. Obrigatória no build de produção. Local: `http://localhost:3333`. |
| `WEB_PORT` | execução (servidor) | Porta do container (produção 3000, homologação 3400). |
| `COMPOSE_PROJECT_NAME` | servidor | Nome do projeto Compose do ambiente (`bolao-prod-web`, `bolao-homolog-web`). |

Modelos: `apps/web/.env.local.example` (local) e `deploy/env.*.example` (servidor).

## 10. Rodando localmente

Requisitos: Node 22 e pnpm. A API precisa estar rodando (veja o README do `back-bolao`).

```bash
pnpm install
cp apps/web/.env.local.example apps/web/.env.local   # NEXT_PUBLIC_API_URL=http://localhost:3333
pnpm dev                                             # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento (Next com recarga) |
| `pnpm build` / `pnpm start` | Build de produção e servidor (`next start -H 127.0.0.1`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Testes (Vitest) |
| `pnpm contrato:gerar` | Atualiza `packages/shared/src/contrato.json` |
| `pnpm contrato:conferir` | Confere se o contrato está em dia |

## 11. Testes e qualidade

- **Vitest** (`pnpm test`): hoje cobre o sorteio sem viés da surpresinha. As regras de dinheiro e rateio ficam em `@bolao/shared` e são testadas no repositório da API, que tem a suíte completa (unitários e ponta a ponta).
- **Esteira**: lint, tipos, testes, build, `pnpm audit` e **conferência do contrato** rodam em todo push; o build da imagem Docker roda em PR para `homolog` ou `main`.
- **Verificação manual feita em cada entrega**: fluxo completo no navegador (login, criar bolão, inscrição, Pix, pagamento, exportação) contra homologação e produção, em largura de desktop e de celular.

## 12. Contrato com a API

`packages/shared/src/regras.ts` e `tipos.ts` são **idênticos** nos dois repositórios, e o `contrato.json` guarda o sha256 dos dois.

- Mudou um desses arquivos? Rode `pnpm contrato:gerar`, copie os arquivos e o `contrato.json` para o repositório da API e publique os dois.
- A esteira confere o contrato local e, no deploy, compara com o da API em produção (`GET /saude/contrato`); divergência é avisada no log.

## 13. Build, Docker e CI/CD

### Imagem

`Dockerfile` em três estágios (`deps`, `build`, `runner`), base `node:22-alpine` fixada por digest. O `build` recebe `NEXT_PUBLIC_API_URL` como `ARG`; o `runner` copia só a saída `standalone` do Next e roda `node apps/web/server.js` como usuário `node`, em `127.0.0.1:${PORT}`.

### Branches e promoção

```
dev  --PR-->  homolog  --PR-->  main
              (deploy automático)   (deploy só com disparo manual e frase de confirmação)
```

| Branch | Ambiente | Como publica |
|---|---|---|
| `dev` | nenhum | Só verificação. |
| `homolog` | Homologação | Merge do PR dispara o deploy automático. |
| `main` | Produção | Merge só verifica. A publicação é por `workflow_dispatch` com a frase `publicar producao`. |

O `esteira.yml` recusa PR que pule etapa. Revisores obrigatórios e proteção de branch dependem do plano Pro do GitHub em repositório privado; no lugar deles valem a frase de confirmação, a guarda de origem e a esteira.

### O que o `deploy.yml` faz

1. Verificação (lint, tipos, testes, build, audit e conferência do contrato).
2. Build da imagem (em PR para `homolog` ou `main`) com uma URL de API fictícia, só para provar que compila.
3. Guarda de origem em `main`.
4. **Publicar na VPS**: lê `URL_API` do **ambiente do GitHub** (`homologacao` ou `producao`) e constrói a imagem **com a API daquele ambiente**; envia por `docker save | gzip | ssh`; chama o comando forçado `bolao-deploy` (carrega a imagem, atualiza o compose, implanta, confere a saúde e volta para a anterior se falhar); verifica o endereço público; compara o contrato com o da API.

Segredos e variáveis por ambiente: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_PORT` (segredos) e `URL_API`, `URL_FRONT` (variáveis). O funcionamento da VPS (usuário `deploy`, comando forçado, nginx, certificados) está descrito no [README do back-end](https://github.com/JoeKyy/back-bolao#14-cicd-e-ambientes).

### Ambientes na VPS

| | Produção | Homologação |
|---|---|---|
| Pasta | `/srv/bolao/producao/web` | `/srv/bolao/homolog/web` |
| Porta | 3000 | 3400 |
| Projeto Compose | `bolao-prod-web` | `bolao-homolog-web` |
| Domínio | `bolao.joekyy.com.br` | `homolog-bolao.joekyy.com.br` |

## 14. Operação

- **Estado**: `ssh -i ~/.ssh/bolao_deploy -p 22022 deploy@143.95.185.142 "estado <homolog|producao> web"`.
- **Logs**: `docker logs bolao-<prod|homolog>-web-web-1`.
- **Reversão**: o deploy volta sozinho para a imagem anterior se a saúde falhar; manualmente, rode o job de deploy do commit anterior.
- **Trocar a API de um ambiente**: ajuste a variável `URL_API` do ambiente no GitHub e publique de novo (o endereço é gravado no build).
- **Páginas em branco após deploy?** Confira se `NEXT_PUBLIC_API_URL` apontava para a API certa e se o endereço do front está em `CORS_ORIGINS` da API.

## 15. Documentos relacionados

- [`HANDOFF-SEGURANCA.md`](HANDOFF-SEGURANCA.md): padrão de segurança e achados corrigidos.
- [`deploy/README.md`](deploy/README.md): publicação do front.
- API: [`JoeKyy/back-bolao`](https://github.com/JoeKyy/back-bolao), que concentra a referência de rotas, o modelo de dados e a operação da VPS.
