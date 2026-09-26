import { NextResponse } from "next/server";
import { readIndex } from "@/lib/githubStore";

export async function GET() {
  const index = await readIndex();
  const publicPosts = index.data.posts
    .filter((p) => p.visibility === "public")
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ posts: publicPosts });
}
