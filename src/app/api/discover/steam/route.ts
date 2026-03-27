import { NextResponse } from "next/server";

interface FeaturedItem {
  id: number;
  name: string;
  header_image: string;
  discount_percent: number;
  final_price: number;
  currency: string;
}

interface FeaturedCategories {
  top_sellers?: { items: FeaturedItem[] };
  specials?: { items: FeaturedItem[] };
}

export async function GET() {
  try {
    const res = await fetch(
      "https://store.steampowered.com/api/featuredcategories/?cc=es&l=spanish",
      { next: { revalidate: 300 }, headers: { "User-Agent": "Noticias-RSS-Reader/1.0" } }
    );
    if (!res.ok) throw new Error("Steam Store API failed");

    const data: FeaturedCategories = await res.json();
    const items = data?.top_sellers?.items ?? [];

    const games = items
      .filter((item) => item.name && item.header_image)
      .slice(0, 16)
      .map((item) => ({
        appid: item.id,
        name: item.name,
        headerImage: item.header_image,
        discountPercent: item.discount_percent,
        feedUrl: `https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${item.id}&count=30&format=json`,
      }));

    return NextResponse.json({ games }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Steam data" }, { status: 500 });
  }
}
