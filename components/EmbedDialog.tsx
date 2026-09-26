"use client";

import { useState } from "react";
import type { EmbedAttrs, EmbedVariant } from "./EmbedExtension";
import type { LinkPreviewData } from "../types";

interface EmbedDialogProps {
  onInsert: (attrs: EmbedAttrs) => void;
  onClose: () => void;
}

export default function EmbedDialog({ onInsert, onClose }: EmbedDialogProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [variant, setVariant] = useState<EmbedVariant>("preview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInsert() {
    if (!url.trim()) return;

    if (variant !== "preview") {
      onInsert({
        url: url.trim(),
        label: label.trim() || url.trim(),
        variant,
        title: null,
        description: null,
        image: null,
        contentType: "other",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url.trim())}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Não foi possível gerar a prévia.");
      const preview = body.preview as LinkPreviewData;
      onInsert({
        url: preview.url,
        label: label.trim() || preview.title || preview.url,
        variant: "preview",
        title: preview.title,
        description: preview.description,
        image: preview.image,
        contentType: preview.contentType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar prévia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass embed-dialog">
      <div className="field">
        <span>URL (imagem, PDF, página, qualquer link)</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          autoFocus
        />
      </div>
      <div className="field">
        <span>Texto do link (opcional)</span>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Imagem" />
      </div>
      <div className="field">
        <span>Como mostrar</span>
        <select value={variant} onChange={(e) => setVariant(e.target.value as EmbedVariant)}>
          <option value="preview">Prévia (imagem/título/descrição)</option>
          <option value="button">Botão</option>
          <option value="link">Link simples</option>
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="embed-dialog-actions">
        <button type="button" className="btn btn-ghost btn-small" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary btn-small" onClick={handleInsert} disabled={loading || !url.trim()}>
          {loading ? "Buscando prévia…" : "Inserir"}
        </button>
      </div>
    </div>
  );
}
