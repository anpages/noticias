import type { FeedData, FeedItem } from "./feed-fetcher";

interface SteamNewsItem {
  gid: string;
  title: string;
  url: string;
  contents: string;
  date: number;
  author: string;
  appid: number;
}

interface SteamNewsResponse {
  appnews?: {
    appid: number;
    newsitems: SteamNewsItem[];
  };
}

function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match) return null;
  const url = match[1];
  if (url.includes("pixel") || url.includes("tracking")) return null;
  return url;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\{STEAM_CLAN_IMAGE\}/g, "https://clan.cloudflare.steamstatic.com/images/")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveImages(html: string): string {
  return html.replace(
    /\{STEAM_CLAN_IMAGE\}/g,
    "https://clan.cloudflare.steamstatic.com/images/"
  );
}

export function getAppIdFromUrl(url: string): string | null {
  const match = url.match(/appid=(\d+)/);
  return match ? match[1] : null;
}

export function buildSteamNewsUrl(appId: string): string {
  return `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=30&format=json`;
}

export async function fetchSteamFeed(feedUrl: string): Promise<FeedData> {
  const appId = getAppIdFromUrl(feedUrl);
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "Noticias-RSS-Reader/1.0" },
  });

  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);

  const data: SteamNewsResponse = await res.json();
  const newsItems = data.appnews?.newsitems ?? [];

  const items: FeedItem[] = newsItems.map((item) => {
    const resolvedContents = resolveImages(item.contents);
    return {
      guid: item.gid,
      title: item.title,
      url: item.url,
      summary: stripHtml(resolvedContents).slice(0, 400) || null,
      content: resolvedContents || null,
      author: item.author || null,
      imageUrl: extractImageFromHtml(resolvedContents),
      publishedAt: new Date(item.date * 1000),
    };
  });

  // Try to get game name from Steam store
  let gameTitle = `Steam App ${appId}`;
  let gameIcon: string | null = null;
  if (appId) {
    try {
      const storeRes = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`,
        { headers: { "User-Agent": "Noticias-RSS-Reader/1.0" } }
      );
      const storeData = await storeRes.json();
      const appData = storeData?.[appId]?.data;
      if (appData) {
        gameTitle = appData.name || gameTitle;
        gameIcon = appData.header_image || null;
      }
    } catch { /* ignore */ }
  }

  return {
    title: gameTitle,
    description: `Noticias de ${gameTitle}`,
    siteUrl: `https://store.steampowered.com/app/${appId}`,
    favicon: gameIcon,
    items,
  };
}
