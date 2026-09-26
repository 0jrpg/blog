import "server-only";

// -----------------------------------------------------------------------------
// Todas as variáveis abaixo são lidas SÓ no servidor (rotas de API, NextAuth).
// Nenhuma delas tem prefixo NEXT_PUBLIC_, ou seja, nenhuma vai parar no
// JavaScript enviado ao navegador — é exatamente esse o ponto de ter um
// backend de verdade.
// -----------------------------------------------------------------------------

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Veja o .env.example na raiz do projeto.`
    );
  }
  return value;
}

export const env = {
  // Repositório onde os posts (criptografados) são gravados.
  get GITHUB_REPO_OWNER() {
    return required("GITHUB_REPO_OWNER");
  },
  get GITHUB_REPO_NAME() {
    return required("GITHUB_REPO_NAME");
  },
  get GITHUB_REPO_BRANCH() {
    return process.env.GITHUB_REPO_BRANCH || "main";
  },

  // Token do "bot" do blog: fine-grained PAT com Contents (read/write) e
  // Administration (read-only) NESTE repositório. É o único token que fala
  // com a API do GitHub — os usuários do site nunca veem nem digitam token
  // nenhum, eles só fazem login com a própria conta GitHub via OAuth.
  get GITHUB_BOT_TOKEN() {
    return required("GITHUB_BOT_TOKEN");
  },

  // Chave simétrica (32 bytes em base64) usada para criptografar/descriptografar
  // o conteúdo dos posts antes de gravar no GitHub. Gere com:
  //   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  get POSTS_ENCRYPTION_KEY() {
    return required("POSTS_ENCRYPTION_KEY");
  },

  // OAuth App do GitHub usado para o login de admin/colaborador.
  get GITHUB_OAUTH_CLIENT_ID() {
    return required("GITHUB_OAUTH_CLIENT_ID");
  },
  get GITHUB_OAUTH_CLIENT_SECRET() {
    return required("GITHUB_OAUTH_CLIENT_SECRET");
  },

  // Segredo do NextAuth, usado para assinar sessão/JWT.
  get NEXTAUTH_SECRET() {
    return required("NEXTAUTH_SECRET");
  },
};
