# névoa — blog liquid glass (Next.js + Vercel, com backend)

Blog em **Next.js (App Router) + TypeScript**. Login de admin/colaborador
via **backend real** (GitHub OAuth + NextAuth), posts **criptografados em
repouso** no GitHub, três níveis de visibilidade (público / só-com-link /
privado), e um **editor rico** (cores, temas, links/botões/prévias) — tudo
publicado só pela interface, nunca por edição manual de arquivo.

## Arquitetura, em uma frase

O navegador de quem visita ou edita o blog **nunca fala direto com o
GitHub**. Tudo passa pelas rotas de API deste próprio app (`app/api/...`),
que rodam no servidor da Vercel e usam:

- **NextAuth + GitHub OAuth** para saber quem está logado;
- um **token de bot** (guardado só como variável de ambiente) para ler e
  escrever no repositório;
- uma **chave de criptografia** (também só no servidor) para
  transformar cada post em texto cifrado antes de gravar no GitHub, e
  decifrar de volta quando alguém autorizado lê.

## Variáveis de ambiente necessárias

Veja `.env.example` para o passo a passo completo de como gerar cada uma.
Resumo do que precisa existir (local: `.env.local`; produção: Vercel →
Project → Settings → Environment Variables):

| Variável | Para quê |
|---|---|
| `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `GITHUB_REPO_BRANCH` | qual repositório guarda os posts |
| `GITHUB_BOT_TOKEN` | fine-grained PAT do "bot" do blog — único token que fala com a API do GitHub (Contents: read/write, Administration: read-only) |
| `POSTS_ENCRYPTION_KEY` | chave simétrica (32 bytes em base64) que criptografa/descriptografa os posts |
| `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` | OAuth App do GitHub, usado só para login (identificar quem é a pessoa) |
| `NEXTAUTH_SECRET` | assina a sessão/JWT do login |
| `NEXTAUTH_URL` | URL final do site (recomendado, ainda que a Vercel geralmente detecte sozinha) |

Nenhuma dessas variáveis tem prefixo `NEXT_PUBLIC_` — ou seja, nenhuma
delas é enviada ao navegador em nenhuma hipótese.

## Como criar cada peça

1. **Repositório**: crie (ou reutilize) um repositório no GitHub para
   guardar os posts. Ele pode ser privado, se preferir.
2. **Token do bot**: <https://github.com/settings/personal-access-tokens/new>
   → restrinja a esse repositório → permissões `Contents: Read and write`
   e `Administration: Read-only`.
3. **Chave de criptografia**: rode localmente
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   e guarde o resultado em local seguro (gerenciador de senhas, por
   exemplo) — **se essa chave se perder, os posts já gravados ficam
   ilegíveis para sempre.**
4. **OAuth App**: <https://github.com/settings/developers> → "New OAuth
   App" → Homepage URL = URL do seu site na Vercel; Authorization
   callback URL = `<sua-url>/api/auth/callback/github`.
5. **NEXTAUTH_SECRET**: mesmo comando do passo 3, só que gera outro valor
   (não reutilize a mesma chave para as duas coisas).
6. Cadastre tudo isso na Vercel e faça o deploy.

## Como criar admin / colaborador

Não existe usuário nem senha próprios do blog. Quem pode logar e editar é
decidido **pelas permissões do próprio repositório GitHub**:

- Dono do repositório → já é **admin** automaticamente.
- **Settings → Collaborators and teams → Add people** no repositório:
  - permissão **Admin** → papel `admin` no blog (cria, edita e apaga posts,
    de qualquer visibilidade).
  - permissão **Write** ou **Maintain** → papel `colaborador` (cria e
    edita posts, não apaga).
- Quem não é colaborador consegue logar com GitHub (a autenticação em si
  funciona), mas não ganha acesso a nada de edição.

Depois de virar colaborador/admin no GitHub, a pessoa só precisa clicar em
**Entrar com GitHub** no site — nada de token pra copiar e colar.

## Visibilidade dos posts

Cada post tem um destes três estados, escolhido no editor:

- **Público** — aparece na listagem da home, qualquer visitante vê.
- **Só-com-o-link** — não aparece na listagem, mas quem tiver a URL
  consegue abrir normalmente (útil para compartilhar sem divulgar).
- **Privado** — só quem está logado como admin/colaborador consegue ver;
  para qualquer outra pessoa a URL simplesmente não existe (o servidor
  responde 404, não 403 — assim não confirma nem nega a existência do
  post para quem não deveria nem saber que ele existe).

## O editor

Cada post é escrito num editor rico (negrito, itálico, sublinhado,
títulos, listas, citação, cor de texto, marca-texto, link inline), com um
seletor de **tema** (paleta de acento aplicada só àquele post) e um botão
**"+ link / imagem / prévia"** que insere:

- **Prévia** — cola qualquer URL (página, imagem, PDF) e o servidor busca
  título/descrição/imagem (ou detecta que é imagem/PDF) e monta um card;
  os dados ficam gravados junto do post, então visitantes não disparam
  requisição nenhuma pra terceiros ao ler.
- **Botão** — vira um botão estilizado, no tema do post.
- **Link simples** — só um link com a cara do resto do blog.

## Sobre a criptografia — leia isto, sem enrolação

O que existe aqui é **criptografia em repouso, com controle de acesso no
servidor** — não é "ponta a ponta" no sentido estrito do termo:

- Os arquivos que ficam no GitHub (`posts/*.json.enc`) são cifrados com
  AES-256-GCM e formatados como blocos de código
  (`A34532J AR354J32NF ...`) — abrindo o arquivo direto no GitHub, não dá
  pra ler nada.
- **A chave mora só numa variável de ambiente no servidor da Vercel.** É o
  servidor quem decide, a cada requisição, se descriptografa e mostra o
  conteúdo — com base em quem está logado e na visibilidade do post. Ele
  **consegue** ler o conteúdo; só quem olhar o repositório sem essa chave
  é que não consegue.
- Isso é diferente de uma "E2E" de verdade (tipo Signal), onde nem o
  servidor jamais vê o texto plano. Não deu pra fazer esse modelo aqui
  porque ele é **incompatível** com o resto que você pediu: prévia de
  link pública, posts só-com-link, listagem pública — tudo isso exige que
  algum servidor decida o que mostrar, e pra decidir ele precisa
  conseguir ler.
- Se o repositório GitHub for público, o que qualquer pessoa vê ao abrir
  os arquivos é só ruído cifrado — mas o código-fonte deste app (as
  rotas, a lógica) continua visível, porque é assim que o Next.js/Vercel
  funcionam com repositório público. Se quiser esconder o código-fonte
  também, o repositório do **app** (não necessariamente o dos posts)
  precisaria ser privado.
- Se quiser um dia migrar para E2E de verdade (servidor nunca decifra),
  isso é possível, mas exige abrir mão de: prévias de link automáticas,
  posts só-com-link (a menos que a chave seja distribuída manualmente a
  quem recebe o link) e listagem pública sem antes o navegador de cada
  visitante ter a chave. Me avise se quiser explorar esse caminho — é uma
  arquitetura bem diferente.

## Sobre a ofuscação do bundle de cliente

Continua igual: o JS que chega ao navegador é ofuscado no build via
`webpack-obfuscator` (configurado em `next.config.ts`), sem
`selfDefending`/`debugProtection` (essas costumam causar mais problema em
produção do que proteção). Isso dificulta a leitura do bundle, não
impede engenharia reversa — o mesmo aviso de sempre.

## Rodando localmente

```bash
cp .env.example .env.local   # preencha os valores
npm install
npm run dev
```

## Deploy na Vercel

1. Suba o projeto para um repositório no GitHub (pode ser o mesmo dos
   posts ou um separado — mas lembre que o `GITHUB_REPO_*` acima aponta
   pra onde os **posts** ficam, não necessariamente pra onde o **código**
   do app fica).
2. Importe na Vercel, cadastre todas as variáveis de ambiente da tabela
   acima.
3. Deploy automático a cada `git push` — sem workflow do GitHub Actions.

## Estrutura

```
app/
  layout.tsx, providers.tsx     → shell + SessionProvider (NextAuth)
  globals.css                    → visual "liquid glass" + editor + embeds
  page.tsx, login/, novo/,
  post/[slug]/, post/[slug]/editar/  → rotas
  api/
    auth/[...nextauth]/          → login (GitHub OAuth)
    posts/, posts/[slug]/        → leitura pública (respeita visibilidade)
    admin/posts/, admin/posts/[slug]/ → criar/editar/apagar (autenticado)
    link-preview/                → busca metadados pro editor
auth.ts                          → configuração do NextAuth + papel na sessão
lib/
  env.ts                         → leitura validada das variáveis de ambiente
  crypto.ts                      → criptografia AES-256-GCM + formatação "em código"
  githubStore.ts                 → leitura/escrita no GitHub (token do bot)
  permissions.ts                 → resolve admin/colaborador via API do GitHub
  requireEditor.ts               → guarda de autorização das rotas /api/admin
  sanitize.ts                    → sanitização do HTML do editor
  linkPreview.ts                 → busca OG/tipo de arquivo de uma URL
  posts.ts                       → chamadas do cliente pras rotas /api
  slug.ts, format.ts
components/                      → UI (client components)
next.config.ts                   → config do Next.js + ofuscação do bundle de cliente
```
