import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "RSSReader/1.0 (compatible)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
});

export interface FeedItem {
  guid: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  author: string | null;
  publishedAt: Date | null;
}

export interface FeedData {
  title: string | null;
  description: string | null;
  siteUrl: string | null;
  favicon: string | null;
  items: FeedItem[];
}

function extractText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFavicon(siteUrl: string | null | undefined): string | null {
  if (!siteUrl) return null;
  try {
    const url = new URL(siteUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

export async function fetchFeed(feedUrl: string): Promise<FeedData> {
  const feed = await parser.parseURL(feedUrl);

  const siteUrl = feed.link || null;
  const favicon = getFavicon(siteUrl);

  const items: FeedItem[] = (feed.items || []).map((item) => {
    const guid = item.guid || item.link || item.id || `${feedUrl}-${Date.now()}-${Math.random()}`;
    const rawSummary = item.contentSnippet || item.content || item.summary || item.description || "";
    const summary = extractText(rawSummary).slice(0, 400) || null;

    let publishedAt: Date | null = null;
    if (item.isoDate) {
      const d = new Date(item.isoDate);
      if (!isNaN(d.getTime())) publishedAt = d;
    } else if (item.pubDate) {
      const d = new Date(item.pubDate);
      if (!isNaN(d.getTime())) publishedAt = d;
    }

    return {
      guid,
      title: item.title ? extractText(item.title) : null,
      url: item.link || null,
      summary,
      author: item.creator || item.author || null,
      publishedAt,
    };
  });

  return {
    title: feed.title ? extractText(feed.title) : null,
    description: feed.description ? extractText(feed.description).slice(0, 300) : null,
    siteUrl,
    favicon,
    items,
  };
}
