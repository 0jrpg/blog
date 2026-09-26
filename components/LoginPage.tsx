"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasAccess = status === "authenticated" && !!session?.user?.role;
  const deniedAccess = status === "authenticated" && !session?.user?.role;

  useEffect(() => {
    if (hasAccess) router.replace("/");
  }, [hasAccess, router]);

  if (hasAccess) return null;

  return (
    <section className="glass article">
      <h1>Entrar</h1>
      <p className="meta" style={{ marginTop: 10 }}>
        O login é feito com a sua própria conta do GitHub. Quem for admin ou
        colaborador do repositório deste blog ganha acesso à interface de
        criação e edição de posts — sem senha própria, sem token pra
        digitar.
      </p>

      <div style={{ marginTop: 28 }}>
        <button className="btn btn-primary" onClick={() => signIn("github", { callbackUrl: "/" })}>
          Entrar com GitHub
        </button>
      </div>

      {deniedAccess && (
        <p className="form-error" style={{ marginTop: 20 }}>
          Login feito como <strong>{session?.user?.login}</strong>, mas essa
          conta não é admin nem colaboradora deste repositório — peça para o
          dono do repositório te adicionar em Settings → Collaborators.
        </p>
      )}
    </section>
  );
}
