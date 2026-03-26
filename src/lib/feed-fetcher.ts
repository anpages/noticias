import Parser from "rss-parser";

type CustomItem = {
  "media:content"?: { $?: { url?: string; medium?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  "media:group"?: { "media:thumbnail"?: [{ $?: { url?: string } }]; "media:content"?: [{ $?: { url?: string } }] };
  enclosure?: { url?: string; type?: string };
  "content:encoded"?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 10000,
  headers: {
    "User-Agent": "RSSReader/1.0 (compatible)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: false }],
      ["media:thumbnail", "media:thumbnail", { keepArray: false }],
      ["media:group", "media:group", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

export interface FeedItem {
  guid: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  author: string | null;
  imageUrl: string | null;
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

function extractImageFromHtml(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match) return null;
  const url = match[1];
  // Filter out tiny tracking pixels and icons
  if (url.includes("pixel") || url.includes("tracking") || url.includes("beacon")) return null;
  return url;
}

function extractImage(item: CustomItem & { content?: string }): string | null {
  // 1. media:content with image
  const mc = item["media:content"];
  if (mc?.$?.url && (!mc.$.medium || mc.$.medium === "image")) return mc.$.url;

  // 2. media:thumbnail
  const mt = item["media:thumbnail"];
  if (mt?.$?.url) return mt.$.url;

  // 3. media:group
  const mg = item["media:group"];
  if (mg) {
    const mgThumb = mg["media:thumbnail"]?.[0]?.$?.url;
    if (mgThumb) return mgThumb;
    const mgContent = mg["media:content"]?.[0]?.$?.url;
    if (mgContent) return mgContent;
  }

  // 4. enclosure with image mime type
  const enc = item["enclosure"];
  if (enc?.url && enc.type?.startsWith("image/")) return enc.url;

  // 5. First <img> in content:encoded or content
  const fromContent = extractImageFromHtml(item["content:encoded"] ?? item.content);
  if (fromContent) return fromContent;

  return null;
}

export async function fetchFeed(feedUrl: string): Promise<FeedData> {
  const feed = await parser.parseURL(feedUrl);

  const siteUrl = feed.link || null;
  const favicon = getFavicon(siteUrl);

  const items: FeedItem[] = (feed.items || []).map((item) => {
    const guid = item.guid || item.link || (item as { id?: string }).id || `${feedUrl}-${Date.now()}-${Math.random()}`;
    const rawSummary = item.contentSnippet || item.content || (item as { summary?: string; description?: string }).summary || (item as { description?: string }).description || "";
    const summary = extractText(rawSummary).slice(0, 400) || null;
    const imageUrl = extractImage(item as CustomItem & { content?: string });

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
      author: (item as { creator?: string; author?: string }).creator || (item as { author?: string }).author || null,
      imageUrl,
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
