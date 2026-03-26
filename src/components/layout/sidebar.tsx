"use client";

import { useQuery } from "@tanstack/react-query";
import { AddFeedForm } from "@/components/feeds/add-feed-form";
import { FeedItem } from "@/components/feeds/feed-item";
import { Rss, RefreshCw, X } from "lucide-react";
import { useState } from "react";

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

function SidebarContent({
  activeFeedId,
  onFeedSelect,
  onClose,
  showClose,
}: {
  activeFeedId: string | null;
  onFeedSelect: (id: string | null) => void;
  onClose: () => void;
  showClose?: boolean;
}) {
  const [syncing, setSyncing] = useState(false);

  const { data: feeds = [] } = useQuery<Feed[]>({
    queryKey: ["feeds"],
    queryFn: () => fetch("/api/feeds").then((r) => r.json()),
  });

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/sync", { method: "POST" });
    setSyncing(false);
    window.location.reload();
  }

  const totalUnread = feeds.reduce((acc, f) => acc + (f.unreadCount || 0), 0);

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-4 pb-2 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Fuentes
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-50 p-1 rounded"
            aria-label="Sincronizar feeds"
            title="Actualizar todos los feeds"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          </button>
          {showClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1 rounded"
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <AddFeedForm />

      <nav className="flex-1 overflow-y-auto px-1.5 pb-4 space-y-0.5">
        <button
          onClick={() => { onFeedSelect(null); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
            activeFeedId === null
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Rss size={14} className="shrink-0" />
          <span className="flex-1">Todos los artículos</span>
          {totalUnread > 0 && (
            <span className="shrink-0 text-xs font-medium tabular-nums bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5">
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
            onClick={() => { onFeedSelect(feed.id); onClose(); }}
          />
        ))}

        {feeds.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-4 px-3">
            Añade una URL de feed RSS para empezar
          </p>
        )}
      </nav>
    </>
  );
}

export function Sidebar({ activeFeedId, onFeedSelect, open, onClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop/tablet sidebar (md+): always visible in normal flow ── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
        <SidebarContent
          activeFeedId={activeFeedId}
          onFeedSelect={onFeedSelect}
          onClose={() => {}}
        />
      </aside>

      {/* ── Mobile drawer (< md): overlay + slide-in panel ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-40 flex flex-col
          bg-neutral-50 dark:bg-neutral-900
          border-r border-neutral-200 dark:border-neutral-800
          transition-transform duration-300 ease-in-out
          md:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <SidebarContent
          activeFeedId={activeFeedId}
          onFeedSelect={onFeedSelect}
          onClose={onClose}
          showClose
        />
      </aside>
    </>
  );
}
