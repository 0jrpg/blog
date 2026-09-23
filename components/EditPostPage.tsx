"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { loadEditablePost, updatePost } from "../lib/github";
import { primeIndex, primePost } from "../lib/posts";
import PostEditor from "./PostEditor";
import StatusPanel from "./StatusPanel";
import type { PostFormData } from "../types";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [initial, setInitial] = useState<PostFormData | null>(null);
  const [postSha, setPostSha] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !slug) return;
    let active = true;
    loadEditablePost(token, slug)
      .then(({ sha, data }) => {
        if (!active) return;
        setPostSha(sha);
        setInitial({
          title: data.title,
          slug: data.slug,
          date: data.date,
          excerpt: data.excerpt,
          tags: data.tags ?? [],
          content: data.content,
        });
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Erro ao carregar o post.");
      });
    return () => {
      active = false;
    };
  }, [token, slug]);

  async function handleSubmit(data: PostFormData) {
    if (!token || !slug || !postSha) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const post = await updatePost(token, slug, data, postSha);
      primePost(post);
      primeIndex((current) =>
        current.map((p) =>
          p.slug === slug
            ? { slug: post.slug, title: post.title, date: post.date, excerpt: post.excerpt, tags: post.tags }
            : p
        )
      );
      router.push(`/post/${post.slug}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro desconhecido ao salvar.");
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <StatusPanel kind="error" title="Não foi possível carregar este post" detail={loadError} />;
  }

  if (!initial) {
    return <StatusPanel kind="loading" title="Carregando post para edição…" />;
  }

  return (
    <section className="glass article">
      <h1>Editar post</h1>
      <div style={{ marginTop: 28 }}>
        <PostEditor
          mode="edit"
          initial={initial}
          submitting={submitting}
          submitLabel="Salvar alterações"
          serverError={submitError}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
