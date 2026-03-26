"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useArticles } from "@/hooks/use-articles";
import { useReadObserver } from "@/hooks/use-read-observer";
import { useSync } from "@/hooks/use-sync";
import { ArticleCard } from "./article-card";
import { Loader2, RefreshCw, Inbox } from "lucide-react";

interface ArticleListProps {
  feedId: string | null;
}

export function ArticleList({ feedId }: ArticleListProps) {
  useSync();

  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useArticles(feedId);

  const handleRead = useCallback(
    (ids: string[]) => {
      // Mark as read locally
      setReadIds((prev) => new Set([...prev, ...ids]));

      // Update sidebar unread counts
      queryClient.invalidateQueries({ queryKey: ["feeds"] });

      // Persist to server
      fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: ids }),
      }).catch(() => {});
    },
    [queryClient]
  );

  const { observe, unobserve } = useReadObserver(handleRead);

  const allArticles = data?.pages.flatMap((p) => p.articles) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 animate-pulse"
          >
            <div className="flex gap-2 mb-3">
              <div className="w-3 h-3 rounded-sm bg-neutral-200 dark:bg-neutral-700" />
              <div className="w-24 h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="w-3/4 h-4 rounded bg-neutral-200 dark:bg-neutral-700 mb-2" />
            <div className="w-full h-3 rounded bg-neutral-100 dark:bg-neutral-800 mb-1" />
            <div className="w-2/3 h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400 mb-3">Error al cargar artículos</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  if (allArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox size={40} className="text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Todo al día</p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
          No hay artículos nuevos en los últimos 3 días
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isRead={readIds.has(article.id)}
          onObserve={observe}
          onUnobserve={unobserve}
        />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors font-medium shadow-sm"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cargando...
              </>
            ) : (
              "Cargar más artículos"
            )}
          </button>
        </div>
      )}

      {!hasNextPage && allArticles.length > 0 && (
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 py-6">
          Has llegado al final · {allArticles.length} artículos
        </p>
      )}
    </div>
  );
}
