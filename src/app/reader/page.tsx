"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ArticleList } from "@/components/reader/article-list";
import { ArticleView } from "@/components/reader/article-view";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export default function ReaderPage() {
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sidebar") !== "hidden";
  });
  const mainRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, []);

  // Close drawer when switching to desktop
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      <Header
        showMenuButton={!isDesktop || !sidebarVisible}
        onMenuClick={() => {
          if (isDesktop) { setSidebarVisible(true); localStorage.setItem("sidebar", "visible"); }
          else setDrawerOpen(true);
        }}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Desktop sidebar — collapsible with animation */}
        {isDesktop && (
          <div style={{
            width: sidebarVisible ? 256 : 0,
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 0.25s ease",
            height: "100%",
          }}>
            <Sidebar
              activeFeedId={activeFeedId}
              onFeedSelect={setActiveFeedId}
              onCollapse={() => { setSidebarVisible(false); localStorage.setItem("sidebar", "hidden"); }}
            />
          </div>
        )}

        {/* Mobile drawer — only rendered when mobile */}
        {!isDesktop && (
          <Sidebar
            activeFeedId={activeFeedId}
            onFeedSelect={setActiveFeedId}
            isDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        )}

        {/* Main content — always visible */}
        <main
          ref={mainRef}
          style={{ flex: 1, overflowY: "auto", minWidth: 0 }}
          className="bg-neutral-50 dark:bg-neutral-950"
        >
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            {activeArticleId ? (
              <ArticleView
                articleId={activeArticleId}
                onBack={() => { setActiveArticleId(null); }}
              />
            ) : (
              <ArticleList
                feedId={activeFeedId}
                mainRef={mainRef}
                onArticleClick={(id) => {
                  setActiveArticleId(id);
                  if (mainRef.current) mainRef.current.scrollTop = 0;
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
