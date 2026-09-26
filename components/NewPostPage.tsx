"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "../lib/posts";
import PostEditor from "./PostEditor";
import type { PostFormData } from "../types";

const emptyForm: PostFormData = {
  title: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  excerpt: "",
  tags: [],
  visibility: "public",
  theme: "azure",
  html: "",
};

export default function NewPostPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: PostFormData) {
    setSubmitting(true);
    setError(null);
    try {
      const post = await createPost(data);
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
        O conteúdo é criptografado e gravado no GitHub pelo servidor — nada
        disso passa pelo seu navegador em texto puro.
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
