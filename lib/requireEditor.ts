import "server-only";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth";
import type { Session } from "next-auth";

type EditorSession = Session & { user: Session["user"] & { role: "admin" | "colaborador" } };

export async function requireEditor(): Promise<EditorSession | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) {
    return NextResponse.json({ error: "Não autenticado ou sem permissão." }, { status: 401 });
  }
  return session as EditorSession;
}

export async function requireAdmin(): Promise<EditorSession | NextResponse> {
  const result = await requireEditor();
  if (result instanceof NextResponse) return result;
  if (result.user.role !== "admin") {
    return NextResponse.json({ error: "Ação restrita a administradores." }, { status: 403 });
  }
  return result;
}
