import type { Post, PostFormData, PostIndexEntry } from "../types";

async function json<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || `Erro HTTP ${res.status}`);
  }
  return body as T;
}

/* ---------------------------------------------------------------------- */
/* leitura pública (qualquer visitante)                                    */
/* ---------------------------------------------------------------------- */

export async function fetchPublicPostList(): Promise<PostIndexEntry[]> {
  const res = await fetch("/api/posts", { cache: "no-store" });
  const data = await json<{ posts: PostIndexEntry[] }>(res);
  return data.posts;
}

export async function fetchPublicPost(slug: string): Promise<Post> {
  const res = await fetch(`/api/posts/${slug}`, { cache: "no-store" });
  const data = await json<{ post: Post }>(res);
  return data.post;
}

/* ---------------------------------------------------------------------- */
/* leitura/escrita administrativa (precisa de sessão admin/colaborador)    */
/* ---------------------------------------------------------------------- */

export async function fetchAllPosts(): Promise<PostIndexEntry[]> {
  const res = await fetch("/api/admin/posts", { cache: "no-store" });
  const data = await json<{ posts: PostIndexEntry[] }>(res);
  return data.posts;
}

export async function fetchPostForEditing(slug: string): Promise<Post> {
  const res = await fetch(`/api/admin/posts/${slug}`, { cache: "no-store" });
  const data = await json<{ post: Post }>(res);
  return data.post;
}

export async function createPost(form: PostFormData): Promise<Post> {
  const res = await fetch("/api/admin/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const data = await json<{ post: Post }>(res);
  return data.post;
}

export async function updatePost(slug: string, form: PostFormData): Promise<Post> {
  const res = await fetch(`/api/admin/posts/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const data = await json<{ post: Post }>(res);
  return data.post;
}

export async function deletePost(slug: string): Promise<void> {
  const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
  await json(res);
}
