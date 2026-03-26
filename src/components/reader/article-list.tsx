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
  mainRef: React.RefObject<HTMLElement | null>;
}

export function ArticleList({ feedId, mainRef }: ArticleListProps) {
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
      setReadIds((prev) => new Set([...prev, ...ids]));
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleIds: ids }),
      }).catch(() => {});
    },
    [queryClient]
  );

  const { observe, unobserve } = useReadObserver(handleRead, mainRef);

  const allArticles = data?.pages.flatMap((p) => p.articles) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-pulse">
            <div className="h-44 bg-neutral-100 dark:bg-neutral-800" />
            <div className="p-4 space-y-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="w-20 h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <div className="w-4/5 h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="w-full h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="w-3/5 h-3 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">Error al cargar artículos</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  if (allArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Inbox size={28} className="text-neutral-400 dark:text-neutral-500" />
        </div>
        <p className="font-medium text-neutral-700 dark:text-neutral-300">Todo al día</p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
          Sin artículos nuevos en los últimos 3 días
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
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
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isFetchingNextPage
              ? <><Loader2 size={14} className="animate-spin" /> Cargando...</>
              : "Cargar más"}
          </button>
        </div>
      )}

      {!hasNextPage && (
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 pt-4">
          {allArticles.length} artículo{allArticles.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
