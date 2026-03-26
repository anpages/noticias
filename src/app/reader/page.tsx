"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ArticleList } from "@/components/reader/article-list";

export default function ReaderPage() {
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Sidebar */}
        <Sidebar
          activeFeedId={activeFeedId}
          onFeedSelect={setActiveFeedId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main
          ref={mainRef}
          style={{ flex: 1, overflowY: "auto", minWidth: 0 }}
          className="bg-neutral-50 dark:bg-neutral-950"
        >
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <ArticleList feedId={activeFeedId} mainRef={mainRef} />
          </div>
        </main>
      </div>
    </div>
  );
}
