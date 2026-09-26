import "server-only";
import { env } from "./env";
import { decryptFromCode, encryptToCode } from "./crypto";
import type { Post, PostIndex } from "../types";

const API_BASE = "https://api.github.com";
const REPO_PATH = `/repos/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}`;

export class GitHubStoreError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_BOT_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GitHubStoreError(`GitHub API ${res.status} em ${path}: ${body}`, res.status);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

function encodeUtf8Base64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

function decodeBase64Utf8(base64: string): string {
  return Buffer.from(base64.replace(/\n/g, ""), "base64").toString("utf8");
}

interface FileRecord<T> {
  sha: string;
  data: T;
}

async function readEncryptedFile<T>(path: string): Promise<FileRecord<T> | null> {
  try {
    const res = await request<{ sha: string; content: string }>(
      `${REPO_PATH}/contents/posts/${path}?ref=${env.GITHUB_REPO_BRANCH}`
    );
    const code = decodeBase64Utf8(res.content);
    return { sha: res.sha, data: decryptFromCode<T>(code) };
  } catch (err) {
    if (err instanceof GitHubStoreError && err.status === 404) return null;
    throw err;
  }
}

async function writeEncryptedFile(
  path: string,
  value: unknown,
  message: string,
  sha?: string
): Promise<string> {
  const code = encryptToCode(value);
  const content = encodeUtf8Base64(code);
  const res = await request<{ content: { sha: string } }>(`${REPO_PATH}/contents/posts/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content,
      branch: env.GITHUB_REPO_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  return res.content.sha;
}

async function deleteFile(path: string, sha: string, message: string): Promise<void> {
  await request<null>(`${REPO_PATH}/contents/posts/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: env.GITHUB_REPO_BRANCH }),
  });
}

/* ---------------------------------------------------------------------- */
/* API de domínio                                                          */
/* ---------------------------------------------------------------------- */

export async function readIndex(): Promise<FileRecord<PostIndex>> {
  const found = await readEncryptedFile<PostIndex>("index.json.enc");
  return found ?? { sha: "", data: { posts: [] } };
}

export async function readPost(slug: string): Promise<FileRecord<Post> | null> {
  return readEncryptedFile<Post>(`${slug}.json.enc`);
}

export async function writePost(post: Post, message: string): Promise<void> {
  const existing = await readEncryptedFile<Post>(`${post.slug}.json.enc`);
  await writeEncryptedFile(`${post.slug}.json.enc`, post, message, existing?.sha);

  const index = await readIndex();
  const meta = {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    tags: post.tags,
    visibility: post.visibility,
    theme: post.theme,
  };
  const nextPosts = [meta, ...index.data.posts.filter((p) => p.slug !== post.slug)];
  await writeEncryptedFile(
    "index.json.enc",
    { posts: nextPosts },
    `índice: ${message}`,
    index.sha || undefined
  );
}

export async function removePost(slug: string, title: string): Promise<void> {
  const existing = await readEncryptedFile<Post>(`${slug}.json.enc`);
  if (!existing) throw new GitHubStoreError("Post não encontrado", 404);

  await deleteFile(`${slug}.json.enc`, existing.sha, `remover post: ${title}`);

  const index = await readIndex();
  const nextPosts = index.data.posts.filter((p) => p.slug !== slug);
  await writeEncryptedFile(
    "index.json.enc",
    { posts: nextPosts },
    `índice: remover ${title}`,
    index.sha || undefined
  );
}
