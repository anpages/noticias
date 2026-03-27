"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Check, Users, Gamepad2, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MyFeed {
  id: string;
  url: string;
  type: string;
}

interface OpmlFeed {
  title: string;
  xmlUrl: string;
  description: string | null;
  htmlUrl: string | null;
}

interface SteamGame {
  appid: number;
  name: string;
  headerImage: string;
  description: string | null;
  playerCount: number;
  peakCount: number;
  feedUrl: string;
}

const RSS_CATEGORIES = [
  { id: "Tech", label: "Tecnología" },
  { id: "Programming", label: "Programación" },
  { id: "Science", label: "Ciencia" },
  { id: "Space", label: "Espacio" },
  { id: "Gaming", label: "Gaming" },
  { id: "News", label: "Noticias" },
  { id: "Business & Economy", label: "Economía" },
  { id: "Movies", label: "Cine" },
  { id: "Music", label: "Música" },
  { id: "Web Development", label: "Web Dev" },
];

function formatPlayers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function getFavicon(htmlUrl: string | null): string | null {
  if (!htmlUrl) return null;
  try {
    const host = new URL(htmlUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return null;
  }
}

function RssFeedCard({
  feed,
  followed,
  onFollow,
  adding,
}: {
  feed: OpmlFeed;
  followed: boolean;
  onFollow: (url: string) => void;
  adding: string | null;
}) {
  const favicon = getFavicon(feed.htmlUrl);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
        {favicon ? (
          <Image
            src={favicon}
            alt=""
            width={20}
            height={20}
            className="rounded-sm"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Rss size={14} className="text-neutral-400 dark:text-neutral-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate leading-tight">
          {feed.title}
        </p>
        {feed.description && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
            {feed.description}
          </p>
        )}
      </div>

      <button
        onClick={() => !followed && onFollow(feed.xmlUrl)}
        disabled={followed || adding === feed.xmlUrl}
        className={cn(
          "shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
          followed
            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-default"
            : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
        )}
      >
        {adding === feed.xmlUrl ? (
          <Loader2 size={11} className="animate-spin" />
        ) : followed ? (
          <><Check size={11} /> Siguiendo</>
        ) : (
          <><Plus size={11} /> Seguir</>
        )}
      </button>
    </div>
  );
}

function SteamGameCard({
  game,
  followed,
  onFollow,
  adding,
}: {
  game: SteamGame;
  followed: boolean;
  onFollow: (url: string) => void;
  adding: string | null;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <div className="relative w-full" style={{ aspectRatio: "460/215" }}>
        <Image
          src={game.headerImage}
          alt={game.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 320px"
          onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
        />
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight truncate">
          {game.name}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
            <Users size={11} />
            <span>{formatPlayers(game.playerCount)} jugando ahora</span>
          </div>

          <button
            onClick={() => !followed && onFollow(game.feedUrl)}
            disabled={followed || adding === game.feedUrl}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
              followed
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-default"
                : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60"
            )}
          >
            {adding === game.feedUrl ? (
              <Loader2 size={11} className="animate-spin" />
            ) : followed ? (
              <><Check size={11} /> Siguiendo</>
            ) : (
              <><Gamepad2 size={11} /> Seguir</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DiscoverView() {
  const [activeCategory, setActiveCategory] = useState<string | "steam">("Tech");
  const [adding, setAdding] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: myFeedsData = [] } = useQuery<MyFeed[]>({
    queryKey: ["feeds"],
    queryFn: () => fetch("/api/feeds").then((r) => r.json()),
  });

  const followedUrls = new Set(myFeedsData.map((f) => f.url));

  const { data: opmlData, isLoading: opmlLoading } = useQuery({
    queryKey: ["discover-opml", activeCategory],
    queryFn: () =>
      fetch(`/api/discover/opml?category=${encodeURIComponent(activeCategory)}`).then((r) => r.json()),
    enabled: activeCategory !== "steam",
    staleTime: 60 * 60 * 1000,
  });

  const { data: steamData, isLoading: steamLoading } = useQuery({
    queryKey: ["discover-steam"],
    queryFn: () => fetch("/api/discover/steam").then((r) => r.json()),
    enabled: activeCategory === "steam",
    staleTime: 5 * 60 * 1000,
  });

  async function handleFollow(url: string, type: "rss" | "steam") {
    setAdding(url);
    try {
      await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } finally {
      setAdding(null);
    }
  }

  const isLoading = activeCategory === "steam" ? steamLoading : opmlLoading;
  const rssFeeds: OpmlFeed[] = opmlData?.feeds ?? [];
  const steamGames: SteamGame[] = steamData?.games ?? [];

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        Descubre
      </h1>

      {/* Category tabs */}
      <div
        className="flex gap-2 pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800"
        style={{ overflowX: "auto", scrollbarWidth: "none" }}
      >
        {RSS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-blue-500 text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            {cat.label}
          </button>
        ))}

        <button
          onClick={() => setActiveCategory("steam")}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeCategory === "steam"
              ? "bg-blue-500 text-white"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
          )}
        >
          <Gamepad2 size={11} />
          Steam
        </button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-2 text-neutral-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      )}

      {!isLoading && activeCategory !== "steam" && (
        <div className="space-y-2">
          {rssFeeds.map((feed) => (
            <RssFeedCard
              key={feed.xmlUrl}
              feed={feed}
              followed={followedUrls.has(feed.xmlUrl)}
              onFollow={(url) => handleFollow(url, "rss")}
              adding={adding}
            />
          ))}
          {rssFeeds.length === 0 && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-12">
              No hay feeds disponibles para esta categoría
            </p>
          )}
        </div>
      )}

      {!isLoading && activeCategory === "steam" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steamGames.map((game) => (
            <SteamGameCard
              key={game.appid}
              game={game}
              followed={followedUrls.has(game.feedUrl)}
              onFollow={(url) => handleFollow(url, "steam")}
              adding={adding}
            />
          ))}
          {steamGames.length === 0 && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-12 col-span-2">
              No se pudieron cargar los datos de Steam
            </p>
          )}
        </div>
      )}
    </div>
  );
}
