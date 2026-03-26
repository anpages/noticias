import { auth } from "@/auth";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { fetchFeed } from "@/lib/feed-fetcher";
import { getUserFeeds, insertArticles, updateFeedMeta } from "@/lib/queries";
import { NextResponse } from "next/server";
import { z } from "zod";

const addFeedSchema = z.object({
  url: z.string().url("URL inválida"),
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

  const { url } = parsed.data;

  // Fetch feed metadata first to validate it's a real feed
  let feedData;
  try {
    feedData = await fetchFeed(url);
  } catch {
    return NextResponse.json({ error: "No se pudo leer el feed. Verifica la URL." }, { status: 400 });
  }

  // Insert feed
  const [newFeed] = await db
    .insert(feeds)
    .values({
      userId: session.user.id,
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

  // Insert initial articles
  await insertArticles(newFeed.id, feedData.items);

  return NextResponse.json(newFeed, { status: 201 });
}
