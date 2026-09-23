// -----------------------------------------------------------------------------
// Configuração central. Troque estes três valores pelos do SEU repositório.
// É daqui que o site busca, em tempo real, os arquivos dentro de posts/*.json.
// -----------------------------------------------------------------------------
export const GITHUB_OWNER = "0jrpg";
export const GITHUB_REPO = "blog";
export const GITHUB_BRANCH = "main";

// Base para arquivos "crus" do repositório (CORS liberado, sem necessidade de token).
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Monta a URL de um arquivo dentro de posts/, sempre com um parâmetro
 * anti-cache. Isso é o que faz o blog "se atualizar sozinho": a cada
 * visita, o navegador busca o conteúdo mais recente do GitHub, em vez de
 * um conteúdo empacotado no build.
 */
export function rawPostsUrl(path: string): string {
  const bust = Date.now();
  return `${RAW_BASE}/posts/${path}?bust=${bust}`;
}
