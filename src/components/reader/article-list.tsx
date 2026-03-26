"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useArticles } from "@/hooks/use-articles";
import { useReadObserver } from "@/hooks/use-read-observer";
import { useSync } from "@/hooks/use-sync";
import { ArticleCard } from "./article-card";
import { CheckCheck, Inbox, Loader2, RefreshCw } from "lucide-react";

interface ArticleListProps {
  feedId: string | null;
  mainRef: React.RefObject<HTMLElement | null>;
  onArticleClick: (id: string) => void;
}

export function ArticleList({ feedId, mainRef, onArticleClick }: ArticleListProps) {
  useSync();

  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useArticles(feedId);

  // Derive articles early so callbacks can reference it
  const allArticles = data?.pages.flatMap((p) => p.articles) ?? [];


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

  const syncAndRefresh = useCallback(() => {
    return fetch("/api/sync", { method: "POST" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["articles", feedId] });
        queryClient.invalidateQueries({ queryKey: ["feeds"] });
      })
      .catch(() => {});
  }, [queryClient, feedId]);

  const handleMarkRead = useCallback(
    (id: string) => {
      handleRead([id]);
      syncAndRefresh();
    },
    [handleRead, syncAndRefresh]
  );

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = allArticles.filter((a) => !readIds.has(a.id)).map((a) => a.id);
    if (unreadIds.length === 0) return;
    setMarkingAll(true);
    handleRead(unreadIds);
    await syncAndRefresh();
    setMarkingAll(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [allArticles, readIds, handleRead, syncAndRefresh, mainRef]);

  const { observe, unobserve } = useReadObserver(handleRead, mainRef);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingRef.current = isFetchingNextPage;
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = mainRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPageRef.current && !isFetchingRef.current) {
          fetchNextPageRef.current();
        }
      },
      { root: container, threshold: 0, rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainRef]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 120, gap: 16 }}>
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span className="text-sm text-neutral-400 dark:text-neutral-500">Cargando noticias...</span>
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

  const hasUnread = allArticles.some((a) => !readIds.has(a.id));

  return (
    <div className="space-y-3 pb-8">
      {allArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isRead={readIds.has(article.id)}
          onObserve={observe}
          onUnobserve={unobserve}
          onMarkRead={handleMarkRead}
          onClick={() => onArticleClick(article.id)}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-neutral-400 dark:text-neutral-500" />
        </div>
      )}

      {/* Mark all read button — always visible when there are unread articles */}
      {hasUnread && (
        <div className="flex flex-col items-center gap-2 py-6">
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {markingAll
              ? <><Loader2 size={14} className="animate-spin" /> Actualizando...</>
              : <><CheckCheck size={14} className="text-green-500" /> Marcar sección como leída</>
            }
          </button>
        </div>
      )}

      {!hasUnread && allArticles.length > 0 && (
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 py-4">
          {allArticles.length} artículo{allArticles.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
