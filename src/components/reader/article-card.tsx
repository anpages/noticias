"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Rss } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { Article } from "@/hooks/use-articles";
import Image from "next/image";

interface ArticleCardProps {
  article: Article;
  isRead: boolean;
  onObserve: (el: HTMLElement | null) => void;
  onUnobserve: (el: HTMLElement | null) => void;
}

export function ArticleCard({ article, isRead, onObserve, onUnobserve }: ArticleCardProps) {
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
      className={cn(
        "group bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden transition-all duration-300",
        isRead
          ? "border-neutral-100 dark:border-neutral-800/50 opacity-40"
          : "border-neutral-200 dark:border-neutral-700/60 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg hover:shadow-neutral-200/60 dark:hover:shadow-black/40"
      )}
    >
      {/* Hero image — only when unread */}
      {!isRead && article.imageUrl && (
        <a href={article.url ?? undefined} target="_blank" rel="noopener noreferrer">
          {/* height must be explicit for next/image fill to work */}
          <div style={{ position: "relative", width: "100%", height: 192 }} className="bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title ?? ""}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, 672px"
              onError={(e) => {
                const wrapper = (e.target as HTMLImageElement).closest("a");
                if (wrapper) wrapper.style.display = "none";
              }}
            />
          </div>
        </a>
      )}

      <div className="p-4">
        {/* Feed + date */}
        <div className="flex items-center gap-1.5 mb-2">
          {article.feedFavicon ? (
            <Image
              src={article.feedFavicon}
              alt=""
              width={12}
              height={12}
              className="rounded-sm shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Rss size={11} className="text-neutral-300 dark:text-neutral-600 shrink-0" />
          )}
          <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-[160px]">
            {article.feedTitle || "Feed"}
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 text-xs select-none">·</span>
          <time className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
            {formatRelativeDate(article.publishedAt)}
          </time>
        </div>

        {/* Title */}
        <h2 className={cn(
          "text-sm font-semibold leading-snug transition-colors",
          isRead
            ? "text-neutral-400 dark:text-neutral-500"
            : "text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        )}>
          {article.url ? (
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2 decoration-1">
              {article.title || "(Sin título)"}
            </a>
          ) : (
            article.title || "(Sin título)"
          )}
        </h2>

        {/* Summary — only when unread */}
        {!isRead && article.summary && (
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}

        {/* Footer — only when unread */}
        {!isRead && (article.author || article.url) && (
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
              {article.author ?? ""}
            </span>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 ml-2 flex items-center gap-1 text-xs text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                Leer <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
