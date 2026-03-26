"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FLUSH_INTERVAL = 2000;

export function useReadObserver(onRead: (ids: string[]) => void) {
  const pendingIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const onReadRef = useRef(onRead);
  const [scrolled, setScrolled] = useState(false);
  onReadRef.current = onRead;

  const flush = useCallback(() => {
    const ids = Array.from(pendingIds.current);
    if (ids.length === 0) return;
    pendingIds.current.clear();
    onReadRef.current(ids);
  }, []);

  // Only activate after the user has scrolled
  useEffect(() => {
    const onScroll = () => {
      setScrolled(true);
      window.removeEventListener("scroll", onScroll, true);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  useEffect(() => {
    if (!scrolled) return;

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
  }, [scrolled, flush]);

  const observe = useCallback((el: HTMLElement | null) => {
    if (el && observerRef.current) observerRef.current.observe(el);
  }, [scrolled]); // re-run when scrolled changes so cards re-register

  const unobserve = useCallback((el: HTMLElement | null) => {
    if (el) observerRef.current?.unobserve(el);
  }, []);

  return { observe, unobserve, scrolled };
}
