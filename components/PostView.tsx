"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { deletePost, fetchPublicPost } from "../lib/posts";
import { formatDate } from "../lib/format";
import type { Post } from "../types";
import StatusPanel from "./StatusPanel";

const VISIBILITY_LABEL: Record<Post["visibility"], string> = {
  public: "público",
  unlisted: "só com o link",
  private: "privado",
};

export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const canEdit = session?.user?.role === "admin" || session?.user?.role === "colaborador";
  const isAdmin = session?.user?.role === "admin";

  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setPost(null);
    setError(null);
    fetchPublicPost(slug)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Erro desconhecido");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  async function handleDelete() {
    if (!slug || !post) return;
    if (!window.confirm(`Apagar o post "${post.title}"? Isso não pode ser desfeito.`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(slug);
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao apagar o post.");
      setDeleting(false);
    }
  }

  if (error) {
    return <StatusPanel kind="error" title="Não foi possível carregar este post" detail={error} />;
  }

  if (!post) {
    return <StatusPanel kind="loading" title="Carregando post…" />;
  }

  return (
    <article className={`glass article theme-${post.theme}`}>
      <Link href="/" className="back-link">
        ← voltar para todos os posts
      </Link>

      {canEdit && (
        <div className="editor-toolbar">
          <Link href={`/post/${post.slug}/editar`} className="btn btn-ghost">
            Editar
          </Link>
          {isAdmin && (
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Apagando…" : "Apagar"}
            </button>
          )}
        </div>
      )}
      {deleteError && <p className="form-error">{deleteError}</p>}

      <span className={`visibility-pill visibility-${post.visibility}`}>
        {VISIBILITY_LABEL[post.visibility]}
      </span>

      <h1>{post.title}</h1>
      <p className="meta">
        {formatDate(post.date)}
        {post.tags.length > 0 && (
          <span className="tags" style={{ display: "inline-flex", marginLeft: 12 }}>
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </span>
        )}
      </p>

      {/* post.html já foi sanitizado no servidor antes de ser gravado */}
      <div className="article-body rich-content" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
