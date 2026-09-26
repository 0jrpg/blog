"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EmbedBlock } from "./EmbedExtension";
import type { EmbedAttrs } from "./EmbedExtension";
import EmbedDialog from "./EmbedDialog";
import { slugify } from "../lib/slug";
import type { PostFormData, Theme, Visibility } from "../types";

interface PostEditorProps {
  mode: "create" | "edit";
  initial: PostFormData;
  submitting: boolean;
  submitLabel: string;
  serverError: string | null;
  onSubmit: (data: PostFormData) => void;
}

const THEMES: { value: Theme; label: string }[] = [
  { value: "azure", label: "Azul (padrão)" },
  { value: "violet", label: "Violeta" },
  { value: "mint", label: "Menta" },
  { value: "sunset", label: "Pôr do sol" },
];

const VISIBILITIES: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Público", hint: "aparece na listagem, qualquer um vê" },
  { value: "unlisted", label: "Só com o link", hint: "não aparece na listagem, mas quem tem o link vê" },
  { value: "private", label: "Privado", hint: "só admin/colaborador logado consegue ver" },
];

const TEXT_COLORS = ["#e9edf7", "#6fd8ff", "#b48bff", "#3fe9c4", "#ffb84d", "#ff8a8a"];
const HIGHLIGHT_COLORS = ["#6fd8ff33", "#b48bff33", "#3fe9c433", "#ffb84d33", "#ff8a8a33"];

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
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Escreva o post aqui…" }),
      EmbedBlock,
    ],
    content: initial.html || "<p></p>",
    immediatelyRender: false,
  });

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleInsertEmbed(attrs: EmbedAttrs) {
    editor?.chain().focus().insertEmbed(attrs).run();
    setShowEmbedDialog(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const data: PostFormData = {
      title: title.trim(),
      slug: slugify(slug),
      date,
      excerpt: excerpt.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      visibility,
      theme,
      html: editor.getHTML(),
    };
    onSubmit(data);
  }

  const isValid = title.trim().length > 0 && slug.trim().length > 0 && !editor?.isEmpty;

  return (
    <form onSubmit={handleSubmit} className="form form-wide">
      <label className="field">
        <span>Título</span>
        <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} required />
      </label>

      <label className="field">
        <span>Slug</span>
        <input
          type="text"
          value={slug}
          disabled={mode === "edit"}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
        />
        {mode === "edit" && <small>O slug não muda depois de criado.</small>}
      </label>

      <div className="field-row">
        <label className="field">
          <span>Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <label className="field">
          <span>Visibilidade</span>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
            {VISIBILITIES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <small>{VISIBILITIES.find((v) => v.value === visibility)?.hint}</small>
        </label>

        <label className="field">
          <span>Tema</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Resumo</span>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} required />
      </label>

      <label className="field">
        <span>Tags (separadas por vírgula)</span>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>

      <div className="field">
        <span>Conteúdo</span>

        <div className="editor-toolbar-bar">
          <button type="button" className={editor?.isActive("bold") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBold().run()}><strong>B</strong></button>
          <button type="button" className={editor?.isActive("italic") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleItalic().run()}><em>I</em></button>
          <button type="button" className={editor?.isActive("underline") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>
          <button type="button" className={editor?.isActive("strike") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleStrike().run()}>S</button>
          <span className="toolbar-sep" />
          <button type="button" className={editor?.isActive("heading", { level: 1 }) ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
          <button type="button" className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className={editor?.isActive("bulletList") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• lista</button>
          <button type="button" className={editor?.isActive("orderedList") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. lista</button>
          <button type="button" className={editor?.isActive("blockquote") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>“ ”</button>
          <button
            type="button"
            className={editor?.isActive("link") ? "is-active" : ""}
            onClick={() => {
              const url = window.prompt("URL do link:");
              if (url) editor?.chain().focus().setLink({ href: url }).run();
            }}
          >
            link
          </button>
          <span className="toolbar-sep" />
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title="cor do texto"
              className="color-dot"
              style={{ background: c }}
              onClick={() => editor?.chain().focus().setColor(c).run()}
            />
          ))}
          <button type="button" className="toolbar-text-btn" onClick={() => editor?.chain().focus().unsetColor().run()}>limpar cor</button>
          <span className="toolbar-sep" />
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title="marca-texto"
              className="color-dot"
              style={{ background: c }}
              onClick={() => editor?.chain().focus().toggleHighlight({ color: c }).run()}
            />
          ))}
          <span className="toolbar-sep" />
          <button type="button" className="toolbar-text-btn" onClick={() => setShowEmbedDialog(true)}>
            + link / imagem / prévia
          </button>
        </div>

        {showEmbedDialog && <EmbedDialog onInsert={handleInsertEmbed} onClose={() => setShowEmbedDialog(false)} />}

        <div className="editor-surface">
          <EditorContent editor={editor} />
        </div>
      </div>

      {serverError && <p className="form-error">{serverError}</p>}

      <button className="btn btn-primary" type="submit" disabled={!isValid || submitting}>
        {submitting ? "Publicando…" : submitLabel}
      </button>
    </form>
  );
}
