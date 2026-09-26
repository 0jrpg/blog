import "server-only";
import { env } from "./env";
import type { Role } from "../types";

/**
 * Consulta a API do GitHub (com o token do bot) para saber a permissão real
 * do usuário logado nesse repositório, e traduz para o papel do blog.
 * Ninguém "vira admin" clicando em nada — isso é decidido 100% pelas
 * permissões configuradas em Settings → Collaborators do repositório.
 */
export async function resolveRole(githubUsername: string): Promise<Role> {
  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}/collaborators/${githubUsername}/permission`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_BOT_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    // usuário não é colaborador, ou o repositório/token estão mal configurados
    return null;
  }

  const data = (await res.json()) as { permission: string };
  if (data.permission === "admin") return "admin";
  if (data.permission === "write" || data.permission === "maintain") return "colaborador";
  return null;
}
