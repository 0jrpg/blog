"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function TopNav() {
  const { data: session, status } = useSession();
  const canEdit = session?.user?.role === "admin" || session?.user?.role === "colaborador";

  return (
    <nav className="top-nav">
      <Link href="/" className="brand">
        névoa<span>.</span>
      </Link>

      <div className="nav-actions">
        {canEdit && (
          <Link href="/novo" className="btn btn-ghost btn-small">
            Novo post
          </Link>
        )}

        {session?.user ? (
          <div className="nav-user">
            <span className="badge">
              {session.user.login}
              {session.user.role && <em>{session.user.role}</em>}
            </span>
            <button className="btn btn-ghost btn-small" onClick={() => signOut({ callbackUrl: "/" })}>
              Sair
            </button>
          </div>
        ) : (
          status !== "loading" && (
            <Link href="/login" className="btn btn-ghost btn-small">
              Entrar
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
