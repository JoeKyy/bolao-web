# Publicação do front

O servidor, o comando de deploy e o roteiro de montagem estão no repositório da API: `back-bolao/deploy/README.md` (um único `/usr/local/sbin/bolao-deploy` serve aos dois). Aqui ficam só os modelos de `.env` do front.

- A imagem é construída no CI, com `NEXT_PUBLIC_API_URL` do ambiente embutida (uma imagem por ambiente).
- Ordem: **publicar a API compatível antes do front**. O deploy do front reprova se o contrato (`/saude/contrato` da API publicada) divergir do `contrato.json` deste commit.
- Variáveis do GitHub em cada ambiente: `URL_API` (ex.: `https://api.homolog-bolao.joekyy.com.br`) e `URL_FRONT` (ex.: `https://homolog-bolao.joekyy.com.br`).
