import { auth } from "@/auth";
import { db } from "@/db";
import { feeds } from "@/db/schema";
import { fetchFeed } from "@/lib/feed-fetcher";
import { insertArticles, updateFeedMeta } from "@/lib/queries";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userFeeds = await db
    .select({ id: feeds.id, url: feeds.url })
    .from(feeds)
    .where(eq(feeds.userId, session.user.id));

  if (userFeeds.length === 0) return NextResponse.json({ newArticles: 0 });

  const results = await Promise.allSettled(
    userFeeds.map(async (feed) => {
      const data = await fetchFeed(feed.url);
      await updateFeedMeta(feed.id, {
        title: data.title,
        description: data.description,
        siteUrl: data.siteUrl,
        favicon: data.favicon,
      });
      const count = await insertArticles(feed.id, data.items);
      return count;
    })
  );

  const newArticles = results.reduce((acc, r) => {
    if (r.status === "fulfilled") return acc + r.value;
    return acc;
  }, 0);

  return NextResponse.json({ newArticles }, { headers: { "Cache-Control": "no-store" } });
}
