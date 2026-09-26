import "server-only";
import type { LinkPreviewData } from "../types";

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "::1"]);

function isPrivateHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  // faixas privadas/reservadas mais comuns (checagem best-effort, não exaustiva)
  return /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|169\.254\.)/.test(hostname);
}

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const match =
    html.match(re) ||
    html.match(
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, "i")
    );
  return match ? match[1] : null;
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Só URLs http/https são permitidas.");
  }
  if (isPrivateHostname(url.hostname)) {
    throw new Error("Esse endereço não pode ser usado.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "liquid-blog-preview/1.0" },
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.startsWith("image/")) {
      return { url: url.toString(), title: null, description: null, image: url.toString(), contentType: "image" };
    }

    if (contentType.includes("application/pdf")) {
      const fileName = decodeURIComponent(url.pathname.split("/").pop() || "Documento PDF");
      return { url: url.toString(), title: fileName, description: null, image: null, contentType: "pdf" };
    }

    if (!contentType.includes("text/html")) {
      return { url: url.toString(), title: url.hostname, description: null, image: null, contentType: "other" };
    }

    // lê só os primeiros ~200KB, o suficiente pra pegar as tags <meta> do <head>
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytesRead = 0;
      while (bytesRead < 200_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        bytesRead += value.byteLength;
      }
      reader.cancel().catch(() => {});
    }

    const title = extractMeta(html, "og:title") || html.match(/<title>([^<]*)<\/title>/i)?.[1] || url.hostname;
    const description = extractMeta(html, "og:description") || extractMeta(html, "description");
    let image = extractMeta(html, "og:image");
    if (image && !image.startsWith("http")) {
      image = new URL(image, url).toString();
    }

    return { url: url.toString(), title, description, image, contentType: "page" };
  } finally {
    clearTimeout(timeout);
  }
}
