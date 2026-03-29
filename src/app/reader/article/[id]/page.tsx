import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getArticleById } from "@/lib/queries";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import { ArticleContent } from "./article-content";

/** Strip scripts and event handlers from RSS HTML — lightweight server-side sanitization. */
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\bon\w+="[^"]*"/gi, "")
    .replace(/\bon\w+='[^']*'/gi, "");
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

  const rssContent =
    article.content && article.content.length > 200
      ? sanitize(article.content)
      : null;

  return (
    <div style={{ minHeight: "100dvh" }} className="bg-[#f1f1f2] dark:bg-[#08080a] animate-page-enter">
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

        {/* Content: RSS content inline, or client-side extractor for full page */}
        <ArticleContent
          rssContent={rssContent}
          articleUrl={article.url}
          articleId={article.id}
        />
      </main>
    </div>
  );
}
