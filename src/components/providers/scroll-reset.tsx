"use client";

import { useEffect } from "react";

export function ScrollReset() {
  useEffect(() => {
    // Disable browser scroll restoration so it never fires our read handler on reload
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    // Always start at top
    window.scrollTo(0, 0);
  }, []);

  return null;
}
