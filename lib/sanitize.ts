import "server-only";
import sanitizeHtml from "sanitize-html";

// -----------------------------------------------------------------------------
// O HTML que sai do editor é sempre sanitizado no servidor antes de ser
// criptografado e gravado no GitHub — mesmo sendo só admin/colaborador
// escrevendo, é assim que se evita que um post malicioso (ou uma conta
// comprometida) injete <script>, onError=, iframes etc. em quem lê o blog.
// -----------------------------------------------------------------------------

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "blockquote", "code", "pre",
      "h1", "h2", "h3", "ul", "ol", "li", "a", "img", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class", "data-variant"],
      img: ["src", "alt", "class"],
      span: ["style", "class"],
      div: [
        "class",
        "data-embed",
        "data-url",
        "data-label",
        "data-variant",
        "data-title",
        "data-description",
        "data-image",
        "data-content-type",
      ],
      "*": [],
    },
    // só cor de texto/fundo passam por "style", nada mais (sem position,
    // display, background com url(), etc.)
    allowedStyles: {
      span: {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
    },
  });
}
