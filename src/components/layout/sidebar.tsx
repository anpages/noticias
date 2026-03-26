"use client";

import { useQuery } from "@tanstack/react-query";
import { AddFeedForm } from "@/components/feeds/add-feed-form";
import { FeedItem } from "@/components/feeds/feed-item";
import { Rss, RefreshCw } from "lucide-react";
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
}

export function Sidebar({ activeFeedId, onFeedSelect }: SidebarProps) {
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

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Fuentes
        </span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
          aria-label="Sincronizar feeds"
          title="Actualizar todos los feeds"
        >
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
        </button>
      </div>

      <AddFeedForm />

      <nav className="flex-1 overflow-y-auto px-1.5 pb-3 space-y-0.5">
        <button
          onClick={() => onFeedSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors ${
            activeFeedId === null
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Rss size={14} className="shrink-0" />
          <span className="flex-1">Todos los artículos</span>
          {feeds.reduce((acc, f) => acc + (f.unreadCount || 0), 0) > 0 && (
            <span className="shrink-0 text-xs font-medium tabular-nums bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5">
              {feeds.reduce((acc, f) => acc + (f.unreadCount || 0), 0)}
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
            onClick={() => onFeedSelect(feed.id)}
          />
        ))}

        {feeds.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-4 px-3">
            Añade una URL de feed RSS para empezar
          </p>
        )}
      </nav>
    </aside>
  );
}
