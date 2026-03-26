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
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(article, { headers: { "Cache-Control": "no-store" } });
}
