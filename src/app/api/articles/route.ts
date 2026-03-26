import { auth } from "@/auth";
import { getArticles } from "@/lib/queries";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const feedId = searchParams.get("feedId");
  const feedType = searchParams.get("feedType");
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);

  const result = await getArticles(session.user.id, { cursor, feedId, feedType, limit });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
