import { db } from "@/db";
import { articles, feeds } from "@/db/schema";
import { fetchFeedByType } from "@/lib/feed-fetcher";
import type { FeedType } from "@/lib/feed-fetcher";
import { insertArticles, updateFeedMeta } from "@/lib/queries";
import { lt, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ARTICLES_PER_FEED = 20;

export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Sync all feeds
  const allFeeds = await db
    .select({ id: feeds.id, url: feeds.url, type: feeds.type, lastFetched: feeds.lastFetched })
    .from(feeds);

  let newArticles = 0;
  const results = await Promise.allSettled(
    allFeeds.map(async (feed) => {
      const data = await fetchFeedByType(feed.url, feed.type as FeedType);
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

  // 2. Cleanup: delete articles older than 7 days
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
  const deleted = await db
    .delete(articles)
    .where(lt(articles.publishedAt, sevenDaysAgo))
    .returning({ id: articles.id });

  // 3. Cleanup: keep max N articles per feed
  const overflow = await db.execute(sql`
    DELETE FROM articles WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY feed_id ORDER BY published_at DESC) as rn
        FROM articles
      ) ranked
      WHERE rn > ${MAX_ARTICLES_PER_FEED}
    )
  `);

  return NextResponse.json({
    synced: allFeeds.length,
    newArticles,
    deletedOld: deleted.length,
    trimmedOverflow: overflow.rowCount ?? 0,
  }, { headers: { "Cache-Control": "no-store" } });
}
