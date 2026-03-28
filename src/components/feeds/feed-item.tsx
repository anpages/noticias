"use client";

import { useState } from "react";
import { Trash2, Rss } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Image from "next/image";

function FallbackIcon() {
  return <Rss size={12} className="text-neutral-400" />;
}

interface FeedItemProps {
  id: string;
  type: string;
  title: string | null;
  url: string;
  favicon: string | null;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

export function FeedItem({ id, type, title, url, favicon, unreadCount: rawCount, isActive, onClick }: FeedItemProps) {
  const unreadCount = Number(rawCount) || 0;
  const [imgError, setImgError] = useState(false);
  const queryClient = useQueryClient();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${title || url}"?`)) return;

    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["feeds"] });
    queryClient.invalidateQueries({ queryKey: ["articles"] });
  }

  const displayTitle = title || new URL(url).hostname;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={cn(
        "group w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer",
        isActive
          ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-[inset_3px_0_0_0_#3b82f6] dark:shadow-[inset_3px_0_0_0_#60a5fa]"
          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-white/[0.04]"
      )}
    >
      <span className="shrink-0 w-4 h-4 flex items-center justify-center">
        {favicon && !imgError ? (
          <Image
            src={favicon}
            alt=""
            width={14}
            height={14}
            className="rounded-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <FallbackIcon />
        )}
      </span>
      <span className="flex-1 truncate">{displayTitle}</span>
      {unreadCount > 0 && (
        <span className="shrink-0 text-xs font-medium tabular-nums bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"
        aria-label="Eliminar feed"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
