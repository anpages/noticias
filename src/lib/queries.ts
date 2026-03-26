import { db } from "@/db";
import { articles, feeds } from "@/db/schema";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { FeedItem } from "./feed-fetcher";

export async function getUserFeeds(userId: string) {
  const result = await db
    .select({
      id: feeds.id,
      type: feeds.type,
      url: feeds.url,
      title: feeds.title,
      favicon: feeds.favicon,
      siteUrl: feeds.siteUrl,
      lastFetched: feeds.lastFetched,
      unreadCount: sql<number>`
        COUNT(DISTINCT ${articles.id}) FILTER (
          WHERE ${articles.id} IS NOT NULL
        )::int
      `.as("unread_count"),
    })
    .from(feeds)
    .leftJoin(articles, eq(articles.feedId, feeds.id))
    .where(eq(feeds.userId, userId))
    .groupBy(feeds.id)
    .orderBy(asc(feeds.createdAt));

  return result;
}

export async function getArticles(
  userId: string,
  options: {
    cursor?: string | null;
    limit?: number;
    feedId?: string | null;
    feedType?: string | null;
  }
) {
  const { cursor, limit = 30, feedId, feedType } = options;

  const userFeeds = await db
    .select({ id: feeds.id, type: feeds.type })
    .from(feeds)
    .where(eq(feeds.userId, userId));

  if (userFeeds.length === 0) return { articles: [], nextCursor: null };

  let filtered = userFeeds;
  if (feedId) {
    filtered = userFeeds.filter((f) => f.id === feedId);
  } else if (feedType) {
    filtered = userFeeds.filter((f) => f.type === feedType);
  }
  const feedIds = filtered.map((f) => f.id);

  if (feedIds.length === 0) return { articles: [], nextCursor: null };

  const conditions = [
    inArray(articles.feedId, feedIds),
  ];

  if (cursor) {
    conditions.push(gt(articles.publishedAt, new Date(cursor)));
  }

  const rows = await db
    .select({
      id: articles.id,
      feedId: articles.feedId,
      title: articles.title,
      url: articles.url,
      summary: articles.summary,
      author: articles.author,
      imageUrl: articles.imageUrl,
      publishedAt: articles.publishedAt,
      feedTitle: feeds.title,
      feedFavicon: feeds.favicon,
    })
    .from(articles)
    .innerJoin(feeds, eq(feeds.id, articles.feedId))
    .where(and(...conditions))
    .orderBy(asc(articles.publishedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].publishedAt?.toISOString() ?? null : null;

  return { articles: items, nextCursor };
}

export async function getArticleById(userId: string, articleId: string) {
  const row = await db
    .select({
      id: articles.id,
      feedId: articles.feedId,
      title: articles.title,
      url: articles.url,
      summary: articles.summary,
      content: articles.content,
      author: articles.author,
      imageUrl: articles.imageUrl,
      publishedAt: articles.publishedAt,
      feedTitle: feeds.title,
      feedFavicon: feeds.favicon,
      feedSiteUrl: feeds.siteUrl,
    })
    .from(articles)
    .innerJoin(feeds, eq(feeds.id, articles.feedId))
    .where(and(eq(articles.id, articleId), eq(feeds.userId, userId)))
    .limit(1);

  return row[0] ?? null;
}

export async function insertArticles(feedId: string, items: FeedItem[], lastFetched?: Date | null) {
  if (items.length === 0) return 0;

  // Only insert articles newer than lastFetched to avoid re-inserting old ones
  const filtered = lastFetched
    ? items.filter((item) => item.publishedAt && item.publishedAt > lastFetched)
    : items;

  if (filtered.length === 0) return 0;

  const values = filtered.map((item) => ({
    feedId,
    guid: item.guid,
    title: item.title,
    url: item.url,
    summary: item.summary,
    content: item.content,
    author: item.author,
    imageUrl: item.imageUrl,
    publishedAt: item.publishedAt,
  }));

  const result = await db
    .insert(articles)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: articles.id });

  return result.length;
}

export async function deleteArticles(userId: string, articleIds: string[]) {
  if (articleIds.length === 0) return;
  // Only delete articles that belong to user's feeds
  const userFeedIds = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(eq(feeds.userId, userId));
  const feedIdSet = new Set(userFeedIds.map((f) => f.id));

  // Get articles that belong to user's feeds
  const toDelete = await db
    .select({ id: articles.id, feedId: articles.feedId })
    .from(articles)
    .where(inArray(articles.id, articleIds));

  const validIds = toDelete.filter((a) => feedIdSet.has(a.feedId)).map((a) => a.id);
  if (validIds.length === 0) return;

  await db.delete(articles).where(inArray(articles.id, validIds));
}

export async function updateFeedMeta(
  feedId: string,
  meta: { title?: string | null; description?: string | null; siteUrl?: string | null; favicon?: string | null }
) {
  await db
    .update(feeds)
    .set({ ...meta, lastFetched: new Date() })
    .where(eq(feeds.id, feedId));
}
