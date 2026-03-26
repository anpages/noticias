"use client";

import { useCallback, useEffect, useRef } from "react";

const FLUSH_INTERVAL = 2000;

export function useReadObserver(onRead: (ids: string[]) => void) {
  const pendingIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const onReadRef = useRef(onRead);
  const hasScrolledRef = useRef(false); // ref, not state — visible in observer callback instantly

  onReadRef.current = onRead;

  const flush = useCallback(() => {
    const ids = Array.from(pendingIds.current);
    if (ids.length === 0) return;
    pendingIds.current.clear();
    onReadRef.current(ids);
  }, []);

  useEffect(() => {
    // Track scroll with a ref so the observer callback sees it without recreating
    const onScroll = () => { hasScrolledRef.current = true; };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Ignore all intersections until the user has actually scrolled
        if (!hasScrolledRef.current) return;

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
      window.removeEventListener("scroll", onScroll, true);
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
