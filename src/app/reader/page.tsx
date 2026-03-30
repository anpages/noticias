"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ArticleList } from "@/components/reader/article-list";
import { ArticleModal } from "@/components/reader/article-modal";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useFontSize } from "@/hooks/use-font-size";
import type { Article } from "@/hooks/use-articles";

export default function ReaderPage() {
  const [selection, setSelection] = useState<string | null>(null);
  const feedType = selection?.startsWith("type:") ? selection.slice(5) : (selection ? null : "rss");
  const feedId = selection?.startsWith("type:") ? null : selection;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sidebar") !== "hidden";
  });
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const { fontSize, increase, decrease, isMin, isMax } = useFontSize();

  function handleSelect(value: string | null) {
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
              fontSize={fontSize}
              onFontIncrease={increase}
              onFontDecrease={decrease}
              fontSizeMin={isMin}
              fontSizeMax={isMax}
            />
          </div>
        )}

        {!isDesktop && (
          <Sidebar
            selection={selection}
            onSelect={handleSelect}
            isDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            fontSize={fontSize}
            onFontIncrease={increase}
            onFontDecrease={decrease}
            fontSizeMin={isMin}
            fontSizeMax={isMax}
          />
        )}

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
              onOpenArticle={setOpenArticle}
              fontSize={fontSize}
            />
          </div>
        </main>
      </div>

      <ArticleModal
        article={openArticle}
        onClose={() => setOpenArticle(null)}
        fontSize={fontSize}
      />
    </div>
  );
}
