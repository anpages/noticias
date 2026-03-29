import { auth } from "@/auth";
import { getArticleById } from "@/lib/queries";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const article = await getArticleById(session.user.id, id);
  if (!article?.url) return NextResponse.json({ content: null });

  try {
    // Use stored RSS content first (content:encoded) — no network needed
    if (article.content && article.content.length > 200) {
      const sanitized = article.content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/\bon\w+="[^"]*"/gi, "")
        .replace(/\bon\w+='[^']*'/gi, "");
      return NextResponse.json(
        { content: sanitized },
        { headers: { "Cache-Control": "private, max-age=3600" } }
      );
    }

    const { JSDOM } = await import("jsdom");
    const { Readability } = await import("@mozilla/readability");

    const res = await fetch(article.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsReader/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ content: null });

    const html = await res.text();
    const dom = new JSDOM(html, { url: article.url });
    const parsed = new Readability(dom.window.document).parse();

    return NextResponse.json(
      { content: parsed?.content ?? null },
      { headers: { "Cache-Control": "private, max-age=3600" } }
    );
  } catch {
    return NextResponse.json({ content: null });
  }
}
