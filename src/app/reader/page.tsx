"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ArticleList } from "@/components/reader/article-list";
import { Header } from "@/components/layout/header";

export default function ReaderPage() {
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeFeedId={activeFeedId}
          onFeedSelect={setActiveFeedId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950"
        >
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <ArticleList feedId={activeFeedId} mainRef={mainRef} />
          </div>
        </main>
      </div>
    </div>
  );
}
