import { db } from "@/db";
import { feeds } from "@/db/schema";
import { fetchFeedByType } from "@/lib/feed-fetcher";
import { insertArticles, updateFeedMeta } from "@/lib/queries";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamFeeds = await db
    .select({ id: feeds.id, url: feeds.url, type: feeds.type, lastFetched: feeds.lastFetched })
    .from(feeds)
    .where(eq(feeds.type, "steam"));

  let newArticles = 0;
  const results = await Promise.allSettled(
    steamFeeds.map(async (feed) => {
      const data = await fetchFeedByType(feed.url, "steam");
      await updateFeedMeta(feed.id, {
        title: data.title,
        description: data.description,
        siteUrl: data.siteUrl,
        favicon: data.favicon,
      });
      return insertArticles(feed.id, data.items, feed.lastFetched);
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") newArticles += r.value;
  }

  return NextResponse.json({
    synced: steamFeeds.length,
    newArticles,
  }, { headers: { "Cache-Control": "no-store" } });
}
