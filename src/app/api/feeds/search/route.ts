import { auth } from "@/auth";
import { NextResponse } from "next/server";

interface SearchResult {
  feedUrl: string;
  title: string;
  website: string;
  description: string;
  icon: string | null;
  subscribers: number;
}

async function searchFeedly(query: string): Promise<SearchResult[]> {
  const res = await fetch(
    `https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(query)}&count=10&locale=es`,
    { headers: { "User-Agent": "Noticias-RSS-Reader/1.0" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? [])
    .map((r: { feedId?: string; title?: string; website?: string; description?: string; iconUrl?: string; visualUrl?: string; subscribers?: number }) => ({
      feedUrl: r.feedId?.replace(/^feed\//, "") ?? "",
      title: r.title ?? "",
      website: r.website ?? "",
      description: r.description ?? "",
      icon: r.iconUrl || r.visualUrl || null,
      subscribers: r.subscribers ?? 0,
    }))
    .filter((r: SearchResult) => r.feedUrl.startsWith("http"));
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchFeedly(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
