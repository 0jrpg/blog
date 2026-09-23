"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { createPost, slugExists } from "../lib/github";
import { primeIndex, primePost } from "../lib/posts";
import PostEditor from "./PostEditor";
import type { PostFormData } from "../types";

const emptyForm: PostFormData = {
  title: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  excerpt: "",
  tags: [],
  content: [],
};

export default function NewPostPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: PostFormData) {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const exists = await slugExists(token, data.slug);
      if (exists) {
        setError(`Já existe um post com o slug "${data.slug}". Escolha outro título ou slug.`);
        setSubmitting(false);
        return;
      }

      const post = await createPost(token, data);
      primePost(post);
      primeIndex((current) => [
        { slug: post.slug, title: post.title, date: post.date, excerpt: post.excerpt, tags: post.tags },
        ...current,
      ]);
      router.push(`/post/${post.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao publicar.");
      setSubmitting(false);
    }
  }

  return (
    <section className="glass article">
      <h1>Novo post</h1>
      <p className="meta" style={{ marginTop: 10 }}>
        Isso cria o arquivo <code>posts/&lt;slug&gt;.json</code> e atualiza o{" "}
        <code>posts/index.json</code> direto no repositório, via a API do GitHub.
      </p>
      <div style={{ marginTop: 28 }}>
        <PostEditor
          mode="create"
          initial={emptyForm}
          submitting={submitting}
          submitLabel="Publicar post"
          serverError={error}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
