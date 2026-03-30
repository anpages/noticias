"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddFeedForm } from "@/components/feeds/add-feed-form";
import { FeedItem } from "@/components/feeds/feed-item";
import { Rss, RefreshCw, X, PanelLeftClose, ChevronDown, ALargeSmall } from "lucide-react";


interface Feed {
  id: string;
  type: string;
  title: string | null;
  url: string;
  favicon: string | null;
  unreadCount: number;
}

interface SidebarProps {
  selection: string | null;
  onSelect: (value: string | null) => void;
  open?: boolean;
  onClose?: () => void;
  isDrawer?: boolean;
  onCollapse?: () => void;
  fontSize?: number;
  onFontIncrease?: () => void;
  onFontDecrease?: () => void;
  fontSizeMin?: boolean;
  fontSizeMax?: boolean;
}

function FeedsSection({
  feeds,
  selection,
  onSelect,
  isDrawer,
  onClose,
}: {
  feeds: Feed[];
  selection: string | null;
  onSelect: (value: string | null) => void;
  isDrawer?: boolean;
  onClose?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  function select(value: string | null) {
    onSelect(value);
    if (isDrawer) onClose?.();
  }

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("cat_rss", next ? "collapsed" : "open");
  }

  if (feeds.length === 0) return null;

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={toggleCollapse}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
        className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
      >
        <ChevronDown
          size={12}
          style={{ transition: "transform 0.2s", transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}
        />
        <span className="flex items-center gap-1.5">
          <Rss size={13} />
          Fuentes
        </span>
        <span className="text-neutral-300 dark:text-neutral-600" style={{ marginLeft: "auto", fontSize: 10 }}>
          {feeds.length}
        </span>
      </button>

      {!collapsed && (
        <div>
          {feeds.map((feed) => (
            <FeedItem
              key={feed.id}
              id={feed.id}
              type={feed.type}
              title={feed.title}
              url={feed.url}
              favicon={feed.favicon}
              unreadCount={feed.unreadCount || 0}
              isActive={selection === feed.id}
              onClick={() => select(feed.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  selection,
  onSelect,
  onClose,
  isDrawer,
  onCollapse,
  fontSize,
  onFontIncrease,
  onFontDecrease,
  fontSizeMin,
  fontSizeMax,
}: {
  selection: string | null;
  onSelect: (value: string | null) => void;
  onClose?: () => void;
  isDrawer?: boolean;
  onCollapse?: () => void;
  fontSize?: number;
  onFontIncrease?: () => void;
  onFontDecrease?: () => void;
  fontSizeMin?: boolean;
  fontSizeMax?: boolean;
}) {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: feeds = [] } = useQuery<Feed[]>({
    queryKey: ["feeds"],
    queryFn: () => fetch("/api/feeds").then((r) => r.json()),
  });

  async function handleSync() {
    setSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["feeds"] });
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
    } finally {
      setSyncing(false);
    }
  }

  function select(value: string | null) {
    onSelect(value);
    if (isDrawer) onClose?.();
  }

  const rssFeeds = feeds.filter((f) => !f.type || f.type === "rss");
  const rssUnread = rssFeeds.reduce((acc, f) => acc + (Number(f.unreadCount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 12px 8px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}
          className="text-neutral-400 dark:text-neutral-500">
          Fuentes
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar"
            style={{ padding: 6, borderRadius: 6 }}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          </button>
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Ocultar sidebar"
              style={{ padding: 6, borderRadius: 6 }}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
          {isDrawer && (
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 6 }}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <AddFeedForm />

      {/* Feed navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 6px 16px" }}>
        {/* === Top-level filter button === */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => select(null)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, textAlign: "left", fontSize: 14, transition: "background 0.15s" }}
            className={selection === null || selection === "type:rss"
              ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-[inset_3px_0_0_0_#3b82f6] dark:shadow-[inset_3px_0_0_0_#60a5fa]"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-white/[0.04]"
            }
          >
            <Rss size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Noticias</span>
            {rssUnread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: "center", padding: "1px 6px", borderRadius: 999 }}
                className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {rssUnread > 999 ? "999+" : rssUnread}
              </span>
            )}
          </button>
        </div>

        {/* === Collapsible feed list === */}
        <div style={{ borderTop: "1px solid", paddingTop: 8 }} className="border-neutral-200 dark:border-neutral-800">
          <FeedsSection
            feeds={rssFeeds}
            selection={selection}
            onSelect={onSelect}
            isDrawer={isDrawer}
            onClose={onClose}
          />
        </div>

        {feeds.length === 0 && (
          <p style={{ fontSize: 12, textAlign: "center", padding: "24px 12px", lineHeight: 1.5 }}
            className="text-neutral-400 dark:text-neutral-500">
            Busca feeds RSS para empezar
          </p>
        )}
      </nav>

      {/* Font size control */}
      {onFontIncrease && onFontDecrease && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid" }}
          className="border-neutral-200 dark:border-neutral-800">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ALargeSmall size={13} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}
              className="text-neutral-400 dark:text-neutral-500">
              Texto
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <button
                onClick={onFontDecrease}
                disabled={fontSizeMin}
                title="Reducir texto"
                style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, lineHeight: 1 }}
                className="text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                A
              </button>
              <span style={{ fontSize: 11, minWidth: 26, textAlign: "center", tabularNums: true } as React.CSSProperties}
                className="text-neutral-400 dark:text-neutral-500 font-medium">
                {fontSize}
              </span>
              <button
                onClick={onFontIncrease}
                disabled={fontSizeMax}
                title="Aumentar texto"
                style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 700, lineHeight: 1 }}
                className="text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                A
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ selection, onSelect, open = false, onClose, isDrawer = false, onCollapse, fontSize, onFontIncrease, onFontDecrease, fontSizeMin, fontSizeMax }: SidebarProps) {
  if (isDrawer) {
    return (
      <>
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.45)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.25s",
          }}
        />
        <div
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 50,
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s ease",
          }}
          className="bg-white/70 dark:bg-neutral-950/80 backdrop-blur-xl border-r border-neutral-200/60 dark:border-white/[0.05]"
        >
          <SidebarContent
            selection={selection}
            onSelect={onSelect}
            onClose={onClose}
            isDrawer
            fontSize={fontSize}
            onFontIncrease={onFontIncrease}
            onFontDecrease={onFontDecrease}
            fontSizeMin={fontSizeMin}
            fontSizeMax={fontSizeMax}
          />
        </div>
      </>
    );
  }

  return (
    <div
      style={{ width: 256, minWidth: 256, overflow: "hidden", height: "100%" }}
      className="bg-white/70 dark:bg-neutral-950/80 backdrop-blur-xl border-r border-neutral-200/60 dark:border-white/[0.05]"
    >
      <SidebarContent
        selection={selection}
        onSelect={onSelect}
        onCollapse={onCollapse}
        fontSize={fontSize}
        onFontIncrease={onFontIncrease}
        onFontDecrease={onFontDecrease}
        fontSizeMin={fontSizeMin}
        fontSizeMax={fontSizeMax}
      />
    </div>
  );
}
