import { NextResponse } from "next/server";

const BASE_URL =
  "https://raw.githubusercontent.com/plenaryapp/awesome-rss-feeds/master/recommended/with_category";

function getAttr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}=["']([^"']*)["']`);
  const m = tag.match(re);
  return m ? decodeXmlEntities(m[1]) : null;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseOpml(xml: string) {
  const feeds: { title: string; xmlUrl: string; description: string | null; htmlUrl: string | null }[] = [];
  const tagRe = /<outline([^>]+)(?:\/>|>)/g;
  let m;
  while ((m = tagRe.exec(xml)) !== null) {
    const attrs = m[1];
    const xmlUrl = getAttr(attrs, "xmlUrl");
    if (!xmlUrl) continue;
    const title = getAttr(attrs, "title") || getAttr(attrs, "text") || "";
    const description = getAttr(attrs, "description");
    const htmlUrl = getAttr(attrs, "htmlUrl");
    feeds.push({ title, xmlUrl, description, htmlUrl });
  }
  return feeds;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  if (!category) return NextResponse.json({ error: "Missing category" }, { status: 400 });

  const url = `${BASE_URL}/${encodeURIComponent(category)}.opml`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Noticias-RSS-Reader/1.0" },
    });
    if (!res.ok) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const xml = await res.text();
    const feeds = parseOpml(xml);
    return NextResponse.json({ feeds }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch OPML" }, { status: 500 });
  }
}
