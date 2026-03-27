import { NextResponse } from "next/server";

interface ConcurrentRank {
  appid: number;
  concurrent_in_game: number;
  peak_in_game: number;
}

interface AppDetail {
  name: string;
  header_image: string;
  short_description?: string;
}

export async function GET() {
  try {
    // 1. Top games by concurrent players
    const chartsRes = await fetch(
      "https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/",
      { next: { revalidate: 300 }, headers: { "User-Agent": "Noticias-RSS-Reader/1.0" } }
    );
    if (!chartsRes.ok) throw new Error("Steam charts API failed");

    const chartsData = await chartsRes.json();
    const ranks: ConcurrentRank[] = chartsData?.response?.ranks ?? [];
    const top = ranks.slice(0, 15);
    const appids = top.map((r) => r.appid);

    // 2. Resolve names + images in one batch request
    const detailsRes = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appids.join(",")}&filters=basic`,
      { next: { revalidate: 300 }, headers: { "User-Agent": "Noticias-RSS-Reader/1.0" } }
    );
    const detailsData = detailsRes.ok ? await detailsRes.json() : {};

    const games = top
      .map((rank) => {
        const detail: AppDetail | null = detailsData?.[rank.appid]?.data ?? null;
        if (!detail) return null;
        return {
          appid: rank.appid,
          name: detail.name,
          headerImage: detail.header_image,
          description: detail.short_description ?? null,
          playerCount: rank.concurrent_in_game,
          peakCount: rank.peak_in_game,
          feedUrl: `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${rank.appid}&count=30&format=json`,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ games }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Steam data" }, { status: 500 });
  }
}
