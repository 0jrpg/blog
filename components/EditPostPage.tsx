"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchPostForEditing, updatePost } from "../lib/posts";
import PostEditor from "./PostEditor";
import StatusPanel from "./StatusPanel";
import type { PostFormData } from "../types";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [initial, setInitial] = useState<PostFormData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetchPostForEditing(slug)
      .then((post) => {
        if (!active) return;
        setInitial({
          title: post.title,
          slug: post.slug,
          date: post.date,
          excerpt: post.excerpt,
          tags: post.tags,
          visibility: post.visibility,
          theme: post.theme,
          html: post.html,
        });
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Erro ao carregar o post.");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  async function handleSubmit(data: PostFormData) {
    if (!slug) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const post = await updatePost(slug, data);
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
