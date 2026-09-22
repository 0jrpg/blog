import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchPost, forgetPost, primeIndex } from "../lib/posts";
import { deletePost, loadEditablePost } from "../lib/github";
import { formatDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types";
import StatusPanel from "./StatusPanel";

export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const { token, canEdit, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setPost(null);
    setError(null);
    fetchPost(slug)
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
    if (!token || !slug || !post) return;
    if (!window.confirm(`Apagar o post "${post.title}"? Isso não pode ser desfeito.`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const { sha } = await loadEditablePost(token, slug);
      await deletePost(token, slug, sha, post.title);
      forgetPost(slug);
      primeIndex((current) => current.filter((p) => p.slug !== slug));
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao apagar o post.");
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <StatusPanel
        kind="error"
        title="Não foi possível carregar este post"
        detail={error}
      />
    );
  }

  if (!post) {
    return <StatusPanel kind="loading" title="Carregando post…" />;
  }

  return (
    <article className="glass article">
      <Link to="/" className="back-link">
        ← voltar para todos os posts
      </Link>

      {canEdit && (
        <div className="editor-toolbar">
          <Link to={`/post/${post.slug}/editar`} className="btn btn-ghost">
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

      <h1>{post.title}</h1>
      <p className="meta">
        {formatDate(post.date)}
        {post.tags && post.tags.length > 0 && (
          <span className="tags" style={{ display: "inline-flex", marginLeft: 12 }}>
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </span>
        )}
      </p>
      <div className="article-body">
        {post.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
