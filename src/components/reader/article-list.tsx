"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useArticles } from "@/hooks/use-articles";
import { useReadObserver } from "@/hooks/use-read-observer";
import { ArticleCard } from "./article-card";
import { CheckCheck, Inbox, Loader2, RefreshCw } from "lucide-react";

import type { Article } from "@/hooks/use-articles";

interface ArticleListProps {
  feedId: string | null;
  feedType?: string | null;
  mainRef: React.RefObject<HTMLElement | null>;
  onOpenArticle: (article: Article) => void;
  fontSize?: number;
}

export function ArticleList({ feedId, feedType, mainRef, onOpenArticle, fontSize = 14 }: ArticleListProps) {
  const queryClient = useQueryClient();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  // Keep a ref so pagehide handler always sees the latest readIds
  const readIdsRef = useRef<Set<string>>(new Set());

  // Restore readIds from sessionStorage on mount (survives client-side navigation)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("readIds");
      if (saved) {
        const restored = new Set<string>(JSON.parse(saved));
        setReadIds(restored);
        readIdsRef.current = restored;
      }
    } catch {}
  }, []);

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

  // Mark as read locally only — articles stay in the list until flush.
  // Update ref and sessionStorage synchronously so pagehide always sees
  // the latest state even if React hasn't flushed the render yet.
  const markRead = useCallback((ids: string[]) => {
    const next = new Set([...readIdsRef.current, ...ids]);
    readIdsRef.current = next;
    try { sessionStorage.setItem("readIds", JSON.stringify([...next])); } catch {}
    setReadIds(next);
    flushToDB(ids);
  }, []);

  const handleScrollRead = useCallback((ids: string[]) => markRead(ids), [markRead]);

  const handleMarkRead = useCallback((id: string) => {
    markRead([id]);
  }, [markRead]);

  // Flush pending reads to DB and update sidebar counter
  function flushToDB(ids: string[]) {
    if (ids.length === 0) return;
    fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleIds: ids }),
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["feeds"] }))
      .catch(() => {});
  }

  // "Completar sección": flush all visible articles to DB then refresh
  const handleMarkAllRead = useCallback(async () => {
    const allIds = allArticles.map((a) => a.id);
    if (allIds.length === 0) return;
    setMarkingAll(true);
    setReadIds(new Set(allIds));
    readIdsRef.current = new Set(allIds);
    flushToDB(allIds);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["articles"] }),
      queryClient.invalidateQueries({ queryKey: ["feeds"] }),
    ]);
    setMarkingAll(false);
    setReadIds(new Set());
    readIdsRef.current = new Set();
    try { sessionStorage.removeItem("readIds"); } catch {}
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [allArticles, queryClient, mainRef]);

  const { observe, unobserve, pendingIdsRef } = useReadObserver(handleScrollRead, mainRef);

  // On page close/refresh/background: flush via sendBeacon so the request survives navigation.
  // Merge readIdsRef (already processed) with pendingIdsRef (observer debounce not yet fired).
  // pagehide: desktop + Android. visibilitychange hidden: iOS Safari and mobile app switch.
  useEffect(() => {
    function flush() {
      const ids = new Set([...readIdsRef.current, ...pendingIdsRef.current]);
      if (ids.size === 0) return;
      const blob = new Blob([JSON.stringify({ articleIds: [...ids] })], { type: "application/json" });
      navigator.sendBeacon("/api/read", blob);
      // Clear so a second flush (e.g. pagehide after visibilitychange) doesn't double-send
      readIdsRef.current = new Set();
      pendingIdsRef.current.clear();
      try { sessionStorage.removeItem("readIds"); } catch {}
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pendingIdsRef]);

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
            try {
              await queryClient.invalidateQueries({ queryKey: ["feeds"] });
              const result = await refetch();
              const articles = result.data?.pages.flatMap((p) => p.articles) ?? [];
              if (articles.length === 0) {
                setRefreshMsg("No hay artículos nuevos por ahora");
              }
            } catch {
              setRefreshMsg("Error al consultar");
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

  return (
    <div className="space-y-3 pb-8" style={{ "--reader-fs": `${fontSize}px` } as React.CSSProperties}>
      {allArticles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isRead={readIds.has(article.id)}
          onObserve={observe}
          onUnobserve={unobserve}
          onMarkRead={handleMarkRead}
          onOpen={onOpenArticle}
        />
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-neutral-400 dark:text-neutral-500" />
        </div>
      )}

      {/* Completar sección — only when no more pages to load */}
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
