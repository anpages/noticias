import { auth } from "@/auth";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { fetchFeedByType } from "@/lib/feed-fetcher";
import type { FeedType } from "@/lib/feed-fetcher";
import { getUserFeeds, insertArticles } from "@/lib/queries";
import { NextResponse } from "next/server";
import { z } from "zod";

const addFeedSchema = z.object({
  url: z.string().url("URL inválida"),
  type: z.enum(["rss", "steam"]).default("rss"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getUserFeeds(session.user.id);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = addFeedSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    return NextResponse.json({ error: issues[0]?.message ?? "URL inválida" }, { status: 400 });
  }

  const { url, type } = parsed.data;

  let feedData;
  try {
    feedData = await fetchFeedByType(url, type as FeedType);
  } catch {
    return NextResponse.json({ error: "No se pudo leer el feed. Verifica la URL." }, { status: 400 });
  }

  const [newFeed] = await db
    .insert(feeds)
    .values({
      userId: session.user.id,
      type,
      url,
      title: feedData.title,
      description: feedData.description,
      siteUrl: feedData.siteUrl,
      favicon: feedData.favicon,
      lastFetched: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (!newFeed) {
    return NextResponse.json({ error: "Ya tienes este feed añadido." }, { status: 409 });
  }

  const latest = feedData.items
    .filter((i) => i.publishedAt)
    .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))
    .slice(0, 20);
  await insertArticles(newFeed.id, latest);

  return NextResponse.json(newFeed, { status: 201 });
}
