import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getArticleById } from "@/lib/queries";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";

async function extractContent(html: string, baseUrl: string): Promise<string | null> {
  try {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, { url: baseUrl });
    return new Readability(dom.window.document).parse()?.content ?? null;
  } catch {
    return null;
  }
}

async function fetchAndExtract(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsReader/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    return new Readability(dom.window.document).parse()?.content ?? null;
  } catch {
    return null;
  }
}

export default async function ArticleReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const article = await getArticleById(session.user.id, id);
  if (!article) redirect("/reader");

  const baseUrl = article.url ?? article.feedSiteUrl ?? "https://example.com";

  // 1. Try stored RSS content (content:encoded — often already full article)
  let content: string | null = null;
  if (article.content && article.content.length > 200) {
    content = await extractContent(article.content, baseUrl);
  }

  // 2. Fall back to fetching and parsing the original URL
  if (!content && article.url) {
    content = await fetchAndExtract(article.url);
  }

  return (
    <div style={{ minHeight: "100dvh" }} className="bg-[#f1f1f2] dark:bg-[#08080a]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/reader"
            className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors shrink-0"
            >
              <ExternalLink size={13} />
              Original
            </a>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Meta */}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          {article.feedTitle && <span>{article.feedTitle}</span>}
          {article.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <span>{formatRelativeDate(article.publishedAt)}</span>
            </>
          )}
          {article.author && (
            <>
              <span aria-hidden>·</span>
              <span>{article.author}</span>
            </>
          )}
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug mb-6">
          {article.title}
        </h1>

        {/* Hero image */}
        {article.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.imageUrl}
            alt={article.title ?? ""}
            className="w-full rounded-xl object-cover mb-6"
          />
        )}

        {/* Article content */}
        {content ? (
          <div
            className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none prose-img:rounded-lg prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-headings:font-bold"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              No se pudo extraer el contenido del artículo.
            </p>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <ExternalLink size={14} />
                Abrir artículo original
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
