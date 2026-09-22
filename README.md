# névoa — blog liquid glass

Blog em React + TypeScript + Vite. Visual "liquid glass" (vidro translúcido,
esferas de gradiente em deriva contínua). Cada post é um arquivo `.json` na
pasta `posts/`, lido **direto do GitHub** em tempo real — ou seja, para
publicar um post novo basta dar `git push`, sem rebuild manual (o GitHub
Actions cuida do resto).

## Como funciona o "auto-atualizar"

O site **não** empacota os posts no build. Em vez disso, em tempo de
execução ele busca:

```
https://raw.githubusercontent.com/<usuario>/<repo>/main/posts/index.json
https://raw.githubusercontent.com/<usuario>/<repo>/main/posts/<slug>.json
```

Isso significa que, se você só editar arquivos dentro de `posts/` e fizer
`git push`, o conteúdo novo aparece para os visitantes na próxima vez que
carregarem a página — mesmo sem rodar o pipeline de build de novo. O
workflow do GitHub Actions só é necessário quando você mexe no **código**
do site (`src/`), não nos posts.

## Configuração inicial

1. Edite `src/config.ts` e troque:
   ```ts
   export const GITHUB_OWNER = "seu-usuario";
   export const GITHUB_REPO = "liquid-blog";
   export const GITHUB_BRANCH = "main";
   ```
2. Edite `vite.config.ts` e ajuste `base`:
   - Repositório de projeto (`usuario.github.io/nome-do-repo`): `base: "/nome-do-repo/"`.
   - Repositório de usuário (`usuario.github.io`) ou domínio próprio: `base: "/"`.
3. No GitHub: **Settings → Pages → Source → GitHub Actions**.

## Rodando localmente

```bash
npm install
npm run dev
```

## Publicando um post novo

Opção rápida (gera o arquivo e já atualiza o índice):

```bash
npm run new-post -- "Título do post" "Resumo de uma linha" tag1,tag2
```

Isso cria `posts/<slug>.json` e adiciona a entrada em `posts/index.json`.
Edite o array `content` do arquivo gerado — cada string do array vira um
parágrafo — e depois:

```bash
git add posts/
git commit -m "novo post: título do post"
git push
```

Ou, manualmente, crie `posts/meu-post.json`:

```json
{
  "slug": "meu-post",
  "title": "Meu post",
  "date": "2026-09-22",
  "excerpt": "Resumo curto que aparece na listagem.",
  "tags": ["tag1", "tag2"],
  "content": [
    "Primeiro parágrafo.",
    "Segundo parágrafo."
  ]
}
```

E adicione a entrada correspondente em `posts/index.json`.

## Login e permissões (admin / colaborador)

O blog agora tem uma interface de criação de posts, protegida por login.
Não existe backend nem banco de usuários próprio: quem pode editar é
decidido **pelo próprio GitHub** — quem for admin ou colaborador (com
permissão de escrita) do repositório ganha acesso à interface de criar,
editar e (se for admin) apagar posts.

### Como logar

1. Vá em **Entrar**, no topo do site.
2. Cole um **token de acesso pessoal (fine-grained)** do GitHub. A própria
   tela de login explica passo a passo como gerar um, mas em resumo:
   - Crie em <https://github.com/settings/personal-access-tokens/new>.
   - Restrinja o acesso a **apenas este repositório**.
   - Dê permissão de **Contents: Read and write** e nada mais.
   - Defina uma validade curta.
3. O site chama a API do GitHub para descobrir quem é você e qual sua
   permissão no repositório (`admin`, `write`/colaborador, ou nenhuma) e
   libera a interface de acordo.

### O que cada papel pode fazer

- **Colaborador** (permissão `write`/`maintain` no repositório): criar
  posts novos e editar qualquer post existente pela interface.
- **Admin** (permissão `admin` no repositório, normalmente o dono): tudo
  o que o colaborador pode, mais apagar posts.
- Quem não é admin nem colaborador consegue logar (o token é validado),
  mas não vê a interface de edição — só a leitura pública do blog, que
  nunca exige login.

Para adicionar alguém como colaborador, use o próprio GitHub: **Settings →
Collaborators and teams** do repositório.

### Onde o token fica guardado

O token entra apenas no `localStorage` do navegador de quem logou e é
usado só para chamar `api.github.com` diretamente do navegador — não passa
por nenhum servidor intermediário criado por este projeto (não existe
nenhum). Ainda assim, vale reforçar:

- Use sempre um token **fine-grained**, restrito a este repositório e só
  com permissão de `Contents`. Nunca use um token clássico com acesso a
  todos os seus repositórios.
- Qualquer pessoa com acesso físico ao navegador (ou que explore XSS nele)
  teria acesso ao token salvo. Prefira tokens de validade curta e revogue
  no GitHub se suspeitar de algo.
- "Login" aqui é, na prática, "provar que você tem um token válido do
  GitHub com permissão nesse repositório" — não há senha própria do blog,
  nem cadastro de usuários fora do GitHub.

## Build e deploy

- `npm run build` — build normal de produção.
- `npm run build:secure` — build de produção **+ ofuscação** do JS final
  (é isto que o GitHub Actions executa a cada push em `main`).
- O deploy é automático via `.github/workflows/deploy.yml`.

## Sobre a ofuscação — leia isto

Foi aplicada a ofuscação mais forte disponível no bundle final via
[`javascript-obfuscator`](https://github.com/javascript-obfuscator/javascript-obfuscator):
renomeação de identificadores em hexadecimal, criptografia de strings (RC4),
embaralhamento do fluxo de controle, injeção de código morto, proteções
anti-debug e bloqueio do `console`.

Isso **dificulta bastante** a leitura casual do código-fonte. Mas é
importante ser honesto sobre o que isso realmente garante:

- O site é 100% estático e roda **no navegador de quem visita**. Isso
  significa que o JavaScript final sempre pode ser executado, inspecionado e
  ter seu comportamento observado em runtime (DevTools, breakpoints,
  interceptação de `fetch`), mesmo ofuscado. Ofuscação atrasa a leitura, não
  impede a execução nem a engenharia reversa por completo.
- Se o repositório no GitHub for **público**, o código-fonte original
  (não ofuscado) em `src/` fica visível para qualquer um de qualquer forma —
  só o `dist/` publicado é ofuscado. Se quiser esconder também o
  código-fonte, o repositório precisa ser **privado** (GitHub Pages a partir
  de repo privado exige GitHub Pro/Team/Enterprise, ou publicar via outro
  host lendo de um repo privado).
- Os próprios posts (`posts/*.json`) são conteúdo público por definição — é
  assim que o site os lê sem backend. Não coloque neles nada que precise ser
  sigiloso.
- Não existe "criptografia" real de JavaScript que ainda rode no navegador:
  qualquer coisa que precise ser executada no cliente precisa, em algum
  momento, estar em texto legível pela máquina. Segredos de verdade (chaves
  de API, regras de negócio sensíveis) sempre devem morar num backend, nunca
  no bundle do front-end.

## Estrutura

```
posts/                     → conteúdo do blog (JSON), lido em runtime do GitHub
src/
  context/AuthContext.tsx  → estado de login (token, usuário, papel)
  components/
    LoginPage.tsx           → tela de login com token do GitHub
    RequireEditor.tsx       → protege /novo e /post/:slug/editar
    NewPostPage.tsx         → criar post (grava no GitHub via API)
    EditPostPage.tsx        → editar post existente
    PostEditor.tsx          → formulário compartilhado por criar/editar
    PostList.tsx, PostView.tsx, TopNav.tsx, ...
  lib/
    posts.ts                → leitura pública dos posts (raw.githubusercontent)
    github.ts               → login, permissões e escrita via GitHub API
  config.ts                 → usuário/repo/branch do GitHub
  styles/global.css         → sistema visual "liquid glass"
scripts/
  obfuscate.mjs              → ofusca o bundle final
  new-post.mjs                → cria um post novo por linha de comando
.github/workflows/deploy.yml  → build + deploy automático no GitHub Pages
```
