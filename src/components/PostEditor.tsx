import { useState } from "react";
import type { FormEvent } from "react";
import { slugify } from "../lib/github";
import type { PostFormData } from "../types";

interface PostEditorProps {
  mode: "create" | "edit";
  initial: PostFormData;
  submitting: boolean;
  submitLabel: string;
  serverError: string | null;
  onSubmit: (data: PostFormData) => void;
}

export default function PostEditor({
  mode,
  initial,
  submitting,
  submitLabel,
  serverError,
  onSubmit,
}: PostEditorProps) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [date, setDate] = useState(initial.date);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [content, setContent] = useState(initial.content.join("\n\n"));

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data: PostFormData = {
      title: title.trim(),
      slug: slugify(slug),
      date,
      excerpt: excerpt.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      content: content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    };
    onSubmit(data);
  }

  const isValid = title.trim().length > 0 && slug.trim().length > 0 && content.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="form">
      <label className="field">
        <span>Título</span>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título do post"
          required
        />
      </label>

      <label className="field">
        <span>Slug (usado na URL e no nome do arquivo)</span>
        <input
          type="text"
          value={slug}
          disabled={mode === "edit"}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="meu-post"
          required
        />
        {mode === "edit" && (
          <small>O slug não pode ser alterado depois de criado, para não perder a URL do post.</small>
        )}
      </label>

      <label className="field">
        <span>Data</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <label className="field">
        <span>Resumo</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Uma frase curta que aparece na listagem"
          rows={2}
          required
        />
      </label>

      <label className="field">
        <span>Tags (separadas por vírgula)</span>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tecnologia, viagens"
        />
      </label>

      <label className="field">
        <span>Conteúdo (separe parágrafos com uma linha em branco)</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"Primeiro parágrafo.\n\nSegundo parágrafo."}
          rows={12}
          required
        />
      </label>

      {serverError && <p className="form-error">{serverError}</p>}

      <button className="btn btn-primary" type="submit" disabled={!isValid || submitting}>
        {submitting ? "Publicando…" : submitLabel}
      </button>
    </form>
  );
}
