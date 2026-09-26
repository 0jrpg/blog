import "server-only";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { env } from "./lib/env";
import { resolveRole } from "./lib/permissions";
import type { Role } from "./types";

// Extensão de tipos: adiciona `login` (usuário GitHub) e `role` à sessão,
// mantendo os campos padrão (name/image/email) via interseção com
// DefaultSession — extender a interface substituindo o tipo inteiro de
// `user` daria erro de merge de declarações.
declare module "next-auth" {
  interface Session {
    user: {
      login: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
      // Escopo mínimo: só identificar quem é a pessoa. Ela NUNCA concede ao
      // app acesso de escrita à própria conta GitHub — quem escreve no
      // repositório é sempre o token do bot, no servidor.
      authorization: { params: { scope: "read:user" } },
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "login" in profile) {
        const login = (profile as { login: string }).login;
        token.login = login;
        token.role = await resolveRole(login);
      }
      return token;
    },
    async session({ session, token }) {
      session.user.login = (token.login as string) ?? "";
      session.user.role = (token.role as Role) ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
