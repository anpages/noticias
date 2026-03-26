"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AddFeedForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error añadiendo el feed");
        return;
      }

      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 pb-3">
      <div className="flex gap-1.5">
        <input
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          placeholder="https://feed.example.com/rss"
          className={cn(
            "flex-1 min-w-0 text-sm px-2.5 py-1.5 rounded-md border",
            "bg-white dark:bg-neutral-900",
            "text-neutral-900 dark:text-neutral-100",
            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            error
              ? "border-red-400 dark:border-red-600"
              : "border-neutral-200 dark:border-neutral-700"
          )}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shrink-0"
          aria-label="Añadir feed"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
