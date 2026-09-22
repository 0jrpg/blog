import { rawPostsUrl } from "../config";
import type { Post, PostIndex, PostMeta } from "../types";

let indexCache: { data: PostMeta[]; fetchedAt: number } | null = null;
const postCache = new Map<string, Post>();

// Evita martelar o GitHub a cada re-render: revalida no máximo 1x por minuto.
const REVALIDATE_MS = 60_000;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao buscar ${url}: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchPostList(force = false): Promise<PostMeta[]> {
  const isFresh = indexCache && Date.now() - indexCache.fetchedAt < REVALIDATE_MS;
  if (!force && isFresh) {
    return indexCache!.data;
  }

  const data = await fetchJson<PostIndex>(rawPostsUrl("index.json"));
  const sorted = [...data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));
  indexCache = { data: sorted, fetchedAt: Date.now() };
  return sorted;
}

export async function fetchPost(slug: string): Promise<Post> {
  const cached = postCache.get(slug);
  if (cached) return cached;

  const data = await fetchJson<Post>(rawPostsUrl(`${slug}.json`));
  postCache.set(slug, data);
  return data;
}

/**
 * Injeta no cache local o resultado de uma escrita feita pela interface de
 * edição. Serve para o autor ver o post publicado imediatamente, sem
 * esperar a propagação do raw.githubusercontent.com (que pode levar
 * alguns segundos).
 */
export function primePost(post: Post): void {
  postCache.set(post.slug, post);
}

export function primeIndex(updater: (current: PostMeta[]) => PostMeta[]): void {
  const current = indexCache?.data ?? [];
  indexCache = { data: updater(current), fetchedAt: Date.now() };
}

export function forgetPost(slug: string): void {
  postCache.delete(slug);
}
