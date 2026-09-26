import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/requireEditor";
import { readIndex, readPost, writePost } from "@/lib/githubStore";
import { sanitizePostHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";
import type { Post, PostFormData } from "@/types";

export async function GET() {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;

  const index = await readIndex();
  const sorted = [...index.data.posts].sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ posts: sorted });
}

export async function POST(req: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as PostFormData;
  const slug = slugify(body.slug || body.title);

  if (!slug || !body.title.trim()) {
    return NextResponse.json({ error: "Título e slug são obrigatórios." }, { status: 400 });
  }

  const existing = await readPost(slug);
  if (existing) {
    return NextResponse.json(
      { error: `Já existe um post com o slug "${slug}".` },
      { status: 409 }
    );
  }

  const post: Post = {
    slug,
    title: body.title.trim(),
    date: body.date,
    excerpt: body.excerpt.trim(),
    tags: body.tags,
    visibility: body.visibility,
    theme: body.theme,
    html: sanitizePostHtml(body.html),
  };

  await writePost(post, `novo post: ${post.title} (por ${auth.user.login})`);

  return NextResponse.json({ post }, { status: 201 });
}
