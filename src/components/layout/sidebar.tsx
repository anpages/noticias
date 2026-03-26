"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddFeedForm } from "@/components/feeds/add-feed-form";
import { FeedItem } from "@/components/feeds/feed-item";
import { Rss, RefreshCw, X } from "lucide-react";

interface Feed {
  id: string;
  title: string | null;
  url: string;
  favicon: string | null;
  unreadCount: number;
}

interface SidebarProps {
  activeFeedId: string | null;
  onFeedSelect: (feedId: string | null) => void;
  open: boolean;
  onClose: () => void;
}

function SidebarInner({
  activeFeedId,
  onFeedSelect,
  onClose,
  showClose,
}: {
  activeFeedId: string | null;
  onFeedSelect: (id: string | null) => void;
  onClose?: () => void;
  showClose?: boolean;
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
      await fetch("/api/sync", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } finally {
      setSyncing(false);
    }
  }

  const totalUnread = feeds.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

  function select(id: string | null) {
    onFeedSelect(id);
    onClose?.();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-4 pb-2 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Fuentes
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar todos los feeds"
            className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          </button>
          {showClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <AddFeedForm />

      {/* Feed list */}
      <nav style={{ flex: 1, overflowY: "auto" }} className="px-1.5 pb-4 space-y-0.5">
        <button
          onClick={() => select(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
            activeFeedId === null
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Rss size={14} className="shrink-0" />
          <span className="flex-1 text-left">Todos</span>
          {totalUnread > 0 && (
            <span className="shrink-0 text-xs font-medium tabular-nums bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {totalUnread > 999 ? "999+" : totalUnread}
            </span>
          )}
        </button>

        {feeds.map((feed) => (
          <FeedItem
            key={feed.id}
            id={feed.id}
            title={feed.title}
            url={feed.url}
            favicon={feed.favicon}
            unreadCount={feed.unreadCount || 0}
            isActive={activeFeedId === feed.id}
            onClick={() => select(feed.id)}
          />
        ))}

        {feeds.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-6 px-3 leading-relaxed">
            Pega una URL de feed RSS arriba para empezar
          </p>
        )}
      </nav>
    </div>
  );
}

export function Sidebar({ activeFeedId, onFeedSelect, open, onClose }: SidebarProps) {
  return (
    <>
      {/*
       * DESKTOP SIDEBAR
       * Rendered in normal flow. Inline styles to guarantee correct sizing
       * regardless of Tailwind v4 responsive behavior.
       */}
      <aside
        className="hidden md:block border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
        style={{ width: 256, flexShrink: 0, overflowY: "hidden" }}
      >
        <SidebarInner
          activeFeedId={activeFeedId}
          onFeedSelect={onFeedSelect}
        />
      </aside>

      {/*
       * MOBILE DRAWER
       * Fixed overlay, outside normal flow, only visible on < md.
       */}
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="md:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.45)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.25s ease",
          }}
          aria-hidden="true"
        />
        {/* Panel */}
        <aside
          className="md:hidden border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: 280,
            zIndex: 50,
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease",
          }}
        >
          <SidebarInner
            activeFeedId={activeFeedId}
            onFeedSelect={onFeedSelect}
            onClose={onClose}
            showClose
          />
        </aside>
      </>
    </>
  );
}
