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
  // mobile drawer controls
  open?: boolean;
  onClose?: () => void;
  isDrawer?: boolean;
}

function SidebarContent({
  activeFeedId,
  onFeedSelect,
  onClose,
  isDrawer,
}: {
  activeFeedId: string | null;
  onFeedSelect: (id: string | null) => void;
  onClose?: () => void;
  isDrawer?: boolean;
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

  function select(id: string | null) {
    onFeedSelect(id);
    if (isDrawer) onClose?.();
  }

  const totalUnread = feeds.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

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

      {/* Feed list */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 6px 16px" }}>
        <button
          onClick={() => select(null)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, textAlign: "left", fontSize: 14, transition: "background 0.15s" }}
          className={activeFeedId === null
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }
        >
          <Rss size={14} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Todos</span>
          {totalUnread > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: "center", padding: "1px 6px", borderRadius: 999 }}
              className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
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
          <p style={{ fontSize: 12, textAlign: "center", padding: "24px 12px", lineHeight: 1.5 }}
            className="text-neutral-400 dark:text-neutral-500">
            Pega una URL de feed RSS arriba para empezar
          </p>
        )}
      </nav>
    </div>
  );
}

export function Sidebar({ activeFeedId, onFeedSelect, open = false, onClose, isDrawer = false }: SidebarProps) {
  if (isDrawer) {
    return (
      <>
        {/* Backdrop */}
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
        {/* Drawer panel */}
        <div
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 50,
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s ease",
          }}
          className="bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800"
        >
          <SidebarContent
            activeFeedId={activeFeedId}
            onFeedSelect={onFeedSelect}
            onClose={onClose}
            isDrawer
          />
        </div>
      </>
    );
  }

  // Desktop: inline sidebar
  return (
    <div
      style={{ width: 256, flexShrink: 0, overflow: "hidden", height: "100%" }}
      className="bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800"
    >
      <SidebarContent
        activeFeedId={activeFeedId}
        onFeedSelect={onFeedSelect}
      />
    </div>
  );
}
