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

// Tipo recursivo pro "DOM output spec" do ProseMirror: uma tag, seus
// atributos, e filhos que por sua vez podem ser texto ou outra tag aninhada.
// (Usado só como ajuda ao montar a estrutura abaixo — o retorno final do
// renderHTML fica com tipo `any` de propósito: o formato exato esperado pelo
// ProseMirror para specs aninhados é difícil de expressar com precisão no
// TypeScript, e o formato aqui é validado em runtime pelo próprio ProseMirror.)
type DomNode = string | readonly [string, Record<string, string>, ...DomNode[]];

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

    let tree: DomNode;

    if (variant === "button") {
      tree = [
        "div",
        outerAttrs,
        [
          "a",
          { href: url, target: "_blank", rel: "noopener noreferrer nofollow", class: "embed-button" },
          label || url,
        ],
      ];
    } else if (variant === "preview") {
      const thumbnail: DomNode = image
        ? ["img", { src: image, alt: title || label || "", class: "embed-image" }]
        : ["div", { class: `embed-icon embed-icon-${contentType}` }, contentType === "pdf" ? "PDF" : "🔗"];

      const textChildren: DomNode[] = [["strong", {}, title || label || url]];
      if (description) {
        textChildren.push(["span", {}, description]);
      }
      const textBlock: DomNode = ["div", { class: "embed-text" }, ...textChildren];

      tree = [
        "div",
        outerAttrs,
        [
          "a",
          { href: url, target: "_blank", rel: "noopener noreferrer nofollow", class: "embed-link" },
          thumbnail,
          textBlock,
        ],
      ];
    } else {
      // variant "link": um link simples, mas com a mesma linguagem visual
      tree = [
        "div",
        outerAttrs,
        [
          "a",
          { href: url, target: "_blank", rel: "noopener noreferrer nofollow", class: "embed-simple-link" },
          label || url,
        ],
      ];
    }

    // O tipo exato que o ProseMirror espera aqui (DOMOutputSpec, recursivo e
    // pouco expressável com precisão no TypeScript) é validado em runtime
    // pelo próprio ProseMirror — por isso o cast explícito abaixo.
    return tree as any;
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
