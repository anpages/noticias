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
  feedType?: string | null;
  mainRef: React.RefObject<HTMLElement | null>;
}

export function ArticleList({ feedId, feedType, mainRef }: ArticleListProps) {
  useSync();

  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useArticles(feedId, feedType);

  const allArticles = data?.pages.flatMap((p) => p.articles) ?? [];

  // Scroll-based read: visual + delete from DB
  const handleScrollRead = useCallback((ids: string[]) => {
    setReadIds((prev) => new Set([...prev, ...ids]));
    fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleIds: ids }),
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    }).catch(() => {});
  }, [queryClient]);

  // Delete articles from DB and refresh
  const deleteAndRefresh = useCallback(async (ids: string[]) => {
    await fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleIds: ids }),
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["articles"] });
    queryClient.invalidateQueries({ queryKey: ["feeds"] });
  }, [queryClient]);

  // Sync feeds for new articles
  const syncFeeds = useCallback(() => {
    return fetch("/api/sync", { method: "POST" })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["articles"] });
        queryClient.invalidateQueries({ queryKey: ["feeds"] });
      })
      .catch(() => {});
  }, [queryClient]);

  // Individual mark as read: delete from DB
  const handleMarkRead = useCallback(
    async (id: string) => {
      setReadIds((prev) => new Set([...prev, id]));
      await deleteAndRefresh([id]);
    },
    [deleteAndRefresh]
  );

  // Mark all as read: delete all from DB + sync new
  const handleMarkAllRead = useCallback(async () => {
    const allIds = allArticles.map((a) => a.id);
    if (allIds.length === 0) return;
    setMarkingAll(true);
    setReadIds(new Set(allIds));
    await deleteAndRefresh(allIds);
    await syncFeeds();
    setMarkingAll(false);
    setReadIds(new Set());
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [allArticles, deleteAndRefresh, syncFeeds, mainRef]);

  const { observe, unobserve } = useReadObserver(handleScrollRead, mainRef);

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
  }, [mainRef, allArticles.length]);

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
          No hay artículos pendientes
        </p>
        <button
          onClick={async () => {
            setRefreshing(true);
            setRefreshMsg(null);
            localStorage.removeItem("rss-last-sync");
            try {
              const res = await fetch("/api/sync", { method: "POST" });
              const data = await res.json();
              queryClient.invalidateQueries({ queryKey: ["feeds"] });
              await refetch();
              if (data.newArticles === 0) {
                setRefreshMsg("No hay artículos nuevos por ahora");
              }
            } catch {
              setRefreshMsg("Error al sincronizar");
            } finally {
              setRefreshing(false);
            }
          }}
          disabled={refreshing}
          className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
        >
          {refreshing
            ? <><Loader2 size={14} className="animate-spin" /> Buscando...</>
            : <><RefreshCw size={14} /> Buscar nuevos artículos</>
          }
        </button>
        {refreshMsg && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">{refreshMsg}</p>
        )}
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
        />
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-neutral-400 dark:text-neutral-500" />
        </div>
      )}

      {/* Mark all read — only when no more pages to load */}
      {!hasNextPage && !isFetchingNextPage && allArticles.length > 0 && (
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

    </div>
  );
}
