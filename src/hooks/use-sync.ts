"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const SYNC_KEY = "rss-last-sync";

export function useSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const lastSync = Number(localStorage.getItem(SYNC_KEY) || "0");
    const now = Date.now();

    if (now - lastSync < SYNC_INTERVAL_MS) return;

    localStorage.setItem(SYNC_KEY, String(now));

    fetch("/api/sync", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.newArticles > 0) {
          queryClient.invalidateQueries({ queryKey: ["articles"] });
          queryClient.invalidateQueries({ queryKey: ["feeds"] });
        }
      })
      .catch(() => {});
  }, [queryClient]);
}
