import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { readPost } from "@/lib/githubStore";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = await readPost(slug);

  if (!record) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  const { data: post } = record;

  if (post.visibility === "private") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      // 404 em vez de 403: não confirma nem nega a existência do post
      // privado para quem não está autorizado a vê-lo.
      return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }
  }

  // "public" e "unlisted" são visíveis para qualquer visitante que tenha o
  // link — a diferença entre os dois é só não aparecer na listagem pública.
  return NextResponse.json({ post });
}
