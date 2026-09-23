import { GITHUB_BRANCH, GITHUB_OWNER, GITHUB_REPO } from "./config";
import type { Collaborator, Post, PostFormData, PostIndex, PostMeta, Role } from "../types";

const API_BASE = "https://api.github.com";
const REPO_PATH = `/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GitHubApiError(`GitHub API ${res.status} em ${path}: ${body}`, res.status);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

/* ---------------------------------------------------------------------- */
/* identidade e permissão                                                  */
/* ---------------------------------------------------------------------- */

export interface Viewer {
  login: string;
  avatarUrl: string;
}

export async function getViewer(token: string): Promise<Viewer> {
  const data = await request<{ login: string; avatar_url: string }>(token, "/user");
  return { login: data.login, avatarUrl: data.avatar_url };
}

export function roleFromPermission(permission: string): Role | null {
  if (permission === "admin") return "admin";
  if (permission === "write" || permission === "maintain") return "colaborador";
  return null;
}

export async function getRole(token: string, username: string): Promise<Role | null> {
  const data = await request<{ permission: string }>(
    token,
    `${REPO_PATH}/collaborators/${username}/permission`
  );
  return roleFromPermission(data.permission);
}

export async function listCollaborators(token: string): Promise<Collaborator[]> {
  const data = await request<
    { login: string; avatar_url: string; permissions?: Record<string, boolean> }[]
  >(token, `${REPO_PATH}/collaborators?per_page=100`);

  return data.map((c) => {
    const permission = c.permissions?.admin
      ? "admin"
      : c.permissions?.push
        ? "write"
        : c.permissions?.pull
          ? "read"
          : "none";
    return {
      login: c.login,
      avatarUrl: c.avatar_url,
      permission,
      role: roleFromPermission(permission),
    };
  });
}

/* ---------------------------------------------------------------------- */
/* leitura/escrita crua de arquivos (Contents API)                         */
/* ---------------------------------------------------------------------- */

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

interface FileRecord<T> {
  sha: string;
  data: T;
}

async function readJsonFile<T>(token: string, path: string): Promise<FileRecord<T>> {
  const res = await request<{ sha: string; content: string }>(
    token,
    `${REPO_PATH}/contents/posts/${path}?ref=${GITHUB_BRANCH}`
  );
  return { sha: res.sha, data: JSON.parse(decodeBase64Utf8(res.content)) as T };
}

async function writeJsonFile(
  token: string,
  path: string,
  value: unknown,
  message: string,
  sha?: string
): Promise<string> {
  const content = encodeBase64Utf8(JSON.stringify(value, null, 2) + "\n");
  const res = await request<{ content: { sha: string } }>(
    token,
    `${REPO_PATH}/contents/posts/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({ message, content, branch: GITHUB_BRANCH, ...(sha ? { sha } : {}) }),
    }
  );
  return res.content.sha;
}

async function deleteFile(token: string, path: string, sha: string, message: string): Promise<void> {
  await request<null>(token, `${REPO_PATH}/contents/posts/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
  });
}

/* ---------------------------------------------------------------------- */
/* helpers de domínio                                                      */
/* ---------------------------------------------------------------------- */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function slugExists(token: string, slug: string): Promise<boolean> {
  try {
    await readJsonFile(token, `${slug}.json`);
    return true;
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return false;
    throw err;
  }
}

export async function loadEditableIndex(token: string): Promise<FileRecord<PostIndex>> {
  return readJsonFile<PostIndex>(token, "index.json");
}

export async function loadEditablePost(token: string, slug: string): Promise<FileRecord<Post>> {
  return readJsonFile<Post>(token, `${slug}.json`);
}

function toMeta(form: PostFormData): PostMeta {
  return {
    slug: form.slug,
    title: form.title,
    date: form.date,
    excerpt: form.excerpt,
    tags: form.tags,
  };
}

export async function createPost(token: string, form: PostFormData): Promise<Post> {
  const post: Post = { ...toMeta(form), content: form.content };

  await writeJsonFile(token, `${form.slug}.json`, post, `novo post: ${form.title}`);

  const index = await loadEditableIndex(token);
  const nextPosts = [toMeta(form), ...index.data.posts.filter((p) => p.slug !== form.slug)];
  await writeJsonFile(token, "index.json", { posts: nextPosts }, `índice: novo post ${form.title}`, index.sha);

  return post;
}

export async function updatePost(
  token: string,
  slug: string,
  form: PostFormData,
  postSha: string
): Promise<Post> {
  const post: Post = { ...toMeta(form), content: form.content };

  await writeJsonFile(token, `${slug}.json`, post, `editar post: ${form.title}`, postSha);

  const index = await loadEditableIndex(token);
  const nextPosts = index.data.posts.map((p) => (p.slug === slug ? toMeta(form) : p));
  await writeJsonFile(token, "index.json", { posts: nextPosts }, `índice: editar ${form.title}`, index.sha);

  return post;
}

export async function deletePost(token: string, slug: string, postSha: string, title: string): Promise<void> {
  await deleteFile(token, `${slug}.json`, postSha, `remover post: ${title}`);

  const index = await loadEditableIndex(token);
  const nextPosts = index.data.posts.filter((p) => p.slug !== slug);
  await writeJsonFile(token, "index.json", { posts: nextPosts }, `índice: remover ${title}`, index.sha);
}
