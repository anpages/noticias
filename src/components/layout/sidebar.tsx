"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AddFeedForm } from "@/components/feeds/add-feed-form";
import { FeedItem } from "@/components/feeds/feed-item";
import { Rss, RefreshCw, X, PanelLeftClose, ChevronDown, Gamepad2, Compass } from "lucide-react";


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
}

interface CategoryConfig {
  type: string;
  label: string;
  icon: React.ReactNode;
  selectionKey: string;
}

const CATEGORIES: CategoryConfig[] = [
  { type: "rss", label: "Noticias", icon: <Rss size={13} />, selectionKey: "type:rss" },
  { type: "steam", label: "Steam", icon: <Gamepad2 size={13} />, selectionKey: "type:steam" },
];

function CategorySection({
  config,
  feeds,
  selection,
  onSelect,
  isDrawer,
  onClose,
}: {
  config: CategoryConfig;
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
    localStorage.setItem(`cat_${config.type}`, next ? "collapsed" : "open");
  }

  if (feeds.length === 0) return null;

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Category header — click to collapse/expand */}
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
          {config.icon}
          {config.label}
        </span>
        <span className="text-neutral-300 dark:text-neutral-600" style={{ marginLeft: "auto", fontSize: 10 }}>
          {feeds.length}
        </span>
      </button>

      {/* Individual feeds — only when expanded */}
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
}: {
  selection: string | null;
  onSelect: (value: string | null) => void;
  onClose?: () => void;
  isDrawer?: boolean;
  onCollapse?: () => void;
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

  // Group feeds by type
  const feedsByType: Record<string, Feed[]> = { rss: [], steam: [] };
  for (const feed of feeds) {
    const type = feed.type || "rss";
    if (!feedsByType[type]) feedsByType[type] = [];
    feedsByType[type].push(feed);
  }

  // Unread counts per type
  function unreadForType(type: string) {
    return (feedsByType[type] ?? []).reduce((acc, f) => acc + (Number(f.unreadCount) || 0), 0);
  }

  const rssUnread = unreadForType("rss");
  const steamUnread = unreadForType("steam");

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
        {/* === Descubre === */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => select("discover")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, textAlign: "left", fontSize: 14, transition: "background 0.15s" }}
            className={selection === "discover"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }
          >
            <Compass size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Descubre</span>
          </button>
        </div>

        <div style={{ borderTop: "1px solid", marginBottom: 8 }} className="border-neutral-200 dark:border-neutral-800" />

        {/* === Top-level filter buttons === */}
        <div style={{ marginBottom: 8 }}>
          {/* Noticias */}
          <button
            onClick={() => select("type:rss")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, textAlign: "left", fontSize: 14, transition: "background 0.15s" }}
            className={selection === "type:rss" || selection === null
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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

          {/* Steam */}
          <button
            onClick={() => select("type:steam")}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, textAlign: "left", fontSize: 14, transition: "background 0.15s" }}
            className={selection === "type:steam"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }
          >
            <Gamepad2 size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Steam</span>
            {steamUnread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: "center", padding: "1px 6px", borderRadius: 999 }}
                className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {steamUnread > 999 ? "999+" : steamUnread}
              </span>
            )}
          </button>
        </div>

        {/* === Collapsible category sections with individual feeds === */}
        <div style={{ borderTop: "1px solid", paddingTop: 8 }} className="border-neutral-200 dark:border-neutral-800">
          {CATEGORIES.map((config) => (
            <CategorySection
              key={config.type}
              config={config}
              feeds={feedsByType[config.type] ?? []}
              selection={selection}
              onSelect={onSelect}
              isDrawer={isDrawer}
              onClose={onClose}
            />
          ))}
        </div>

        {feeds.length === 0 && (
          <p style={{ fontSize: 12, textAlign: "center", padding: "24px 12px", lineHeight: 1.5 }}
            className="text-neutral-400 dark:text-neutral-500">
            Busca feeds RSS o juegos de Steam para empezar
          </p>
        )}
      </nav>
    </div>
  );
}

export function Sidebar({ selection, onSelect, open = false, onClose, isDrawer = false, onCollapse }: SidebarProps) {
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
          className="bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800"
        >
          <SidebarContent
            selection={selection}
            onSelect={onSelect}
            onClose={onClose}
            isDrawer
          />
        </div>
      </>
    );
  }

  return (
    <div
      style={{ width: 256, minWidth: 256, overflow: "hidden", height: "100%" }}
      className="bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800"
    >
      <SidebarContent
        selection={selection}
        onSelect={onSelect}
        onCollapse={onCollapse}
      />
    </div>
  );
}
