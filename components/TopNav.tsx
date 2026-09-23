"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function TopNav() {
  const { username, role, canEdit, logout, status } = useAuth();

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

        {username ? (
          <div className="nav-user">
            <span className="badge">
              {username}
              {role && <em>{role}</em>}
            </span>
            <button className="btn btn-ghost btn-small" onClick={logout}>
              Sair
            </button>
          </div>
        ) : (
          status !== "checking" && (
            <Link href="/login" className="btn btn-ghost btn-small">
              Entrar
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
