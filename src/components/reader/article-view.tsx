"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Rss, Loader2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import Image from "next/image";

interface ArticleDetail {
  id: string;
  title: string | null;
  url: string | null;
  summary: string | null;
  content: string | null;
  author: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  feedTitle: string | null;
  feedFavicon: string | null;
  feedSiteUrl: string | null;
}

interface ArticleViewProps {
  articleId: string;
  onBack: () => void;
}

export function ArticleView({ articleId, onBack }: ArticleViewProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${articleId}`)
      .then((r) => r.json())
      .then((data) => setArticle(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500">No se pudo cargar el artículo</p>
        <button onClick={onBack} className="mt-4 text-sm text-blue-500 hover:text-blue-600">
          Volver
        </button>
      </div>
    );
  }

  const htmlContent = article.content || article.summary || "";

  return (
    <div className="pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      {/* Article header */}
      <article>
        {/* Feed info */}
        <div className="flex items-center gap-2 mb-3">
          {article.feedFavicon ? (
            <Image
              src={article.feedFavicon}
              alt=""
              width={16}
              height={16}
              className="rounded-sm shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Rss size={14} className="text-neutral-400 shrink-0" />
          )}
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {article.feedTitle || "Feed"}
          </span>
          {article.publishedAt && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700 text-sm">·</span>
              <time className="text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
                {formatRelativeDate(article.publishedAt)}
              </time>
            </>
          )}
        </div>

        {/* Title — links to original */}
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight mb-2">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {article.title || "(Sin título)"}
            </a>
          ) : (
            article.title || "(Sin título)"
          )}
        </h1>

        {/* Author + link to original */}
        <div className="flex items-center gap-3 mb-5 text-sm text-neutral-400 dark:text-neutral-500">
          {article.author && <span>{article.author}</span>}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
            >
              Ver original <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Hero image */}
        {article.imageUrl && (
          <div style={{ position: "relative", width: "100%", height: 280 }} className="rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-6">
            <Image
              src={article.imageUrl}
              alt={article.title ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 672px"
              onError={(e) => {
                const wrapper = (e.target as HTMLImageElement).parentElement;
                if (wrapper) wrapper.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Article content */}
        {htmlContent ? (
          <div
            className="article-content prose prose-neutral dark:prose-invert prose-sm max-w-none
              prose-img:rounded-lg prose-img:mx-auto
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100
              prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-p:leading-relaxed
              prose-blockquote:border-blue-300 dark:prose-blockquote:border-blue-700
              prose-code:text-sm prose-code:bg-neutral-100 dark:prose-code:bg-neutral-800 prose-code:rounded prose-code:px-1"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400 italic">
            Este artículo no tiene contenido disponible.
            {article.url && (
              <> <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Léelo en la web original</a>.</>
            )}
          </p>
        )}
      </article>
    </div>
  );
}
