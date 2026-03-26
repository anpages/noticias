"use client";

import { useCallback, useEffect, useRef } from "react";

const FLUSH_INTERVAL = 1500;
const READ_THRESHOLD_PX = 120;

export function useReadObserver(
  onRead: (ids: string[]) => void,
  scrollContainerRef: React.RefObject<HTMLElement | null>
) {
  const pendingIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const flush = useCallback(() => {
    const ids = Array.from(pendingIds.current);
    if (ids.length === 0) return;
    pendingIds.current.clear();
    onReadRef.current(ids);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();

      document.querySelectorAll<HTMLElement>("[data-article-id]").forEach((el) => {
        const id = el.dataset.articleId;
        if (!id || pendingIds.current.has(id)) return;

        const rect = el.getBoundingClientRect();
        // Mark as read when the bottom of the article scrolls past READ_THRESHOLD_PX
        // below the top of the scroll container
        if (rect.bottom < containerRect.top + READ_THRESHOLD_PX) {
          pendingIds.current.add(id);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(flush, FLUSH_INTERVAL);
        }
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [flush, scrollContainerRef]);

  const observe = useCallback((_el: HTMLElement | null) => {}, []);
  const unobserve = useCallback((_el: HTMLElement | null) => {}, []);

  return { observe, unobserve };
}
