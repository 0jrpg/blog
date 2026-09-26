import { Node, mergeAttributes } from "@tiptap/core";

export type EmbedVariant = "link" | "button" | "preview";
export type EmbedContentType = "page" | "image" | "pdf" | "other";

export interface EmbedAttrs {
  url: string;
  label: string;
  variant: EmbedVariant;
  title: string | null;
  description: string | null;
  image: string | null;
  contentType: EmbedContentType;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embedBlock: {
      insertEmbed: (attrs: EmbedAttrs) => ReturnType;
    };
  }
}

/**
 * Nó "atômico" que representa um link, botão ou prévia (imagem, PDF, página
 * qualquer). Tudo que é preciso pra desenhar o card já vem embutido nos
 * atributos — nenhuma requisição nova acontece quando alguém lê o post.
 */
export const EmbedBlock = Node.create({
  name: "embedBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      label: { default: "" },
      variant: { default: "link" },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      contentType: { default: "other" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-embed]",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            url: el.dataset.url || "",
            label: el.dataset.label || "",
            variant: (el.dataset.variant as EmbedVariant) || "link",
            title: el.dataset.title || null,
            description: el.dataset.description || null,
            image: el.dataset.image || null,
            contentType: (el.dataset.contentType as EmbedContentType) || "other",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { url, label, variant, title, description, image, contentType } = HTMLAttributes as EmbedAttrs;

    const outerAttrs = mergeAttributes({
      "data-embed": "",
      "data-url": url,
      "data-label": label,
      "data-variant": variant,
      "data-title": title || "",
      "data-description": description || "",
      "data-image": image || "",
      "data-content-type": contentType,
      class: `embed-card embed-${variant}`,
    });

    if (variant === "button") {
      return ["div", outerAttrs, ["a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow", class: "embed-button" }, label || url]];
    }

    if (variant === "preview") {
      const children: (string | (string | Record<string, string>)[])[] = [];
      if (image) {
        children.push(["img", { src: image, alt: title || label || "", class: "embed-image" }]);
      } else {
        children.push(["div", { class: `embed-icon embed-icon-${contentType}` }, contentType === "pdf" ? "PDF" : "🔗"]);
      }
      const textChildren: (string | (string | Record<string, string>)[])[] = [
        ["strong", {}, title || label || url],
      ];
      if (description) {
        textChildren.push(["span", {}, description]);
      }
      children.push(["div", { class: "embed-text" }, ...textChildren]);

      return [
        "div",
        outerAttrs,
        ["a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow", class: "embed-link" }, ...children],
      ];
    }

    // variant "link": um link simples, mas com a mesma linguagem visual
    return ["div", outerAttrs, ["a", { href: url, target: "_blank", rel: "noopener noreferrer nofollow", class: "embed-simple-link" }, label || url]];
  },

  addCommands() {
    return {
      insertEmbed:
        (attrs: EmbedAttrs) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs });
        },
    };
  },
});
