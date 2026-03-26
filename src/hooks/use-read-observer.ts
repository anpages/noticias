"use client";

import { useCallback, useEffect, useRef } from "react";

const FLUSH_INTERVAL = 1500;
// Article is "read" when its bottom edge passes this point from the top of viewport
const READ_THRESHOLD_PX = 120;

export function useReadObserver(onRead: (ids: string[]) => void) {
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
    const container = document.querySelector("main") ?? window;

    const handleScroll = () => {
      // Find all article elements that have been scrolled past
      document.querySelectorAll<HTMLElement>("[data-article-id]").forEach((el) => {
        const id = el.dataset.articleId;
        if (!id || pendingIds.current.has(id)) return;

        const rect = el.getBoundingClientRect();
        // Mark as read when the bottom of the article goes above READ_THRESHOLD_PX from top
        if (rect.bottom < READ_THRESHOLD_PX) {
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
  }, [flush]);

  // No-op — scroll handler finds articles by DOM query, no registration needed
  const observe = useCallback((_el: HTMLElement | null) => {}, []);
  const unobserve = useCallback((_el: HTMLElement | null) => {}, []);

  return { observe, unobserve };
}
