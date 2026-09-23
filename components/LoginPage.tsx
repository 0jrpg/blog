"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { GITHUB_OWNER, GITHUB_REPO } from "../lib/config";

export default function LoginPage() {
  const { login, status, error, role, username } = useAuth();
  const [token, setToken] = useState("");
  const router = useRouter();

  const loggedInWithoutAccess = status === "ready" && !!username && !role;
  const loggedInWithAccess = status === "ready" && !!username && !!role;

  useEffect(() => {
    if (loggedInWithAccess) {
      router.replace("/");
    }
  }, [loggedInWithAccess, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    await login(token.trim());
  }

  if (loggedInWithAccess) {
    // Evita renderizar o formulário por um instante enquanto redireciona.
    return null;
  }

  return (
    <section className="glass article">
      <h1>Entrar</h1>
      <p className="meta" style={{ marginTop: 10 }}>
        Autenticação por token pessoal do GitHub. Quem for admin ou
        colaborador do repositório <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>{" "}
        ganha acesso à interface de criação de posts.
      </p>

      <form onSubmit={handleSubmit} className="form" style={{ marginTop: 28 }}>
        <label className="field">
          <span>Token de acesso pessoal (fine-grained)</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="github_pat_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={status === "checking"}>
          {status === "checking" ? "Verificando…" : "Entrar"}
        </button>

        {error && <p className="form-error">{error}</p>}

        {loggedInWithoutAccess && (
          <p className="form-error">
            Login válido como <strong>{username}</strong>, mas essa conta não é
            admin nem colaboradora deste repositório — peça para o dono do
            repositório te adicionar em Settings → Collaborators.
          </p>
        )}
      </form>

      <div className="glass token-help" style={{ marginTop: 32 }}>
        <strong>Como criar um token seguro para isso</strong>
        <ol>
          <li>
            No GitHub, vá em{" "}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
            >
              Settings → Developer settings → Fine-grained tokens
            </a>
            .
          </li>
          <li>
            Em <em>Repository access</em>, escolha <strong>Only select repositories</strong> e
            selecione só o repositório <code>{GITHUB_REPO}</code>.
          </li>
          <li>
            Em <em>Permissions → Repository permissions</em>, dê acesso de{" "}
            <strong>Read and write</strong> apenas para <strong>Contents</strong>.
          </li>
          <li>Defina uma validade curta (ex.: 30 ou 90 dias) e gere o token.</li>
          <li>
            Cole o token aqui. Ele fica salvo apenas neste navegador
            (<code>localStorage</code>), nunca é enviado a nenhum servidor além
            da própria API do GitHub.
          </li>
        </ol>
      </div>
    </section>
  );
}
