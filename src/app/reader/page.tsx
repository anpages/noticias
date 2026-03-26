"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ArticleList } from "@/components/reader/article-list";

export default function ReaderPage() {
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Disable browser scroll restoration and reset to top on every load
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Sidebar activeFeedId={activeFeedId} onFeedSelect={setActiveFeedId} />
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950"
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ArticleList feedId={activeFeedId} mainRef={mainRef} />
        </div>
      </main>
    </>
  );
}
