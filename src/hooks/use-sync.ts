"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const key = "rss-synced";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

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
