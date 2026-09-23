# névoa — blog liquid glass (Next.js + Vercel)

Blog em **Next.js (App Router) + TypeScript**, 100% em `.ts`/`.tsx` — sem
`index.html`, o próprio Next cuida disso. Visual "liquid glass" (vidro
translúcido, esferas de gradiente em deriva contínua). Cada post é um
arquivo `.json` na pasta `posts/`, lido **direto do GitHub** em tempo
real — para publicar um post novo, ou pela interface (login) ou dando
`git push`, sem precisar de rebuild manual.

## Como funciona o "auto-atualizar"

O site **não** empacota os posts no build. Em tempo de execução, o
navegador busca:

```
https://raw.githubusercontent.com/<usuario>/<repo>/main/posts/index.json
https://raw.githubusercontent.com/<usuario>/<repo>/main/posts/<slug>.json
```

Isso vale **independente de onde o site em si está hospedado** (Vercel,
neste caso). O conteúdo dos posts mora no repositório GitHub; o app
Next.js só sabe ler de lá.

## Configuração inicial

Edite `lib/config.ts`:

```ts
export const GITHUB_OWNER = "seu-usuario";
export const GITHUB_REPO = "liquid-blog";
export const GITHUB_BRANCH = "main";
```

## Rodando localmente

```bash
npm install
npm run dev
```

## Deploy na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Na [Vercel](https://vercel.com/new), importe esse repositório.
3. A Vercel detecta Next.js automaticamente — não precisa configurar
   build command nem output directory.
4. Pronto: todo `git push` na branch principal já gera um novo deploy de
   produção automaticamente (e cada branch/PR ganha um preview deploy).
   Não há necessidade de nenhum workflow do GitHub Actions.

## Login e permissões (admin / colaborador)

Não existe backend nem banco de usuários próprio: quem pode editar pela
interface é decidido **pelo próprio GitHub** — quem for admin ou
colaborador (com permissão de escrita) do repositório ganha acesso à
criação, edição e (se for admin) exclusão de posts.

### Como logar

1. Vá em **Entrar**, no topo do site.
2. Cole um **token de acesso pessoal (fine-grained)** do GitHub — a tela
   de login explica o passo a passo, em resumo:
   - Crie em <https://github.com/settings/personal-access-tokens/new>.
   - Restrinja o acesso a **apenas este repositório**.
   - Dê permissão de **Contents: Read and write**, nada mais.
   - Defina uma validade curta.
3. O site consulta a API do GitHub para saber sua permissão real no
   repositório (`admin`, `write`/colaborador, ou nenhuma) e libera a
   interface de acordo.

### O que cada papel pode fazer

- **Colaborador** (`write`/`maintain` no GitHub): criar posts novos e
  editar qualquer post existente pela interface.
- **Admin** (`admin` no GitHub, normalmente o dono): tudo isso, mais
  apagar posts.
- Sem permissão nenhuma: o login funciona, mas sem acesso à edição — só
  a leitura pública, que nunca exige login.

Para adicionar alguém, use o próprio GitHub: **Settings → Collaborators
and teams** do repositório.

### Onde o token fica guardado

Só no `localStorage` do navegador de quem logou, usado apenas para
chamar `api.github.com` direto do navegador — não existe nenhum servidor
intermediário deste projeto guardando ou vendo esse token. Por isso:

- Use sempre um token **fine-grained**, restrito a este repositório e só
  com permissão de `Contents`. Nunca um token clássico com acesso a todos
  os seus repositórios.
- Prefira validade curta e revogue no GitHub se suspeitar de algo.
- "Login" aqui é, na prática, "provar que você tem um token válido do
  GitHub com permissão nesse repositório" — não há senha própria do
  blog nem cadastro de usuários fora do GitHub.

## Sobre a ofuscação do código — leia isto

O bundle de **cliente** (o JS que a Vercel entrega ao navegador de quem
visita o site) passa por ofuscação forte durante o `next build`, via
[`webpack-obfuscator`](https://github.com/javascript-obfuscator/webpack-obfuscator)
plugado em `next.config.ts`: renomeação de identificadores em
hexadecimal, criptografia e embaralhamento de strings, fluxo de controle
embaralhado, injeção de código morto. Isso roda automaticamente a cada
deploy na Vercel — não precisa de nenhum passo manual.

Deliberadamente **não** habilitei `selfDefending` e `debugProtection`
(recursos que tentam travar o DevTools ou reagir a breakpoints): em
produção real, essas opções costumam causar mais dor de cabeça do que
proteção (loops de debugger, telas travando com o DevTools aberto).
Preferi estabilidade a essa camada extra, que de qualquer forma não muda
o quadro geral. E o quadro geral é este, sendo direto:

- O site roda **no navegador de quem visita**. O JavaScript final, mesmo
  ofuscado, sempre pode ser executado, inspecionado e ter seu
  comportamento observado em runtime — ofuscação atrasa a leitura, não
  impede a execução nem a engenharia reversa por completo.
- Se o repositório no GitHub for **público**, o código-fonte original em
  `app/`, `components/`, `lib/` etc. continua visível para qualquer um —
  só o bundle final compilado pela Vercel é ofuscado. Para esconder
  também o código-fonte, o repositório precisaria ser **privado**.
- Os posts (`posts/*.json`) são conteúdo público por definição — é assim
  que o site os lê sem backend próprio. Não coloque neles nada sigiloso.
- Não existe "criptografia" real de JavaScript que ainda precise rodar no
  navegador: o token do GitHub de quem edita, por exemplo, nunca fica no
  código — ele é digitado por cada pessoa e mora só no `localStorage`
  dela. Segredos de verdade sempre devem morar num backend, nunca no
  bundle do front-end.

## Publicando um post pela linha de comando (alternativa à interface)

```bash
npm run new-post -- "Título do post" "Resumo de uma linha" tag1,tag2
git add posts/
git commit -m "novo post: título do post"
git push
```

## Estrutura

```
app/
  layout.tsx              → layout raiz (substitui index.html), fontes via next/font
  globals.css              → sistema visual "liquid glass"
  page.tsx                 → página inicial
  login/page.tsx           → tela de login
  novo/page.tsx             → criar post (protegida)
  post/[slug]/page.tsx      → leitura de um post
  post/[slug]/editar/page.tsx → editar post (protegida)
components/                → UI (React, a maioria client components)
context/AuthContext.tsx    → estado de login (token, usuário, papel)
lib/
  posts.ts                 → leitura pública dos posts (raw.githubusercontent)
  github.ts                → login, permissões e escrita via GitHub API
  config.ts                → usuário/repo/branch do GitHub
posts/                      → conteúdo do blog (JSON), lido em runtime do GitHub
scripts/new-post.mjs         → cria um post novo por linha de comando
next.config.ts               → config do Next.js + plugin de ofuscação
```
