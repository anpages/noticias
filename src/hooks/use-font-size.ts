"use client";

import { useCallback, useState } from "react";

const SIZES = [12, 13, 14, 15, 16, 17, 18];
const DEFAULT_IDX = 2; // 14px
const KEY = "reader-font-size";

export function useFontSize() {
  const [idx, setIdx] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_IDX;
    const saved = localStorage.getItem(KEY);
    if (saved !== null) {
      const n = parseInt(saved, 10);
      const i = SIZES.indexOf(n);
      return i >= 0 ? i : DEFAULT_IDX;
    }
    return DEFAULT_IDX;
  });

  const increase = useCallback(() => {
    setIdx((i) => {
      const next = Math.min(i + 1, SIZES.length - 1);
      localStorage.setItem(KEY, String(SIZES[next]));
      return next;
    });
  }, []);

  const decrease = useCallback(() => {
    setIdx((i) => {
      const next = Math.max(i - 1, 0);
      localStorage.setItem(KEY, String(SIZES[next]));
      return next;
    });
  }, []);

  return {
    fontSize: SIZES[idx],
    increase,
    decrease,
    isMin: idx === 0,
    isMax: idx === SIZES.length - 1,
  };
}
