import { NextResponse } from "next/server";
import { requireAdmin, requireEditor } from "@/lib/requireEditor";
import { readPost, removePost, writePost } from "@/lib/githubStore";
import { sanitizePostHtml } from "@/lib/sanitize";
import type { Post, PostFormData } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;

  const { slug } = await params;
  const record = await readPost(slug);
  if (!record) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ post: record.data });
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;

  const { slug } = await params;
  const existing = await readPost(slug);
  if (!existing) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  const body = (await req.json()) as PostFormData;
  const post: Post = {
    slug, // slug não muda depois de criado
    title: body.title.trim(),
    date: body.date,
    excerpt: body.excerpt.trim(),
    tags: body.tags,
    visibility: body.visibility,
    theme: body.theme,
    html: sanitizePostHtml(body.html),
  };

  await writePost(post, `editar post: ${post.title} (por ${auth.user.login})`);

  return NextResponse.json({ post });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { slug } = await params;
  const existing = await readPost(slug);
  if (!existing) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  await removePost(slug, existing.data.title);
  return NextResponse.json({ ok: true });
}
