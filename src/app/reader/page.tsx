"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ArticleList } from "@/components/reader/article-list";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export default function ReaderPage() {
  const [selection, setSelection] = useState<string | null>(null);

  // Parse selection: UUID = specific feed, null = all RSS
  const feedType = selection?.startsWith("type:") ? selection.slice(5) : (selection ? null : "rss");
  const feedId = selection?.startsWith("type:") ? null : selection;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sidebar") !== "hidden";
  });
  const mainRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();

  // Restore scroll position when returning from an article (mobile page unload/reload)
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const saved = sessionStorage.getItem("reader-scroll");
    if (saved && mainRef.current) {
      mainRef.current.scrollTop = parseInt(saved, 10);
    }
    sessionStorage.removeItem("reader-scroll");

    function saveScroll() {
      if (mainRef.current && mainRef.current.scrollTop > 0) {
        sessionStorage.setItem("reader-scroll", String(mainRef.current.scrollTop));
      }
    }

    window.addEventListener("pagehide", saveScroll);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveScroll();
    });

    return () => {
      window.removeEventListener("pagehide", saveScroll);
    };
  }, []);

  // Clear saved scroll when the user deliberately changes feed
  function handleSelect(value: string | null) {
    sessionStorage.removeItem("reader-scroll");
    setSelection(value);
  }

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
              selection={selection}
              onSelect={handleSelect}
              onCollapse={() => { setSidebarVisible(false); localStorage.setItem("sidebar", "hidden"); }}
            />
          </div>
        )}

        {/* Mobile drawer — only rendered when mobile */}
        {!isDesktop && (
          <Sidebar
            selection={selection}
            onSelect={handleSelect}
            isDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
        )}

        {/* Main content — always visible */}
        <main
          ref={mainRef}
          style={{ flex: 1, overflowY: "auto", minWidth: 0 }}
          className="bg-[#f1f1f2] dark:bg-[#08080a]"
        >
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <ArticleList
              feedId={feedId}
              feedType={feedType}
              mainRef={mainRef}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
