"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const FLUSH_INTERVAL = 2000;

export function useReadObserver(feedId: string | null) {
  const pendingIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const queryClient = useQueryClient();

  const flush = useCallback(async () => {
    const ids = Array.from(pendingIds.current);
    if (ids.length === 0) return;
    pendingIds.current.clear();

    // Optimistic update
    queryClient.setQueriesData(
      { queryKey: ["articles", feedId] },
      (old: { pages: { articles: { id: string; isRead: boolean }[]; nextCursor: string | null }[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            articles: page.articles.map((a) =>
              ids.includes(a.id) ? { ...a, isRead: true } : a
            ),
          })),
        };
      }
    );

    // Send to server
    await fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleIds: ids }),
    }).catch(() => {});
  }, [queryClient, feedId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.articleId;
            if (id) {
              pendingIds.current.add(id);
              observerRef.current?.unobserve(entry.target);

              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(flush, FLUSH_INTERVAL);
            }
          }
        });
      },
      { threshold: 0.8 }
    );

    return () => {
      observerRef.current?.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [flush]);

  const observe = useCallback((el: HTMLElement | null) => {
    if (el) observerRef.current?.observe(el);
  }, []);

  const unobserve = useCallback((el: HTMLElement | null) => {
    if (el) observerRef.current?.unobserve(el);
  }, []);

  return { observe, unobserve };
}
