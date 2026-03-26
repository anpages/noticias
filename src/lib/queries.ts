import { db } from "@/db";
import { articles, feeds, readStatus } from "@/db/schema";
import { and, asc, eq, gt, gte, inArray, notExists, sql } from "drizzle-orm";
import type { FeedItem } from "./feed-fetcher";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function getUserFeeds(userId: string) {
  const result = await db
    .select({
      id: feeds.id,
      url: feeds.url,
      title: feeds.title,
      favicon: feeds.favicon,
      siteUrl: feeds.siteUrl,
      lastFetched: feeds.lastFetched,
      unreadCount: sql<number>`
        COUNT(DISTINCT ${articles.id}) FILTER (
          WHERE ${articles.id} IS NOT NULL
          AND ${articles.publishedAt} >= NOW() - INTERVAL '3 days'
          AND NOT EXISTS (
            SELECT 1 FROM ${readStatus} rs
            WHERE rs.article_id = ${articles.id}
            AND rs.user_id = ${userId}
          )
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
  }
) {
  const { cursor, limit = 30, feedId } = options;

  const userFeeds = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(eq(feeds.userId, userId));

  if (userFeeds.length === 0) return { articles: [], nextCursor: null };

  const feedIds = feedId
    ? userFeeds.filter((f) => f.id === feedId).map((f) => f.id)
    : userFeeds.map((f) => f.id);

  if (feedIds.length === 0) return { articles: [], nextCursor: null };

  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS);

  const conditions = [
    inArray(articles.feedId, feedIds),
    // Only last 3 days
    gte(articles.publishedAt, threeDaysAgo),
    // Exclude read articles
    notExists(
      db
        .select({ one: sql`1` })
        .from(readStatus)
        .where(
          and(
            eq(readStatus.articleId, articles.id),
            eq(readStatus.userId, userId)
          )
        )
    ),
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

export async function insertArticles(feedId: string, items: FeedItem[]) {
  if (items.length === 0) return 0;

  const values = items.map((item) => ({
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
    .onConflictDoUpdate({
      target: [articles.feedId, articles.guid],
      set: { imageUrl: sql`excluded.image_url`, content: sql`COALESCE(excluded.content, ${articles.content})` },
    })
    .returning({ id: articles.id });

  return result.length;
}

export async function upsertReadStatus(userId: string, articleIds: string[]) {
  if (articleIds.length === 0) return;
  const values = articleIds.map((articleId) => ({ userId, articleId }));
  await db.insert(readStatus).values(values).onConflictDoNothing();
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
