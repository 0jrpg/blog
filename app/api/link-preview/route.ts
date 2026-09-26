import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/requireEditor";
import { fetchLinkPreview } from "@/lib/linkPreview";

export async function GET(req: Request) {
  const auth = await requireEditor();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Parâmetro url é obrigatório." }, { status: 400 });
  }

  try {
    const preview = await fetchLinkPreview(url);
    return NextResponse.json({ preview });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Não foi possível buscar essa URL." },
      { status: 400 }
    );
  }
}
