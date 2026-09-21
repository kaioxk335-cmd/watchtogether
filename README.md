# WatchTogether — Cloudflare Pages + D1 + R2

Versão completa do protótipo com catálogo global.

## O que esta versão faz
- Perfil `ben` como DONO, PIN `151226` no front-end.
- Catálogo inicialmente vazio.
- Filmes cadastrados pelo painel são salvos no **Cloudflare D1** e ficam disponíveis para todos os usuários.
- Capas e vídeos enviados pelo painel são armazenados no **Cloudflare R2**.
- O player usa os arquivos do R2 ou uma URL direta autorizada.
- Exclusão pelo painel remove o registro do D1 e os objetos do R2.
- API protegida por cookie de sessão assinado com `SESSION_SECRET` e PIN administrativo `ADMIN_PIN`.

## Configuração no Cloudflare
1. Crie um banco D1 chamado `watchtogether-db`.
2. Execute o arquivo `migrations/0001_movies.sql` nesse banco.
3. Crie um bucket R2 chamado `watchtogether-media`.
4. No `wrangler.toml`, troque `COLE_SEU_D1_DATABASE_ID_AQUI` pelo ID real do D1.
5. No projeto Cloudflare Pages, adicione os bindings:
   - D1: variável `DB` → seu banco.
   - R2: variável `MEDIA` → seu bucket.
6. Em **Settings → Variables and Secrets**, crie:
   - `ADMIN_PIN` = `151226`
   - `SESSION_SECRET` = uma senha longa e aleatória.
7. Faça um novo deploy.

## Build
- Build command: `npm run build`
- Output directory: `dist`

## Importante sobre upload
A função de upload do pacote aceita vídeo de até 2 GB por envio. Para arquivos muito grandes, use um fluxo multipart/presigned URL dedicado.

O site só deve receber filmes e vídeos que você tenha autorização para armazenar e distribuir.
