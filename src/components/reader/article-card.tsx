"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Rss } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import type { Article } from "@/hooks/use-articles";
import Image from "next/image";

interface ArticleCardProps {
  article: Article;
  isRemoving: boolean;
  onObserve: (el: HTMLElement | null) => void;
  onUnobserve: (el: HTMLElement | null) => void;
}

export function ArticleCard({ article, isRemoving, onObserve, onUnobserve }: ArticleCardProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    onObserve(el);
    return () => onUnobserve(el);
  }, [onObserve, onUnobserve]);

  return (
    <article
      ref={ref}
      data-article-id={article.id}
      className={`group bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md dark:hover:shadow-black/30 transition-shadow duration-200${isRemoving ? " article-removing" : ""}`}
    >
      {/* Image */}
      {article.imageUrl && (
        <a href={article.url ?? undefined} target="_blank" rel="noopener noreferrer">
          <div className="relative w-full h-48 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title ?? ""}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 672px) 100vw, 672px"
              onError={(e) => {
                (e.target as HTMLImageElement).closest("a")?.remove();
              }}
            />
          </div>
        </a>
      )}

      <div className="p-4">
        {/* Feed meta */}
        <div className="flex items-center gap-1.5 mb-2">
          {article.feedFavicon ? (
            <Image
              src={article.feedFavicon}
              alt=""
              width={14}
              height={14}
              className="rounded-sm shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Rss size={12} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
          )}
          <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
            {article.feedTitle || "Feed"}
          </span>
          <span className="text-neutral-200 dark:text-neutral-700 text-xs">·</span>
          <time className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
            {formatRelativeDate(article.publishedAt)}
          </time>
        </div>

        {/* Title */}
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {article.url ? (
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {article.title || "(Sin título)"}
            </a>
          ) : (
            article.title || "(Sin título)"
          )}
        </h2>

        {/* Summary */}
        {article.summary && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        {(article.author || article.url) && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {article.author && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                {article.author}
              </span>
            )}
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-neutral-400 hover:text-blue-500 transition-colors"
                aria-label="Abrir artículo"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
